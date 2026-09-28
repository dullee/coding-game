import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["eslint"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

export default nextConfig;
