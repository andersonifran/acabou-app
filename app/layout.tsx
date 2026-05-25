import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
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

        {/* Registra SW e captura beforeinstallprompt via next/script (execução confiável) */}
        <Script
          id="pwa-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.__pwaPrompt = window.__pwaPrompt || null;
                window.__pwaInstalled = window.__pwaInstalled || false;

                // Escuta beforeinstallprompt (pode chegar a qualquer momento)
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.__pwaPrompt = e;
                  console.log('[PWA] ✅ beforeinstallprompt capturado!');
                  window.dispatchEvent(new Event('pwa-prompt-ready'));
                });

                window.addEventListener('appinstalled', function() {
                  window.__pwaPrompt = null;
                  window.__pwaInstalled = true;
                  console.log('[PWA] App instalado!');
                  window.dispatchEvent(new Event('pwa-installed'));
                });

                // Registra o Service Worker
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] ✅ Registrado. Scope:', reg.scope);
                      console.log('[SW] Estado:', reg.installing ? 'installing' : reg.waiting ? 'waiting' : reg.active ? reg.active.state : 'unknown');
                      if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                      }
                      // Escuta mudanças de estado do SW
                      reg.addEventListener('updatefound', function() {
                        var newSW = reg.installing;
                        if (newSW) {
                          newSW.addEventListener('statechange', function() {
                            console.log('[SW] Estado mudou:', newSW.state);
                          });
                        }
                      });
                    })
                    .catch(function(err) {
                      console.error('[SW] ❌ Erro ao registrar:', err);
                    });
                } else {
                  console.warn('[PWA] ⚠️ Service Worker não suportado');
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
