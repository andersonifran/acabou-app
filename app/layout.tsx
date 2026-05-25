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
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
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
        {/* Captura beforeinstallprompt ANTES do React montar — nunca perde o evento */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Captura beforeinstallprompt IMEDIATAMENTE — antes de qualquer coisa
                window.__pwaPrompt = null;
                window.__pwaInstalled = false;

                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__pwaPrompt = e;
                  console.log('[PWA] beforeinstallprompt capturado!');
                  window.dispatchEvent(new Event('pwa-prompt-ready'));
                });

                window.addEventListener('appinstalled', function() {
                  window.__pwaPrompt = null;
                  window.__pwaInstalled = true;
                  window.dispatchEvent(new Event('pwa-installed'));
                });

                // Registra SW — compatível com qualquer estado do documento
                if ('serviceWorker' in navigator) {
                  function registerSW() {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then(function(reg) {
                        console.log('[SW] Registrado. Scope:', reg.scope, '| Estado:', reg.active ? reg.active.state : 'sem worker ativo');
                        // Força ativação imediata se há um SW aguardando
                        if (reg.waiting) {
                          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                      })
                      .catch(function(err) {
                        console.error('[SW] ERRO ao registrar:', err);
                      });
                  }

                  // Executa imediatamente se a página já carregou, senão aguarda
                  if (document.readyState === 'complete') {
                    registerSW();
                  } else {
                    window.addEventListener('load', registerSW, { once: true });
                  }
                } else {
                  console.warn('[PWA] Service Worker não suportado neste navegador');
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
