import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeApplier } from "@/components/shared/ThemeApplier";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Acabou? — Sua casa sempre sabe o que precisa comprar",
  description:
    "Marque o que acabou em segundos, compartilhe com sua família e vá ao mercado com a lista certa.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/web-app-manifest-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/web-app-manifest-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/web-app-manifest-192x192.png",
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
  themeColor: "#FFFFFF",
  // O app tem o PRÓPRIO modo escuro (classe .dark). Declarar color-scheme evita
  // que o "Forçar Modo escuro p/ conteúdo web" (Chrome/Samsung) escureça o app
  // à força — era isso que deixava o fundo (atrás das barras) preto.
  colorScheme: "light",
  // Quando o teclado do celular sobe, ele EMPURRA o conteúdo pra cima (em vez de
  // cobrir). Assim o campo digitado + as sugestões ficam SEMPRE visíveis acima do
  // teclado — é o comportamento dos apps grandes. Resolve o teclado tampando o
  // modal de adicionar item.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={geist.variable} suppressHydrationWarning>
      <head>
        {/* Dark mode — aplica APENAS dentro das rotas do app (area logada).
            Landing, login, cadastro e termos sempre ficam no modo claro
            para garantir leitura e branding consistente.
            IMPORTANTE: Só ativa dark se o usuário ESCOLHEU explicitamente. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var path = window.location.pathname;
                  var appRoutes = ['/home','/despensa','/lista','/casa','/configuracoes','/planos','/feedback'];
                  var isAppRoute = appRoutes.some(function(r){ return path === r || path.indexOf(r + '/') === 0; });
                  var stored = localStorage.getItem('acabou_theme');
                  var sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  // Segue o tema do CELULAR; o botão do app (acabou_theme) é override.
                  var useDark = isAppRoute && (stored === 'dark' || (stored == null && sysDark));
                  if (useDark) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                  // Barra de status segue o tema; só altera quando MUDA (não pisca
                  // na troca de aba, pois o valor é o mesmo).
                  var m = document.querySelector('meta[name="theme-color"]');
                  var want = useDark ? '#0f172a' : '#FFFFFF';
                  if (m && m.getAttribute('content') !== want) m.setAttribute('content', want);
                } catch(e){}
              })();
            `,
          }}
        />
        {/* Google Tag (gtag.js) — Rastreamento de conversões Google Ads */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17962382785" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17962382785');
            `,
          }}
        />
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
        <ThemeApplier />
        {children}

        {/* Vercel Web Analytics (acessos / páginas mais vistas) — incluído no plano */}
        <Analytics />

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
