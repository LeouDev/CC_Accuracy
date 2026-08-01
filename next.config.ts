import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/CC_Accuracy",
  assetPrefix: "/CC_Accuracy/",
  images: { unoptimized: true },
};

export default nextConfig;
