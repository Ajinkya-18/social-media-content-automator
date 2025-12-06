import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 1. Strict Mode is good for dev
  reactStrictMode: true,

  // 2. This is the Magic Bridge
  async rewrites() {
    return [
      {
        // When frontend calls /api/python/...
        source: "/api/python/:path*",
        // Next.js forwards it to http://127.0.0.1:8000/...
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/:path*"
            : "https://social-media-content-automator.onrender.com/:path*",
      },
    ];
  },
  
  // 3. Fix for Turbopack root resolution
  experimental: {
    // @ts-ignore - Turbopack root is valid but missing from types
    turbopack: {
      root: path.resolve(__dirname, ".."),
    },
  },
};

export default nextConfig;