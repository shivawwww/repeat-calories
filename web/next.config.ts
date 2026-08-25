import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve the FCM service worker from root scope so push notifications work
      { source: '/firebase-messaging-sw.js', destination: '/api/firebase-sw' },
    ]
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
