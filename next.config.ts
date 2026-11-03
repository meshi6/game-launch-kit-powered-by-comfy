import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // let phones on the same Wi-Fi load dev assets
  allowedDevOrigins: ["172.18.59.189", "*.local"],
  cacheComponents: true,
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
