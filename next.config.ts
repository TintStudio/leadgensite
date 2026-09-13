import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce standalone output for serverless deployment
  // output: "standalone",

  // Redirect trailing slashes for consistency
  trailingSlash: false,

  // Image optimization — configure remote patterns as needed
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
