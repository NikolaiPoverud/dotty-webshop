import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // Redirect non-locale paths to Norwegian (default)
      { source: '/butikk', destination: '/no/butikk', permanent: true },
      { source: '/butikk/:slug', destination: '/no/butikk/:slug', permanent: true },
      { source: '/shop', destination: '/no/butikk', permanent: true },
      { source: '/shop/:slug', destination: '/no/butikk/:slug', permanent: true },
      { source: '/handlekurv', destination: '/no/handlekurv', permanent: true },
      { source: '/cart', destination: '/no/handlekurv', permanent: true },
      { source: '/kasse', destination: '/no/kasse', permanent: true },
      { source: '/checkout', destination: '/no/kasse', permanent: true },
      { source: '/solgt', destination: '/no/solgt', permanent: true },
      { source: '/sold', destination: '/no/solgt', permanent: true },
      { source: '/privacy', destination: '/no/privacy', permanent: true },
      { source: '/terms', destination: '/no/terms', permanent: true },
    ];
  },
};

export default nextConfig;
