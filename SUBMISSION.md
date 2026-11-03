# Launch Kit — Hackathon Submission

Launch Kit gives game enthusiasts a storefront from a few taps in about 2½ minutes, from their phone. No design skills, no tools, no prompts to write.

## Who it's for, and why it matters

**Launch Kit is for game makers who are not designers**: solo developers, students, game-jam teams, hobbyists, and artists who build in Roblox, RPG Maker or Godot. They can finish a game. What stops them is the store page.

To put a game on Steam you need about ten pieces of artwork at exact sizes, plus a logo, key art, an icon and store text. For most small teams that means one of three bad options:

| Option | What it costs them |
| --- | --- |
| Hire an artist | Often hundreds of dollars and days to weeks of back-and-forth |
| Do it themselves in Photoshop or Canva | Hours of resizing, and art that looks amateur |
| Use AI tools one by one | Eight different tools and prompts, and results that don't match each other |

The store page is the first thing a player sees, and small versions of the art decide whether anyone clicks. A great game with a weak page gets skipped.

**Why it's not "just another AI image generator":** the person never writes a prompt or opens a design tool. They pick a genre like walking down a game-store aisle, type the game's name and one line about it, and press Start. Launch Kit writes one art direction first and feeds it to every model, so the logo, art, icons, sounds and video look like **one game**. It then cuts everything to Steam's exact sizes and checks that the title is still readable at Steam's smallest thumbnail. That's the part non-designers can't do and don't know they need.

## What you get

A few taps in, a ready-to-upload storefront out, downloaded as one zip sorted by platform. Our test run of *Iron Front* (a military shooter) finished every step, with the title scoring 8/10 on the tiny-thumbnail check ([see the full run, screen by screen](https://github.com/meshi6/game-launch-kit-powered-by-comfy/blob/main/docs/example-run/README.md)).

| You get | Why a non-designer needs it |
| --- | --- |
| Style guide: 5-color palette, art direction, tagline | Keeps every asset matching, with nothing to decide |
| Title logo, transparent PNG | Lettering that fits the genre, on any background |
| Key art | The main image for the store page and trailer |
| 10 store images at exact sizes (Steam, itch.io, app icon) | No resizing or cropping by hand |
| Tiny-thumbnail check with a fix tip | Shows whether the title survives Steam's search-results size |
| App emblem + 6 in-game UI icons (SVG) | Matching icons for the game itself |
| 3 sound effects: title sting, menu select, level up | Audio without a sound designer |
| 5-second animated title sting with sound | A trailer opener or social clip |
| Store description + 4 feature bullets | Copy ready to paste into Steam |

It runs on a phone as a web app you can add to your home screen. The interface is a digital game store: you pick an aisle (open-world crime, military shooter, space strategy, block sandbox, fantasy RPG, retro arcade, or your own idea), and your kit fills a wall of TVs as each piece arrives.

## How it uses Comfy

Seven models (Claude Sonnet 5.5, Ideogram 4.5, Bria Remove Background, Nano Banana Pro, Recraft V4.1 Vector, ElevenLabs SFX v2 and Seedance 2.0 Fast) from seven providers, all through **Comfy Router**, using the Comfy API and the Comfy TypeScript SDK. The style guide runs first. Five models then run in parallel, the store sizes are built on the phone, and the video goes last, using the finished store image as its first frame.

| Step | Model (Comfy Router ID) | Time in our test |
| --- | --- | --- |
| Style guide | `anthropic/claude-sonnet-5-5` | 17–18 s |
| Title logo | `ideogram/ideogram-4-5` | 15–20 s (with cut-out) |
| Background cut-out | `bria/image-edit-remove-background` | included above |
| Key art | `vertexai/gemini-3-pro-image` (Nano Banana Pro) | 26–28 s |
| Emblem + UI icons | `recraft/recraftv4_1_vector` | 13–22 s |
| Sound effects | `elevenlabs/eleven_sfx_v2` | 3 s |
| Tiny-thumbnail check | `anthropic/claude-sonnet-5-5` (vision) | ~5 s |
| Title sting video | `byteplus/dreamina-seedance-2-0-fast-260128` | 40–100 s |

The Comfy API key stays on the server; a short access code protects the public demo from spending credits. Prompts are written to keep every design original, so a user who types "like GTA" gets the genre and mood, not someone else's logo or characters.

## 60-second demo script

Start the live run in the first seconds so it builds while you talk. Keep the demo tab open as a backup: it looks identical and replays a finished kit in about 20 seconds with no API calls.

1. **0–10 s, the problem.** "You finished your game. Now Steam wants ten pieces of art at exact sizes, a logo, an icon and store copy. If you're not a designer, that's where games stall."
2. **10–20 s, start it.** Swipe the TVs to an aisle, show the pre-filled game, press **Start**. "A few taps. No prompts, no design tools."
3. **20–45 s, watch it fill.** Point at the loading bar and the TVs switching on. "One art direction goes to seven Comfy models, so everything matches." Play a sound button. Show the tiny-thumbnail score.
4. **45–55 s, the payoff.** Scroll the store shelf, open one capsule full-screen, play the title sting.
5. **55–60 s, close.** Tap **Download**. "Ready to upload. Built for the people who can make a game but can't design a store page."

If the live run is slow or a model refuses, switch tabs to the demo link and press Start there.

## Links

| What | Link |
| --- | --- |
| Live app (access code PLAYER1) | [launch-kit-beta.vercel.app](https://launch-kit-beta.vercel.app) |
| Stage-safe demo | [launch-kit-beta.vercel.app/?demo=1](https://launch-kit-beta.vercel.app/?demo=1) |
| Kiosk mode (autoplays) | [launch-kit-beta.vercel.app/?demo=1&play=1](https://launch-kit-beta.vercel.app/?demo=1&play=1) |
| Code | [github.com/meshi6/game-launch-kit-powered-by-comfy](https://github.com/meshi6/game-launch-kit-powered-by-comfy) |
| Example run, screen by screen | [docs/example-run](https://github.com/meshi6/game-launch-kit-powered-by-comfy/blob/main/docs/example-run/README.md) |
