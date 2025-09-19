import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Remove turbopack to avoid compatibility issues in Replit
  // Configure for Replit environment - allow iframe embedding
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ]
      }
    ]
  },
  // Enable experimental features for React 19 compatibility
  experimental: {
    // Disable React Strict Mode in dev if needed for compatibility
  }
};

export default nextConfig;
