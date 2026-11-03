import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // let phones on the same Wi-Fi load dev assets
  allowedDevOrigins: ["172.18.59.189", "*.local"],
  cacheComponents: true,
  // short, autocomplete-proof links for the stage-safe demo
  async redirects() {
    return [
      { source: "/demo", destination: "/?demo=1&play=1", permanent: false },
      { source: "/demo/start", destination: "/?demo=1", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
