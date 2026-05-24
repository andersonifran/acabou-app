import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite imagens de domínios externos se necessário
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
