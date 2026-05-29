import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xroejgnmcuwydrekiury.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Compressão gzip automática para respostas menores
  compress: true,
  async headers() {
    return [
      {
        // Convite: NUNCA cachear — link deve funcionar sempre que clicado
        source: "/convite/:token*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      {
        // Service Worker: nunca cachear — garante que atualizações chegam imediatamente
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Manifest: sempre fresco para o Chrome detectar mudanças
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
