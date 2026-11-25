import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  async rewrites() {
    return [
      {
        source: "/_next/static/chunks/tfjs-backend-wasm-simd.wasm",
        destination: "/tfjs-backend-wasm-simd.wasm",
      },
      {
        source: "/_next/static/chunks/tfjs-backend-wasm.wasm",
        destination: "/tfjs-backend-wasm.wasm",
      },
      {
        source: "/_next/static/chunks/tfjs-backend-wasm-threaded-simd.wasm",
        destination: "/tfjs-backend-wasm-threaded-simd.wasm",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
