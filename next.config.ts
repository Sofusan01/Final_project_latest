import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Firebase hosting
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
