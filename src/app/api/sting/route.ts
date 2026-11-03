import { comfy } from "@comfyorg/sdk";
import { MODELS, assertKey, errorResponse } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 60;

/** Animated title sting: queue Seedance with the composited main capsule as first frame. */
export async function POST(req: Request) {
  try {
    assertKey();
    const { brief, frame } = (await req.json()) as { brief: Brief; frame: string };
    const handle = await comfy.models.submit(MODELS.video, {
      content: [
        {
          type: "text",
          text: `Animated title screen reveal for the video game "${brief.title}". ${brief.stingPrompt}. Keep the title logo sharp, legible and unchanged in the final frames. Style: ${brief.artStyle}.`,
        },
        { type: "image_url", role: "first_frame", image_url: { url: frame } },
      ],
      duration: 5,
      ratio: "adaptive",
      resolution: "720p",
      generate_audio: true,
      watermark: false,
    });
    return Response.json({ requestId: handle.requestId });
  } catch (err) {
    return errorResponse(err);
  }
}

type SeedanceOut = { content?: { video_url?: string }; status?: string; error?: { message?: string } | null };

/** Poll: GET /api/sting?id=... -> { status, videoUrl? } */
export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ error: "missing id" }, { status: 400 });
    assertKey();
    const handle = comfy.models.handle(MODELS.video, id);
    const st = await handle.status();
    if (!st.completed) return Response.json({ status: st.status, queuePosition: st.queuePosition ?? null });
    if (st.errorType) return Response.json({ status: "FAILED", error: st.errorType });
    const { data } = await handle.get();
    const out = data as SeedanceOut;
    if (!out.content?.video_url) return Response.json({ status: "FAILED", error: out.error?.message ?? "No video returned" });
    return Response.json({ status: "COMPLETED", videoUrl: out.content.video_url });
  } catch (err) {
    return errorResponse(err);
  }
}
