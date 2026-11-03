export type Genre = {
  id: string;
  name: string;
  blurb: string;
  direction: string; // fed to the style-guide prompt
  colors: [string, string]; // screen glow + accent
  example: { name: string; pitch: string };
};

export const GENRES: Genre[] = [
  {
    id: "arcade",
    name: "Retro Arcade",
    blurb: "Pixels, neon, high scores.",
    direction: "80s/90s arcade cabinet energy: crisp pixel art, CRT glow, neon magenta and cyan, chunky bitmap lettering",
    colors: ["#ff3fa4", "#3ff2ff"],
    example: { name: "Neon Drift Undead", pitch: "A synthwave racing roguelike where you outrun a zombie horde through a burning city at 300 km/h." },
  },
  {
    id: "cozy",
    name: "Cozy",
    blurb: "Tea, frogs, tiny castles.",
    direction: "warm cozy indie: soft painterly storybook illustration, rounded friendly shapes, mossy greens and cream, hand-lettered title",
    colors: ["#7fd77a", "#ffd68a"],
    example: { name: "Moss & Mortar", pitch: "A cozy co-op castle-builder where frogs defend their pond kingdom from seasonal storms." },
  },
  {
    id: "horror",
    name: "Horror",
    blurb: "Lights off. Something's there.",
    direction: "survival horror: grainy VHS film look, deep blacks and blood red, flickering light, distressed scratched lettering",
    colors: ["#ff2b2b", "#ffb199"],
    example: { name: "Room 404", pitch: "A found-footage horror game where a motel hallway rearranges itself every time you blink." },
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    blurb: "Chrome, stars, big ships.",
    direction: "cinematic sci-fi: chrome and glass, deep space blues with hot orange thrusters, sleek wide-tracked futuristic lettering",
    colors: ["#4aa8ff", "#ff9a3d"],
    example: { name: "Halo Drift", pitch: "A lonely salvage pilot rebuilds a dead space station one room at a time while its AI slowly remembers who she was." },
  },
  {
    id: "fantasy",
    name: "Fantasy",
    blurb: "Swords, runes, dragons.",
    direction: "epic high fantasy: rich oil-painting key art, gold and royal purple, glowing runes, ornate engraved serif title",
    colors: ["#c08bff", "#ffd24a"],
    example: { name: "Embercrown", pitch: "A tactical RPG where you lead a band of exiled knights to reclaim a kingdom ruled by a dragon who used to be their queen." },
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
