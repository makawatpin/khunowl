import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dynamic segments (every page here, since the Supabase SSR client reads
    // cookies) default to staleTime 0 in Next 15 — the client re-fetches the
    // shared root + (app) layouts (6+ Supabase queries) on every nav click,
    // even though the sidebar they render never changes between clicks.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
