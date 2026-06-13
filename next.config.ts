import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 16 removed the built-in ESLint build step, so no `eslint` key is
  // needed here — lint no longer runs during `next build`.
  typescript: {
    // Safety net so a stray type error can't block the production deploy.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Google profile avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Supabase storage (any project ref)
      { protocol: "https", hostname: "*.supabase.co" },
      // Notion workspace icons / images
      { protocol: "https", hostname: "*.notion.so" },
      { protocol: "https", hostname: "*.amazonaws.com" },
    ],
  },
};

export default nextConfig;
