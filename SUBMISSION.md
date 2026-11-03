# Launch Kit — Hackathon Submission

Launch Kit gives game enthusiasts a storefront from a few taps in about 4 minutes, from their phone. No design skills, no tools, no prompts to write.

## Who it's for, and why it matters

**Launch Kit is for game makers who are not designers**: solo developers, students, game-jam teams, hobbyists, and artists who build in Roblox, RPG Maker or Godot. They can finish a game. What stops them is the store page.

To put a game on Steam you need about ten pieces of artwork at exact sizes, plus a logo, key art, an icon and store text. For most small teams that means one of three bad options:

| Option | What it costs them |
| --- | --- |
| Hire an artist | Often hundreds of dollars and days to weeks of back-and-forth |
| Do it themselves in Photoshop or Canva | Hours of resizing, and art that looks amateur |
| Use AI tools one by one | Nine different tools and prompts, and results that don't match each other |

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
| 12-second game trailer: several shots, music, a narrator line, ends on the logo | A promo video without editing software or a video team |
| 3D hero: textured, rigged, walking and running (.glb) | A playable character to drop into Unity, Godot, Blender or Roblox Studio |
| Store description + 4 feature bullets | Copy ready to paste into Steam |

It runs on a phone as a web app you can add to your home screen. The interface is a digital game store: you pick an aisle (open-world crime, military shooter, space strategy, block sandbox, fantasy RPG, retro arcade, or your own idea), and your kit fills a wall of TVs as each piece arrives.

## How it uses Comfy

Nine models (Claude Sonnet 5.5, Ideogram 4.5, Bria Remove Background, Nano Banana Pro, Recraft V4.1 Vector, ElevenLabs SFX v2, Seedance 2.0 Fast, Meshy 7.1 and Meshy Rigging) from eight providers, all through **Comfy Router**, using the [Comfy API](https://comfy.org/platform/comfy-api/) and the Comfy TypeScript SDK. The style guide runs first. Five models then run in parallel, the store sizes are built on the phone, and the video goes last, using the finished store image as its first frame.

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
| Game trailer (12 s) | `byteplus/dreamina-seedance-2-0-fast-260128` | ~2–3 min |
| 3D hero: sculpt + texture | `meshy/meshy-7.1` | 54 s + 37 s |
| 3D hero: rig + animations | `meshy/rigging` | 29 s |

The Comfy API key stays on the server; a short access code protects the public demo from spending credits. Prompts are written to keep every design original, so a user who types "like GTA" gets the genre and mood, not someone else's logo or characters.

## 60-second demo script

A live kit takes about 4 minutes, but its art lands in under a minute. So the script shows the art being made live, then ends on a finished trailer from the demo tab.

**Set up two tabs on the phone before you walk up:**

- **Tab 1, live:** the app with *Iron Front* (or any game) typed in, one tap from Start.
- **Tab 2, demo:** the `?demo=1` link, played through to Stage Clear, with the *Frostbound* trailer and 3D hero ready.

1. **Just before you speak:** press **Start** on tab 1, so the clock runs while you talk.
2. **0–15 s, the problem.** "You finished your game. Now Steam wants ten pieces of art at exact sizes, a logo, an icon, store copy and a trailer. If you're not a designer, that's where games stall."
3. **15–30 s, how it works.** Point at the loading bar and the TVs switching on. "A few taps. No prompts, no design tools. One art direction goes to nine Comfy models, so everything matches."
4. **30–45 s, the art lands live.** The key art, logo and icons arrive on tab 1. Scroll the store shelf, play one sound button, and show the tiny-size score.
5. **45–52 s, the trailer.** Switch to tab 2: "Here's a finished kit from earlier." Play the *Frostbound* trailer.
6. **52–57 s, the 3D hero.** Scroll to the 3D hero on tab 2 and spin it: "It even makes your main character as a rigged 3D model, ready for your game engine."
7. **57–60 s, close.** Tap **Download**. "Ready to upload. Built for game enthusiasts who can make a game but can't design a store page."

If the live run shows an error, do the entire pitch on tab 2: press Start there and it replays a full kit in about 20 seconds. After the pitch, show the judges tab 1 again: by then its own sting and trailer will be done.

## Links

| What | Link |
| --- | --- |
| Live app (access code PLAYER1) | [launch-kit-beta.vercel.app](https://launch-kit-beta.vercel.app) |
| Stage-safe demo | [launch-kit-beta.vercel.app/?demo=1](https://launch-kit-beta.vercel.app/?demo=1) |
| ▶️ Auto demo: a full kit plays in about 20 seconds, no code needed | [launch-kit-beta.vercel.app/?demo=1&play=1](https://launch-kit-beta.vercel.app/?demo=1&play=1) |
| Code | [github.com/meshi6/game-launch-kit-powered-by-comfy](https://github.com/meshi6/game-launch-kit-powered-by-comfy) |
| Example run, screen by screen | [docs/example-run](https://github.com/meshi6/game-launch-kit-powered-by-comfy/blob/main/docs/example-run/README.md) |
| ComfyUI node pack (Style Guide, Store Capsules, Legibility Check) | [github.com/meshi6/comfyui-launch-kit](https://github.com/meshi6/comfyui-launch-kit) |
