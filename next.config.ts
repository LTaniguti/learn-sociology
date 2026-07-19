import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Deployed under https://ltaniguti.github.io/learn-sociology/ — a future
  // custom domain would remove this line.
  basePath: "/learn-sociology",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
