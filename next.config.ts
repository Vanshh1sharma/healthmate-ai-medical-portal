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
  allowedDevOrigins: [
    '*.replit.dev', 
    '*.spock.replit.dev',
    '*.riker.replit.dev',
    'a3208534-89e5-4f06-9eb7-60199546c3b9-00-24e8bgfkf1k4a.riker.replit.dev',
    '127.0.0.1',
    'localhost'
  ],
  // Enable experimental features for React 19 compatibility
  experimental: {
    // Disable React Strict Mode in dev if needed for compatibility
  }
};

export default nextConfig;
