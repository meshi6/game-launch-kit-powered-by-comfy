import { errorResponse } from "@/lib/comfy";
import type { Brief } from "@/lib/types";
import { vectorSvg } from "@/lib/vector";

export const maxDuration = 120;

/** App icon emblem: a bold vector mark in the brand palette. */
export async function POST(req: Request) {
  try {
    const brief = (await req.json()) as Brief;
    const svg = await vectorSvg(
      `Game app icon emblem for "${brief.title}": ${brief.emblemPrompt}. ${brief.artStyle}. Bold, simple, centered, reads clearly at 64px, no text, no letters.`,
      brief,
    );
    return Response.json({ svg });
  } catch (err) {
    return errorResponse(err);
  }
}
