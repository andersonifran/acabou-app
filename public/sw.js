// Service Worker — Acabou?
const CACHE = "acabou-v1";

// Recursos essenciais para funcionar offline
const PRE_CACHE = [
  "/",
  "/manifest.json",
  "/offline",
];

// ── Instalação: pré-cacheia recursos essenciais ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRE_CACHE)).then(() => self.skipWaiting())
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

// ── Fetch: estratégia Network-first para tudo ──
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignora: não-GET, APIs do Supabase, API routes
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("supabase")) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("googleapis")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cacheia respostas bem-sucedidas de recursos do próprio app
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: tenta cache, senão mostra página offline
        return caches.match(event.request).then(
          (cached) => cached ?? caches.match("/offline") ?? new Response("Sem conexão", { status: 503 })
        );
      })
  );
});
