import { claude, errorResponse, extractJson } from "@/lib/comfy";

export const maxDuration = 60;

/** Steam shrinks capsules to ~120x45 in search. Ask Claude (vision) if the title survives. */
export async function POST(req: Request) {
  try {
    const { title, thumb } = (await req.json()) as { title: string; thumb: string };
    const text = await claude({
      images: [thumb],
      prompt: `This is a game store capsule shown at its smallest real size (120x45 px, as in Steam search results). The game's title is "${title}". Can a shopper read the title at this size? Return ONLY JSON: {"score": 1-10, "readable": boolean, "tip": "one short, concrete fix if needed"}`,
      maxTokens: 200,
    });
    return Response.json(extractJson<{ score: number; readable: boolean; tip: string }>(text));
  } catch (err) {
    return errorResponse(err);
  }
}
