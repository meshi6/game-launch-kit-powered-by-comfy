import { comfy } from "@comfyorg/sdk";
import { MODELS, assertKey, errorResponse } from "@/lib/comfy";

export const maxDuration = 60;

// Only the queued models this app submits can be polled through here.
const ALLOWED = new Set<string>([MODELS.video, MODELS.hero3d, MODELS.rig]);

type MeshyOut = {
  id?: string;
  status?: string;
  model_urls?: Record<string, string>;
  thumbnail_url?: string;
  result?: {
    rigged_character_glb_url?: string;
    rigged_character_fbx_url?: string;
    basic_animations?: Record<string, string>;
  };
  task_error?: { message?: string } | null;
};

/** GET /api/job?model=…&id=… → { status, queuePosition? } or, when done, { status: "COMPLETED", data } */
export async function GET(req: Request) {
  try {
    assertKey();
    const url = new URL(req.url);
    const model = url.searchParams.get("model") ?? "";
    const id = url.searchParams.get("id");
    if (!ALLOWED.has(model) || !id) return Response.json({ error: "bad model or id" }, { status: 400 });

    const handle = comfy.models.handle(model, id);
    const st = await handle.status();
    if (!st.completed) return Response.json({ status: st.status, queuePosition: st.queuePosition ?? null });
    if (st.errorType) return Response.json({ status: "FAILED", error: st.errorType });

    const { data } = await handle.get();
    const d = data as MeshyOut;
    if (d.task_error?.message) return Response.json({ status: "FAILED", error: d.task_error.message });
    // Hand back only what the client needs (ids + download URLs).
    return Response.json({
      status: "COMPLETED",
      data: { id: d.id, model_urls: d.model_urls, thumbnail_url: d.thumbnail_url, result: d.result },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
