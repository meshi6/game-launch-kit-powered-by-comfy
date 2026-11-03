"use client";
import JSZip from "jszip";
import type { Brief } from "./types";
import type { Composed } from "./compose";

const b64 = (dataUrl: string) => dataUrl.slice(dataUrl.indexOf(",") + 1);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "asset";

export async function buildZip(kit: {
  brief: Brief;
  logo?: string;
  keyArt?: string;
  emblemSvg?: string;
  capsules: Composed[];
  icons: { name: string; svg: string }[];
  sounds: { name: string; audio: string }[];
  videoUrl?: string;
  trailerUrl?: string;
}) {
  const { brief } = kit;
  const zip = new JSZip();
  const root = zip.folder(slug(brief.title) + "-launch-kit")!;

  root.file("style-guide.json", JSON.stringify(brief, null, 2));
  root.file(
    "README.md",
    `# ${brief.title} — Launch Kit

> ${brief.tagline}

**Genre:** ${brief.genre}
**Mood:** ${brief.mood}
**Art style:** ${brief.artStyle}
**Lettering:** ${brief.fontVibe}

## Palette
${brief.palette.map((p) => `- ${p.name}: \`${p.hex}\``).join("\n")}

## Store copy
${brief.storeBlurb}

${brief.features.map((f) => `- ${f}`).join("\n")}

## Files
- \`brand/\` title logo (transparent PNG), emblem (SVG), key art
- \`store/\` Steam, itch.io and mobile assets at exact sizes
- \`ui-icons/\` vector in-game icons
- \`audio/\` sound kit
${kit.videoUrl || kit.trailerUrl ? "- `video/` animated title sting and game trailer\n" : ""}
Generated with Launch Kit on Comfy Router. Steam requires AI-generated content to be disclosed in the content survey.
`,
  );

  const brand = root.folder("brand")!;
  if (kit.logo) brand.file("title-logo.png", b64(kit.logo), { base64: true });
  if (kit.emblemSvg) brand.file("emblem.svg", kit.emblemSvg);
  if (kit.keyArt) brand.file("key-art.jpg", b64(kit.keyArt), { base64: true });

  const store = root.folder("store")!;
  for (const c of kit.capsules) {
    const ext = c.mime === "image/png" ? "png" : "jpg";
    store.folder(slug(c.capsule.platform))!.file(`${c.capsule.id}-${c.capsule.w}x${c.capsule.h}.${ext}`, b64(c.dataUrl), { base64: true });
  }

  const icons = root.folder("ui-icons")!;
  kit.icons.forEach((i) => icons.file(`${slug(i.name)}.svg`, i.svg));

  const audio = root.folder("audio")!;
  kit.sounds.forEach((s) => audio.file(`${slug(s.name)}.mp3`, b64(s.audio), { base64: true }));

  for (const [url, name] of [[kit.videoUrl, "title-sting"], [kit.trailerUrl, "game-trailer"]] as const) {
    if (!url) continue;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      root.folder("video")!.file(`${name}.mp4`, await r.arrayBuffer());
    } catch {
      root.folder("video")!.file(`${name}-url.txt`, url + "\n(Link expires; download it soon.)\n");
    }
  }

  return zip.generateAsync({ type: "blob" });
}
