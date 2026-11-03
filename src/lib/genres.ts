export type Genre = {
  id: string;
  name: string;
  blurb: string;
  direction: string; // fed to the style-guide prompt
  colors: [string, string]; // screen glow + accent
  example: { name: string; pitch: string };
  art?: string; // pre-generated aisle key art in /public/aisles
};

// Genre aisles inspired by what's hot right now. Original directions only:
// no real game names, logos or characters go into the prompts.
export const GENRES: Genre[] = [
  {
    id: "crime",
    art: "/aisles/crime.jpg",
    name: "Open-World Crime",
    blurb: "Neon coast. Fast cars. Big heists.",
    direction: "modern open-world crime epic: sun-drenched coastal metropolis, neon nightlife, sports cars and palm trees, bold graphic poster illustration with hard cel shading, hot sunset pink, teal and gold, heavy condensed italic slab lettering",
    colors: ["#ff4f8b", "#ffb547"],
    example: { name: "Sunset Syndicate", pitch: "An open-world crime saga where two siblings run getaway cars for a beachside crime family in a neon coastal city." },
  },
  {
    id: "shooter",
    art: "/aisles/shooter.jpg",
    name: "Military Shooter",
    blurb: "Squad up. Drop in. Hold the line.",
    direction: "AAA military shooter: gritty cinematic photoreal key art, smoke, tracer fire and dust, desaturated steel greys with signal orange, sharp stencil-cut industrial lettering",
    colors: ["#ff7a1a", "#9fb3c8"],
    example: { name: "Iron Front", pitch: "A squad-based military shooter where an elite unit fights through a collapsing near-future megacity." },
  },
  {
    id: "rts",
    art: "/aisles/rts.jpg",
    name: "Space Strategy",
    blurb: "Command fleets. Crush the swarm.",
    direction: "sci-fi real-time strategy with original designs: sleek white-and-amber exo-suit colonists with hover tanks versus a crystalline glass-bodied alien swarm on a ringed desert moon, epic painterly concept art seen from a high strategic angle, teal and amber with magenta crystal glow, heavy beveled metallic lettering",
    colors: ["#2fd4c4", "#ff4fd8"],
    example: { name: "Hive Dominion", pitch: "A real-time space strategy game where human colonists, psionic aliens and a bug swarm fight over a dying star system." },
  },
  {
    id: "sandbox",
    art: "/aisles/sandbox.jpg",
    name: "Block Sandbox",
    blurb: "Dig. Craft. Build anything.",
    direction: "voxel survival sandbox with its own look: soft rounded bevelled voxels like glossy toy bricks, pastel-bright candy greens, sky blue and coral, tiny chibi explorer characters with round helmets and backpacks (original designs, not blocky square-headed people), warm diorama lighting, chunky lettering built from rounded cubes",
    colors: ["#5fd35a", "#6cc4ff"],
    example: { name: "Blockhaven", pitch: "A voxel survival sandbox where you dig, craft and build a floating island town before the void swallows it." },
  },
  {
    id: "rpg",
    art: "/aisles/rpg.jpg",
    name: "Fantasy RPG",
    blurb: "Snowy peaks. Dragons. Ancient runes.",
    direction: "open-world fantasy RPG: frozen northern mountains, ancient stone ruins and a dragon on the horizon, cinematic oil-painting realism, cold steel blue and ember gold, carved weathered stone serif lettering",
    colors: ["#8fb8ff", "#ffb84a"],
    example: { name: "Frostbound", pitch: "An open-world fantasy RPG where a dragon-blooded exile roams frozen northern kingdoms relearning forgotten rune magic." },
  },
  {
    id: "arcade",
    art: "/aisles/arcade.jpg",
    name: "Retro Arcade",
    blurb: "Pixels, neon, high scores.",
    direction: "80s/90s arcade cabinet energy: crisp pixel art, CRT glow, neon magenta and cyan, chunky bitmap lettering",
    colors: ["#ff3fa4", "#3ff2ff"],
    example: { name: "Neon Drift Undead", pitch: "A synthwave racing roguelike where you outrun a zombie horde through a burning city at 300 km/h." },
  },
  {
    id: "own",
    name: "Your Own",
    blurb: "Bring any idea. We'll find the style.",
    direction: "",
    colors: ["#f2eff8", "#ff5c39"],
    example: { name: "", pitch: "" },
  },
];
