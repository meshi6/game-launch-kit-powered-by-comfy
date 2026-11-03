import "server-only";
import { MODELS, fetchBuffer, hexToRgb, runJson } from "./comfy";
import type { Brief } from "./types";

type RecraftOut = { data: { url?: string; b64_json?: string }[] };

/** One Recraft vector call -> SVG text, locked to the brief's palette. */
export async function vectorSvg(prompt: string, brief: Brief): Promise<string> {
  const out = await runJson<RecraftOut>(MODELS.vector, {
    prompt,
    n: 1,
    size: "1024x1024",
    controls: { colors: brief.palette.map((p) => ({ rgb: hexToRgb(p.hex) })), no_text: true },
  });
  const item = out.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64").toString("utf8");
  if (item?.url) return (await fetchBuffer(item.url)).toString("utf8");
  throw new Error("Vector generation returned nothing");
}
