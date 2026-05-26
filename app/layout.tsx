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
        {/* Meta Pixel — Rastreamento de conversões Facebook/Instagram Ads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1001902148978619');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1001902148978619&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* PWA — beforeinstallprompt */}
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
