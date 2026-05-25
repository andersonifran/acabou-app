// Service Worker — Acabou? v3
const CACHE = "acabou-v3";

// ── Instalação ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const urls = ["/", "/manifest.json"];
      for (const url of urls) {
        try { await cache.add(url); } catch (e) { console.warn("[SW] Cache falhou:", url); }
      }
    }).then(() => self.skipWaiting())
  );
});

// ── Ativação: limpa caches antigos ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: OBRIGATÓRIO responder navegações para Chrome considerar instalável ──
self.addEventListener("fetch", (event) => {
  var url = new URL(event.request.url);

  // Só GET da própria origem
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // NAVEGAÇÕES (HTML pages): network-first com fallback offline
  // Chrome EXIGE que navegações passem por respondWith para classificar como PWA válida
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(cached) {
            return cached || new Response(
              '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title></head>' +
              '<body style="font-family:system-ui;text-align:center;padding:60px 20px">' +
              '<div style="font-size:64px">📶</div><h1>Sem conexão</h1>' +
              '<p style="color:#666">Verifique sua internet e tente novamente.</p>' +
              '<button onclick="location.reload()" style="background:#16a34a;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:16px;cursor:pointer;margin-top:16px">Tentar novamente</button>' +
              '</body></html>',
              { status: 503, headers: { "Content-Type": "text/html" } }
            );
          });
        })
    );
    return;
  }

  // Sub-recursos estáticos (JS, CSS, imagens, fontes): cache-first
  // NÃO ignora /_next/ — Chrome precisa ver o fetch handler respondendo
  if (url.pathname.startsWith("/api/")) return; // APIs nunca cacheia

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response.ok && response.type === "basic") {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      return new Response("", { status: 503 });
    })
  );
});

// Aceita SKIP_WAITING do client
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
