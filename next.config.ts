import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // התפריט הדיגיטלי העצמאי — נגיש בכתובת נקייה /menu
  async rewrites() {
    return [{ source: "/menu", destination: "/menu.html" }];
  },
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
