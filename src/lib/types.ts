export type Swatch = { name: string; hex: string };

export type Brief = {
  title: string;
  tagline: string;
  genre: string;
  mood: string;
  artStyle: string; // shared style fragment appended to every image prompt
  palette: Swatch[]; // 5 colors, [0] = primary
  fontVibe: string;
  logoPrompt: string; // Ideogram title treatment
  emblemPrompt: string; // Recraft vector mark / app icon
  keyArtPrompt: string; // Nano Banana key art, no text
  stingPrompt: string; // Seedance logo reveal motion
  trailerPrompt?: string; // Seedance 12s multi-shot trailer, shot by shot
  trailerLine?: string; // one narrator line spoken in the trailer
  heroPrompt?: string; // the main character as one full-body figure, for a 3D model
  icons: { name: string; prompt: string }[]; // 6 UI/item icons
  sfx: { name: string; prompt: string; seconds: number }[]; // 3 sounds
  storeBlurb: string; // short Steam description
  features: string[]; // 4 bullet points
};

export type Capsule = {
  id: string;
  label: string;
  platform: "Steam" | "itch.io" | "Mobile";
  w: number;
  h: number;
  logo: boolean; // overlay title logo
  transparent?: boolean; // logo-only PNG
  iconOnly?: boolean; // built from the emblem instead of key art
};

// Steamworks graphical asset sizes (current store layout). Verify against
// partner.steamgames.com docs before shipping a real store page.
export const CAPSULES: Capsule[] = [
  { id: "steam-header", label: "Header capsule", platform: "Steam", w: 920, h: 430, logo: true },
  { id: "steam-small", label: "Small capsule", platform: "Steam", w: 462, h: 174, logo: true },
  { id: "steam-main", label: "Main capsule", platform: "Steam", w: 1232, h: 706, logo: true },
  { id: "steam-vertical", label: "Vertical capsule", platform: "Steam", w: 748, h: 896, logo: true },
  { id: "steam-library", label: "Library capsule", platform: "Steam", w: 600, h: 900, logo: true },
  { id: "steam-hero", label: "Library hero", platform: "Steam", w: 3840, h: 1240, logo: false },
  { id: "steam-logo", label: "Library logo", platform: "Steam", w: 1280, h: 720, logo: true, transparent: true },
  { id: "steam-bg", label: "Page background", platform: "Steam", w: 1438, h: 810, logo: false },
  { id: "itch-cover", label: "Cover image", platform: "itch.io", w: 630, h: 500, logo: true },
  { id: "app-icon", label: "App icon", platform: "Mobile", w: 1024, h: 1024, logo: false, iconOnly: true },
];
