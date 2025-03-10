import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'dist',
  output: 'export',
  images: {
    unoptimized: true,
  },
  compiler: {
    styledComponents: true,
  },
  async redirects() {
    return [
      {
        source: '/AIAPT',
        destination: '/AIAPT',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
