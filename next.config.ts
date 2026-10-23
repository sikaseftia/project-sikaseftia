import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents dan partialPrefetching dimatikan. cacheComponents melarang nilai acak
  // saat prerender, sedangkan Redux memakai Math.random() saat membuat store (src/store/index.ts).
  // partialPrefetching hanya bisa dipakai bersama cacheComponents.
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
