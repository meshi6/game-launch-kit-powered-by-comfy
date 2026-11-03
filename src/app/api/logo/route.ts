import { MODELS, asPng, errorResponse, fetchBuffer, runJson, runJsonSafe, toDataUrl } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 300;

type IdeogramOut = { data: { url: string; is_image_safe?: boolean }[] };
type BriaOut = { status: string; result?: { image_url?: string }; error?: { message?: string } };

/** Title logo: Ideogram renders the lettering, Bria cuts it out to a transparent PNG. */
export async function POST(req: Request) {
  try {
    const brief = (await req.json()) as Brief;
    const colors = brief.palette.map((p) => `${p.name} ${p.hex}`).join(", ");
    const prompt = `Video game title logo that reads exactly "${brief.title}". ${brief.logoPrompt}. Lettering: ${brief.fontVibe}. Colors: ${colors}. ${brief.artStyle}. Centered, isolated on a flat solid plain white background, crisp edges, no other text, no scene.`;

    const gen = await runJsonSafe<IdeogramOut>(MODELS.titleLogo, { prompt, quality: "medium", magic_prompt: "off" }, { prompt });
    const url = gen.data?.find((d) => d.is_image_safe !== false)?.url;
    if (!url) throw new Error("Title logo generation returned no image");

    const cut = await runJson<BriaOut>(MODELS.removeBg, { image: url, preserve_alpha: true });
    if (!cut.result?.image_url) throw new Error(cut.error?.message ?? "Background removal failed");

    const png = await asPng(await fetchBuffer(cut.result.image_url), 1600);
    return Response.json({ logo: toDataUrl(png, "image/png") });
  } catch (err) {
    return errorResponse(err);
  }
}
