import { claude, errorResponse, extractJson } from "@/lib/comfy";
import type { Brief } from "@/lib/types";

export const maxDuration = 120;

const SYSTEM = `You are the art director of a game studio. Given a game name and pitch, you write a tight brand style guide that every downstream image, video and sound model will follow, so the whole storefront looks like ONE game.
Everything must be ORIGINAL: never name, reference or imitate an existing game franchise, its logo, characters, factions or signature art; if the pitch names one, keep only the genre and mood.
Return ONLY a JSON object, no prose, matching exactly:
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
  "icons": [{"name": string, "prompt": string}],     // exactly 6 in-game UI/item icons that fit the game (e.g. health, currency, signature item, ability), each a single centered object
  "sfx": [{"name": string, "prompt": string, "seconds": number}], // exactly 3: "Title sting" (3-5s), "Menu select" (0.5-1s), "Level up" (1.5-3s). Describe the sound concretely
  "storeBlurb": string,           // 2-3 sentence Steam short description, punchy
  "features": [string]            // exactly 4 store feature bullets, each <= 10 words
}`;

export async function POST(req: Request) {
  try {
    const { name, pitch, screenshot, direction } = (await req.json()) as { name: string; pitch: string; screenshot?: string; direction?: string };
    if (!name?.trim() || !pitch?.trim()) return Response.json({ error: "Name and pitch are required" }, { status: 400 });

    const text = await claude({
      system: SYSTEM,
      prompt: `Game name: "${name.trim()}"\nPitch: ${pitch.trim()}${direction ? `\nArt direction (store aisle the developer picked): ${direction}` : ""}${
        screenshot ? "\nThe attached image is a screenshot / concept art from the game: match its art style and colors closely." : ""
      }`,
      images: screenshot ? [screenshot] : [],
      maxTokens: 2500,
    });
    const brief = extractJson<Brief>(text);
    brief.title = name.trim();
    return Response.json(brief);
  } catch (err) {
    return errorResponse(err);
  }
}
