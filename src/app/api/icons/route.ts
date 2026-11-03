import { errorResponse } from "@/lib/comfy";
import type { Brief } from "@/lib/types";
import { vectorSvg } from "@/lib/vector";

export const maxDuration = 180;

/** In-game UI icon set: 6 Recraft vector calls in parallel, same palette + style. */
export async function POST(req: Request) {
  try {
    const brief = (await req.json()) as Brief;
    const results = await Promise.allSettled(
      brief.icons.slice(0, 6).map(async (icon) => ({
        name: icon.name,
        svg: await vectorSvg(
          `Game UI icon, ${icon.name}: ${icon.prompt}. Single centered object, consistent icon set style: ${brief.artStyle}. Clean silhouette, no text, plain background.`,
          brief,
        ),
      })),
    );
    const icons = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    if (!icons.length) throw (results[0] as PromiseRejectedResult).reason;
    return Response.json({ icons });
  } catch (err) {
    return errorResponse(err);
  }
}
