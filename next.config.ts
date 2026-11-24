import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic caching model on purpose: catalog pages use fetch-level
  // ISR (revalidate) and the account/cart pages are client-rendered.
  // The scaffold's experimental Cache Components mode blocked that
  // pattern at prerender time, so it stays off.
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
