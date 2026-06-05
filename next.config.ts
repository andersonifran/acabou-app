import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  org: "grupo-kazin",
  project: "javascript-nextjs",
  sourcemaps: {
    // Só envia source maps quando o token existe (na Vercel). Localmente, sem
    // token, fica desligado — build limpo, sem atrito.
    disable: !process.env.SENTRY_AUTH_TOKEN,
    // Apaga os source maps do output público após o upload — os erros ficam
    // legíveis no Sentry, mas o código NÃO fica exposto pros usuários.
    deleteSourcemapsAfterUpload: true,
  },
  // Não envia telemetria do próprio Sentry.
  telemetry: false,
  // Reduz logs no build (mostra só em CI).
  silent: !process.env.CI,
});
