import { comfy } from "@comfyorg/sdk";
import { MODELS, assertKey, errorResponse } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 60;

type Stage = "preview" | "refine" | "rig";

/**
 * 3D hero, one Meshy stage per call (each is queued; poll with GET /api/job):
 *   preview: text → untextured mesh (Meshy 7.1)
 *   refine:  textures it from the style guide
 *   rig:     skeleton + walking/running animations
 * `taskId` is the Meshy task id returned by the previous stage.
 */
export async function POST(req: Request) {
  try {
    assertKey();
    const { brief, stage, taskId } = (await req.json()) as { brief: Brief; stage: Stage; taskId?: string };
    const colors = brief.palette.map((p) => `${p.name} ${p.hex}`).join(", ");

    let model: string;
    let input: Record<string, unknown>;
    if (stage === "preview") {
      const hero =
        brief.heroPrompt ??
        `The main character of the video game "${brief.title}" (${brief.genre}), one full-body figure standing in an A-pose. ${brief.keyArtPrompt}`;
      model = MODELS.hero3d;
      input = {
        mode: "preview",
        prompt: `${hero} Game-ready stylized character, full body, A-pose, clean silhouette, original design.`.slice(0, 800),
        art_style: "realistic",
        pose_mode: "a-pose",
        should_remesh: true,
        topology: "triangle",
        target_polycount: 20000,
        symmetry_mode: "auto",
      };
    } else if (stage === "refine") {
      if (!taskId) return Response.json({ error: "missing taskId" }, { status: 400 });
      model = MODELS.hero3d;
      input = {
        mode: "refine",
        preview_task_id: taskId,
        texture_prompt: `${brief.artStyle}. Colors: ${colors}.`.slice(0, 800),
        texture_resolution: "2k",
        enable_pbr: false,
      };
    } else if (stage === "rig") {
      if (!taskId) return Response.json({ error: "missing taskId" }, { status: 400 });
      model = MODELS.rig;
      input = { input_task_id: taskId, height_meters: 1.8 };
    } else {
      return Response.json({ error: "unknown stage" }, { status: 400 });
    }

    const handle = await comfy.models.submit(model, input);
    return Response.json({ requestId: handle.requestId, model });
  } catch (err) {
    return errorResponse(err);
  }
}
