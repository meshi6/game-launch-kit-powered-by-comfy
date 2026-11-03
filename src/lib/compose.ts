"use client";
import type { Brief, Capsule } from "./types";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Recraft SVGs may lack width/height; give them an intrinsic size so canvas can draw them. */
export function svgToDataUrl(svg: string, size = 1024) {
  let s = svg;
  if (!/<svg[^>]*\swidth=/.test(s)) s = s.replace(/<svg/, `<svg width="${size}"`);
  if (!/<svg[^>]*\sheight=/.test(s)) s = s.replace(/<svg/, `<svg height="${size}"`);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  return { c, ctx };
}

/** Crop away transparent padding around the cut-out logo. */
export async function trimLogo(src: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(src);
  const { c, ctx } = canvas(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 24) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 <= x0 || y1 <= y0) return c;
  const pad = 8;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(width, x1 + pad); y1 = Math.min(height, y1 + pad);
  const out = canvas(x1 - x0, y1 - y0);
  out.ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
  return out.c;
}

function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, w: number, h: number, focusY = 0.45) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) * focusY, dw, dh);
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement | HTMLImageElement, bx: number, by: number, bw: number, bh: number) {
  const iw = "naturalWidth" in img ? img.naturalWidth : img.width;
  const ih = "naturalHeight" in img ? img.naturalHeight : img.height;
  const s = Math.min(bw / iw, bh / ih);
  const dw = iw * s, dh = ih * s;
  ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
}

/** Where the logo sits for a given aspect ratio: fraction-of-canvas box. */
function logoBox(w: number, h: number) {
  const a = w / h;
  if (a > 2.3) return { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }; // small capsule: logo is everything
  if (a >= 1.2) return { x: 0.18, y: 0.12, w: 0.64, h: 0.5 }; // wide
  if (a > 0.9) return { x: 0.1, y: 0.08, w: 0.8, h: 0.42 }; // ~square (itch cover)
  return { x: 0.07, y: 0.62, w: 0.86, h: 0.3 }; // portrait: lower third
}

export type Composed = { capsule: Capsule; dataUrl: string; mime: "image/jpeg" | "image/png" };

export async function composeCapsule(
  capsule: Capsule,
  assets: { keyArt?: HTMLImageElement; logo?: HTMLCanvasElement; emblem?: HTMLImageElement },
  brief: Brief,
): Promise<Composed | null> {
  const { w, h } = capsule;
  const { c, ctx } = canvas(w, h);
  const dark = brief.palette[2]?.hex ?? "#111";
  const primary = brief.palette[0]?.hex ?? "#333";

  if (capsule.transparent) {
    if (!assets.logo) return null;
    drawContain(ctx, assets.logo, w * 0.05, h * 0.05, w * 0.9, h * 0.9);
    return { capsule, dataUrl: c.toDataURL("image/png"), mime: "image/png" };
  }

  if (capsule.iconOnly) {
    if (!assets.emblem) return null;
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, primary);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    drawContain(ctx, assets.emblem, w * 0.14, h * 0.14, w * 0.72, h * 0.72);
    return { capsule, dataUrl: c.toDataURL("image/png"), mime: "image/png" };
  }

  if (!assets.keyArt) return null;
  drawCover(ctx, assets.keyArt, w, h);

  if (capsule.logo && assets.logo) {
    const b = logoBox(w, h);
    // soft scrim behind the logo so it stays legible on busy art
    const cx = (b.x + b.w / 2) * w, cy = (b.y + b.h / 2) * h;
    const r = Math.max(b.w * w, b.h * h) * 0.75;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(0,0,0,0.45)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = Math.max(4, w / 120);
    drawContain(ctx, assets.logo, b.x * w, b.y * h, b.w * w, b.h * h);
    ctx.shadowBlur = 0;
  }
  return { capsule, dataUrl: c.toDataURL("image/jpeg", 0.9), mime: "image/jpeg" };
}

/** Downscale to the size Steam actually shows in search results. */
export async function thumbnail(dataUrl: string, w = 120, h = 45) {
  const img = await loadImage(dataUrl);
  const { c, ctx } = canvas(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  // upscale x4 with nearest-neighbour so the model "sees" the real pixel budget
  const big = canvas(w * 4, h * 4);
  big.ctx.imageSmoothingEnabled = false;
  big.ctx.drawImage(c, 0, 0, w * 4, h * 4);
  return { small: c.toDataURL("image/png"), big: big.c.toDataURL("image/png") };
}

/** Shrink a user photo before upload (phones produce 5-12 MB images). */
export async function shrinkUpload(file: File, max = 1280): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const { c, ctx } = canvas(Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s));
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
