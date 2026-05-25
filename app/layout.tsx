import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Acabou? — Sua casa sempre sabe o que precisa comprar",
  description:
    "Marque o que acabou em segundos, compartilhe com sua família e vá ao mercado com a lista certa.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Acabou?" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Acabou?",
    description: "Sua casa sempre sabe o que precisa comprar.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
        {/* Registro do Service Worker — habilita offline + instalação */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[SW] Registrado:', reg.scope); })
                    .catch(function(err) { console.warn('[SW] Falha:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
