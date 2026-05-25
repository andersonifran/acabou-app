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
      <head>
        {/* Script no <head> — executa ANTES de qualquer JS do React/Next.js.
            Captura beforeinstallprompt no instante mais cedo possível. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaPrompt=null;
              window.__pwaInstalled=false;
              window.addEventListener('beforeinstallprompt',function(e){
                e.preventDefault();
                window.__pwaPrompt=e;
                window.dispatchEvent(new Event('pwa-prompt-ready'));
              });
              window.addEventListener('appinstalled',function(){
                window.__pwaPrompt=null;
                window.__pwaInstalled=true;
                window.dispatchEvent(new Event('pwa-installed'));
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}

        {/* SW registration no body — pode rodar depois, sem pressa */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if('serviceWorker' in navigator){
                navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
                  .then(function(r){
                    if(r.waiting)r.waiting.postMessage({type:'SKIP_WAITING'});
                  })
                  .catch(function(e){console.error('[SW]',e)});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
