import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Launch Kit",
    short_name: "Launch Kit",
    description: "Your game's whole storefront from a few taps.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0a10",
    theme_color: "#0b0a10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
