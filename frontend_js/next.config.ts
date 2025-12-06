import type { NextConfig } from "next";
import path from "path";

const API_URL = process.env.NODE_ENV === "development"
  ? "http://127.0.0.1:8000"
  : "https://social-media-content-automator.onrender.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Rewrites removed in favor of explicit Proxy Route (app/api/python/[...path]/route.ts)
  // async rewrites() { ... }
  
  experimental: {
    // @ts-ignore - Turbopack root is valid but missing from types
    turbopack: {
      root: path.resolve(__dirname, ".."),
    },
  },
};

export default nextConfig;