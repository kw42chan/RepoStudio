import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  extensionAlias: {
    ".js": [".ts", ".tsx", ".js"],
  },
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
