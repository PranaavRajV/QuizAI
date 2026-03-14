import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://quizai-production.up.railway.app';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google User Images
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'quizai-production.up.railway.app',
        pathname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: BACKEND_URL,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: Similarly to ESLint, this enables production builds to successfully
    // complete even if your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
