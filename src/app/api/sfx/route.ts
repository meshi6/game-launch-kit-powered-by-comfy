import { MODELS, errorResponse, runBinary, toDataUrl } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 120;

/** Sound kit: ElevenLabs SFX v2 for title sting, menu select and level up. */
export async function POST(req: Request) {
  try {
    const brief = (await req.json()) as Brief;
    const results = await Promise.allSettled(
      brief.sfx.slice(0, 3).map(async (s) => {
        const seconds = Math.min(30, Math.max(0.5, Number(s.seconds) || 2));
        const mp3 = await runBinary(MODELS.sfx, {
          text: `${s.prompt}. Video game sound effect for a ${brief.genre} game, ${brief.mood}.`,
          duration_seconds: seconds,
          prompt_influence: 0.5,
        });
        return { name: s.name, audio: toDataUrl(mp3, "audio/mpeg") };
      }),
    );
    const sounds = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    if (!sounds.length) throw (results[0] as PromiseRejectedResult).reason;
    return Response.json({ sounds });
  } catch (err) {
    return errorResponse(err);
  }
}
