import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "phim.nguonc.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
