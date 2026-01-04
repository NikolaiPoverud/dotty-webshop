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
    return [
      // www to non-www redirects - exclude API routes for webhooks
      {
        source: '/((?!api).*)',
        has: [{ type: 'host', value: 'www.dotty.no' }],
        destination: 'https://dotty.no/:path*',
        permanent: true,
      },
      {
        source: '/((?!api).*)',
        has: [{ type: 'host', value: 'www.dottyartwork.no' }],
        destination: 'https://dottyartwork.no/:path*',
        permanent: true,
      },
      {
        source: '/((?!api).*)',
        has: [{ type: 'host', value: 'www.dottyartwork.com' }],
        destination: 'https://dottyartwork.com/:path*',
        permanent: true,
      },
    ];
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
