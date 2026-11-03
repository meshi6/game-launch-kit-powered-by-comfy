import { comfy } from "@comfyorg/sdk";
import { MODELS, assertKey, errorResponse } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 60;

/**
 * Game trailer: one 12s multi-shot Seedance clip with music, effects and a
 * narrator line, using the kit's key art + logo as reference images so it
 * matches everything else. Poll it with GET /api/sting?id=… (same model).
 */
export async function POST(req: Request) {
  try {
    assertKey();
    const { brief, keyArt, logo } = (await req.json()) as { brief: Brief; keyArt: string; logo?: string };
    const shots =
      brief.trailerPrompt ??
      `1) establishing shot of the world, 2) the hero in action, 3) the core gameplay fantasy at its most exciting, 4) final beat resolving on the title logo. ${brief.keyArtPrompt}`;
    const line = brief.trailerLine ?? brief.tagline;

    const content: unknown[] = [
      {
        type: "text",
        text: `Cinematic 12-second video game trailer for "${brief.title}" (${brief.genre}). Fast trailer editing with hard cuts between shots: ${shots}. Keep the world, characters and colors consistent with the reference images. Style: ${brief.artStyle}. Mood: ${brief.mood}. Epic trailer music with impacts on each cut. A deep trailer narrator voice says: "${line}". The last shot shows the title logo from the reference image, sharp and legible. Original characters only; no other text on screen.`,
      },
      { type: "image_url", role: "reference_image", image_url: { url: keyArt } },
    ];
    if (logo) content.push({ type: "image_url", role: "reference_image", image_url: { url: logo } });

    const handle = await comfy.models.submit(MODELS.video, {
      content,
      duration: 12,
      ratio: "16:9",
      resolution: "720p",
      generate_audio: true,
      watermark: false,
    });
    return Response.json({ requestId: handle.requestId });
  } catch (err) {
    return errorResponse(err);
  }
}
