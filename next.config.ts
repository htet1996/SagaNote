import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ESLint is a dev/CI concern — don't let lint style rules block a deploy.
  // (Type-checking still runs and WILL fail the build on real type errors.)
  
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
