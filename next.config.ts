import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/visualrecords' : '', // Replace with your repo name
  assetPrefix: process.env.NODE_ENV === 'production' ? '/visualrecords/' : '', // Replace with your repo name
};

export default nextConfig;
