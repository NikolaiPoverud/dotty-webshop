import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Cap image sizes at 800px to protect artwork from high-res downloads
    deviceSizes: [320, 420, 640, 800],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  async redirects() {
    // Domain redirects are handled by Vercel and middleware
    // Do NOT add www redirects here - they conflict with Vercel's domain config
    return [];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
