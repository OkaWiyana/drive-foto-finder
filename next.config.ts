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
};

export default nextConfig;
