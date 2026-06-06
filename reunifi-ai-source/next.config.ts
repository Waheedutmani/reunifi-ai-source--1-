import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-2d7bd6b4-d922-4e4c-9b4d-b58547eb71af.space-z.ai',
  ],
};

export default nextConfig;
