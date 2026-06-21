import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "img.ophim.live", pathname: "/**" },
      { protocol: "https", hostname: "phimimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.phimapi.com", pathname: "/**" },
      { protocol: "https", hostname: "ophim.tv", pathname: "/**" },
      { protocol: "https", hostname: "s4.phim1280.tv", pathname: "/**" },
    ],
  },
};

export default nextConfig;
