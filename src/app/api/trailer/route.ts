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

    // Spell the edit out as timed shots with explicit hard cuts; a single long
    // description tends to come back as one continuous shot.
    const parts = shots.split(/\s*\d\)\s*/).map((p) => p.trim().replace(/[;.]$/, "")).filter(Boolean).slice(0, 4);
    const times = ["0–3s", "3–6s", "6–9s", "9–12s"];
    const shotList = parts.length >= 3
      ? parts.map((p, i) => `SHOT ${i + 1} (${times[i]}): ${p}.`).join(" HARD CUT TO ")
      : shots;

    const content: unknown[] = [
      {
        type: "text",
        text: `A 12-second video game trailer for "${brief.title}" (${brief.genre}) made of ${Math.max(parts.length, 4)} separate shots joined by hard cuts, like a real game trailer edit. Each shot has a different camera angle and framing. ${shotList} HARD CUT TO FINAL SHOT (last 2s): the title logo from the reference image, centered, sharp and legible, on a dark background with a light flare. Keep the world, characters and colors consistent with the reference images. Style: ${brief.artStyle}. Mood: ${brief.mood}. Epic trailer music with a hit on every cut. A deep trailer narrator voice says: "${line}". Original characters only; no other text on screen.`,
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
