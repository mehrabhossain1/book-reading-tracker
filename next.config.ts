import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Automatic memoisation. Every optimistic cache write re-renders the library;
  // the compiler keeps unaffected rows from re-rendering with it.
  reactCompiler: true,

  experimental: {
    staleTimes: {
      // Every app page is dynamic (it reads the session), and dynamic pages
      // default to a 0s client cache — so switching Library → Stats → Library
      // was a full server round trip each way. 30s makes back-and-forth
      // instant; the data inside is kept fresh by TanStack Query, not by this.
      dynamic: 30,
    },
  },

  async headers() {
    return [
      {
        // Generated textures aren't content-hashed, so not `immutable` — a day
        // fresh, then a week of serve-stale-while-revalidating.
        source: "/textures/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
