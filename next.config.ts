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
  // Configure for Replit environment - allow iframe embedding and cross-origin requests
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
  // Allow dev origins from Replit proxy
  allowedDevOrigins: ['*.replit.dev', '*.spock.replit.dev'],
  // Enable experimental features for React 19 compatibility
  experimental: {
    // Disable React Strict Mode in dev if needed for compatibility
  }
};

export default nextConfig;
