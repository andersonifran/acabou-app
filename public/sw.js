// Service Worker — Acabou?
const CACHE = "acabou-v2";

const PRE_CACHE = [
  "/",
  "/manifest.json",
];

// ── Instalação: cacheia recursos essenciais (resiliente a falhas individuais) ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // Cacheia individualmente — uma falha não derruba todo o SW
      for (const url of PRE_CACHE) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn("[SW] Falha ao cachear:", url, e);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// ── Ativação: limpa caches antigos e assume controle ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first com fallback para cache ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Só intercepta GET da própria origem
  if (event.request.method !== "GET") return;
  if (url.hostname !== self.location.hostname) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ??
            new Response(
              `<!doctype html><html><head><meta charset="utf-8"><title>Sem conexão</title></head>
               <body style="font-family:sans-serif;text-align:center;padding:60px 20px">
               <div style="font-size:64px">📶</div>
               <h1>Sem conexão</h1>
               <p>Verifique sua internet e tente novamente.</p>
               <button onclick="location.reload()" style="background:#16a34a;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:16px;cursor:pointer;margin-top:16px">Tentar novamente</button>
               </body></html>`,
              { status: 503, headers: { "Content-Type": "text/html" } }
            )
        )
      )
  );
});
