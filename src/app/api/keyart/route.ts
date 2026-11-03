import { MODELS, asJpeg, dataUrlToBuffer, errorResponse, runJson, toDataUrl } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 300;

type GeminiOut = {
  candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string }; fileData?: { fileUri: string } }[] } }[];
};

/** Key art: Nano Banana Pro, 16:9, no text. Optional screenshot as a style/subject reference. */
export async function POST(req: Request) {
  try {
    const { brief, screenshot } = (await req.json()) as { brief: Brief; screenshot?: string };
    const colors = brief.palette.map((p) => p.hex).join(", ");
    const parts: unknown[] = [];
    if (screenshot) {
      const [, mimeType = "image/jpeg"] = screenshot.match(/^data:([^;]+);/) ?? [];
      parts.push({ inlineData: { mimeType, data: dataUrlToBuffer(screenshot).toString("base64") } });
    }
    parts.push({
      text: `Key art for the video game "${brief.title}" (${brief.genre}). ${brief.keyArtPrompt}. Style: ${brief.artStyle}. Mood: ${brief.mood}. Dominant palette: ${colors}. Cinematic wide composition, premium store-page quality. Keep the upper-center calm (open sky or soft background, never a box, panel or frame) so a title logo can sit there. All characters are original designs that do not resemble any existing game franchise.${
        screenshot ? " Match the attached game screenshot's characters and art style." : ""
      } ABSOLUTELY NO text, letters, numbers, logos, watermarks or UI.`,
    });

    const out = await runJson<GeminiOut>(MODELS.keyArt, {
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "2K" } },
    });
    const img = out.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!img) throw new Error("Key art generation returned no image");

    const jpg = await asJpeg(Buffer.from(img.data, "base64"), 2560, 88);
    return Response.json({ keyArt: toDataUrl(jpg, "image/jpeg") });
  } catch (err) {
    return errorResponse(err);
  }
}
