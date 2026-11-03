import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // התפריט הדיגיטלי העצמאי — נגיש בכתובת נקייה /menu
  async rewrites() {
    return [{ source: "/menu", destination: "/menu.html" }];
  },
  // קובצי התפריט גדולים (6MB) — הדפדפן מגיש עותק מקומי ומרענן ברקע
  async headers() {
    return [
      {
        source: "/menu.html",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate, stale-while-revalidate=86400" }],
      },
      {
        source: "/menu-editor.html",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate, stale-while-revalidate=86400" }],
      },
    ];
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
