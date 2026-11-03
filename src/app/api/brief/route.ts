import { claude, errorResponse, extractJson } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 120;

const SYSTEM = `You are the art director of a game studio. Given a game name and pitch, you write a tight brand style guide that every downstream image, video and sound model will follow, so the whole storefront looks like ONE game.
Everything must be ORIGINAL: never name, reference or imitate an existing game franchise, its logo, characters, factions or signature art; if the pitch names one, keep only the genre and mood.
Return ONLY a JSON object, no prose. It must be valid JSON: inside string values use single quotes, never unescaped double quotes. Match exactly:
{
  "title": string,                // the game's title, exact spelling as given
  "tagline": string,              // <= 8 words
  "genre": string,
  "mood": string,                 // 3-5 adjectives
  "artStyle": string,             // one dense style phrase reused in EVERY image prompt (medium, rendering, lighting, line quality, palette words)
  "palette": [{"name": string, "hex": "#RRGGBB"}],  // exactly 5; [0] primary, [1] accent, [2] dark, [3] light, [4] highlight
  "fontVibe": string,             // lettering direction for the title logo
  "logoPrompt": string,           // for a text-rendering model: the title logo treatment ONLY. Must contain the exact title in quotes, centered, isolated on a flat solid plain white background, no scene, no other text
  "emblemPrompt": string,         // a simple bold vector emblem/mark for the app icon. No text or letters. Centered, flat, iconic
  "keyArtPrompt": string,         // cinematic wide key art of the game's hero moment. ABSOLUTELY NO TEXT, letters or logos. Leave calm negative space in the center-upper area for a logo
  "stingPrompt": string,          // 5s camera motion + effects for an animated title reveal starting from the key art with logo (e.g. slow push-in, particles, light sweep, logo glints). Include the sound design in words
  "trailerPrompt": string,        // a 12-second game trailer as 4 numbered shots (~3s each): 1) atmospheric establishing shot of the world, 2) the hero in action, 3) the core gameplay fantasy at its most exciting, 4) a final beat that resolves on the title logo. Describe camera moves, action and music/sound. Original characters only
  "trailerLine": string,          // ONE short narrator line for the trailer, <= 10 words, punchy, no game title
  "heroPrompt": string,           // the game's main character as ONE full-body figure for a 3D model, standing in an A-pose: body type, outfit, materials and colors, distinctive silhouette, in the art style. No background, no scene, no text, nothing held that hides the body. <= 500 characters. Original design
  "icons": [{"name": string, "prompt": string}],     // exactly 6 in-game UI/item icons that fit the game (e.g. health, currency, signature item, ability), each a single centered object
  "sfx": [{"name": string, "prompt": string, "seconds": number}], // exactly 3: "Title sting" (3-5s), "Menu select" (0.5-1s), "Level up" (1.5-3s). Describe the sound concretely
  "storeBlurb": string,           // 2-3 sentence Steam short description, punchy
  "features": [string]            // exactly 4 store feature bullets, each <= 10 words
}`;

export async function POST(req: Request) {
  try {
    const { name, pitch, screenshot, direction } = (await req.json()) as { name: string; pitch: string; screenshot?: string; direction?: string };
    if (!name?.trim() || !pitch?.trim()) return Response.json({ error: "Name and pitch are required" }, { status: 400 });

    const prompt = `Game name: "${name.trim()}"\nPitch: ${pitch.trim()}${direction ? `\nArt direction (store aisle the developer picked): ${direction}` : ""}${
      screenshot ? "\nThe attached image is a screenshot / concept art from the game: match its art style and colors closely." : ""
    }`;

    // The style guide is long; occasionally the model emits invalid JSON
    // (an unescaped quote). Retry once rather than failing the whole kit.
    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      const text = await claude({
        system: SYSTEM,
        prompt: attempt === 0 ? prompt : `${prompt}\n\nReturn strictly valid JSON. Inside string values never use double quotes; use single quotes instead.`,
        images: screenshot ? [screenshot] : [],
        maxTokens: 4000,
      });
      try {
        const brief = extractJson<Brief>(text);
        brief.title = name.trim();
        return Response.json(brief);
      } catch (e) {
        lastErr = e;
        console.warn(`[brief] invalid JSON on attempt ${attempt + 1}:`, e instanceof Error ? e.message : e);
      }
    }
    throw lastErr;
  } catch (err) {
    return errorResponse(err);
  }
}
