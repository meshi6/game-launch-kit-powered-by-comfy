import "server-only";
import { comfy, ComfyError } from "@comfyorg/sdk";
import sharp from "sharp";

// Model IDs (Comfy Router). Swap here to try other providers.
export const MODELS = {
  llm: "anthropic/claude-sonnet-5-5",
  titleLogo: "ideogram/ideogram-4-5",
  removeBg: "bria/image-edit-remove-background",
  vector: "recraft/recraftv4_1_vector",
  keyArt: "vertexai/gemini-3-pro-image",
  video: "byteplus/dreamina-seedance-2-0-fast-260128",
  sfx: "elevenlabs/eleven_sfx_v2",
  hero3d: "meshy/meshy-7.1",
  rig: "meshy/rigging",
} as const;

export function assertKey() {
  if (!process.env.COMFY_API_KEY?.trim()) {
    throw new Error("COMFY_API_KEY is not set on the server.");
  }
}

/** Run a Router model and return its JSON payload. */
export async function runJson<T = unknown>(model: string, input: unknown, timeoutMs = 280_000): Promise<T> {
  assertKey();
  const res = await comfy.models.run(model, input as Record<string, unknown>, { timeoutMs });
  if (res.kind !== "json") throw new Error(`${model} returned binary, expected JSON`);
  return res.data as T;
}

/** Run a Router model that answers with raw bytes (e.g. ElevenLabs audio). */
/**
 * Try the full request; if the model rejects it as invalid (400/422), log the
 * validation detail and retry once with only the required fields.
 */
export async function runJsonSafe<T = unknown>(model: string, full: unknown, minimal: unknown, timeoutMs?: number): Promise<T> {
  try {
    return await runJson<T>(model, full, timeoutMs);
  } catch (err) {
    const status = err instanceof ComfyError ? err.httpStatus : undefined;
    if (status !== 400 && status !== 422) throw err;
    console.warn(`[${model}] full request rejected, retrying minimal:`, JSON.stringify((err as ComfyError).details ?? {}).slice(0, 1500));
    return runJson<T>(model, minimal, timeoutMs);
  }
}

export async function runBinary(model: string, input: unknown, timeoutMs = 120_000) {
  assertKey();
  const res = await comfy.models.run(model, input as Record<string, unknown>, { timeoutMs });
  if (res.kind !== "binary") throw new Error(`${model} returned JSON, expected bytes`);
  return Buffer.from(res.data);
}

export async function fetchBuffer(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed (${r.status})`);
  return Buffer.from(await r.arrayBuffer());
}

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const i = dataUrl.indexOf(",");
  return Buffer.from(dataUrl.slice(i + 1), "base64");
}

export const toDataUrl = (buf: Buffer, mime: string) => `data:${mime};base64,${buf.toString("base64")}`;

/** Keep responses well under Vercel's 4.5 MB body limit. */
export async function asJpeg(buf: Buffer, maxWidth = 2048, quality = 86) {
  return sharp(buf).resize({ width: maxWidth, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
}

export async function asPng(buf: Buffer, maxWidth = 1600, trim = false) {
  // trim() strips the empty transparent border around a cut-out (cuts a 2.4 MB logo to a fraction)
  const trimmed = trim ? await sharp(buf).trim({ threshold: 10 }).toBuffer().catch(() => buf) : buf;
  // palette PNG keeps alpha and cuts size ~5x; stays well under Vercel's 4.5 MB response cap
  return sharp(trimmed).resize({ width: maxWidth, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 92, effort: 8 }).toBuffer();
}

/** Ask Claude for text; optionally pass images as data URLs. */
export async function claude(opts: { system?: string; prompt: string; images?: string[]; maxTokens?: number }) {
  const content: unknown[] = [];
  for (const img of opts.images ?? []) {
    const comma = img.indexOf(",");
    const mime = img.slice(5, img.indexOf(";")) || "image/jpeg";
    const data = img.slice(comma + 1);
    content.push({ type: "image", source: { type: "base64", media_type: mime, data } });
  }
  content.push({ type: "text", text: opts.prompt });
  const out = await runJson<{ content: { type: string; text?: string }[] }>(MODELS.llm, {
    max_tokens: opts.maxTokens ?? 2000,
    ...(opts.system ? { system: opts.system } : {}),
    messages: [{ role: "user", content }],
  });
  return out.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

export function extractJson<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Uniform JSON error responses for route handlers. */
export function errorResponse(err: unknown) {
  console.error(err);
  let message = err instanceof Error ? err.message : String(err);
  let status = 500;
  if (err instanceof ComfyError) {
    status = err.httpStatus && err.httpStatus >= 400 ? err.httpStatus : 502;
    if (err.code === "insufficient_credits") message = "Out of Comfy credits — top up your workspace.";
    if (err.code === "content_policy_violation") message = "The model refused this prompt (content policy). Try rewording.";
    return Response.json({ error: message, code: err.code, details: err.details ?? null }, { status });
  }
  return Response.json({ error: message }, { status });
}
