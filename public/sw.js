// Service Worker — Acabou? v4 (offline-first)
// ⚠️ NOME DO CACHE É ESTÁVEL — NÃO versionar por deploy (ex.: NÃO voltar pra
// "acabou-v145"). Ver AGENTS.md: cache versionado ZERAVA o offline a cada deploy
// (a casca sumia → "Sem conexão" até reabrir online). Com nome estável, a casca e
// os estáticos (hash imutável) ficam guardados ENTRE deploys; o frescor online vem
// do network-first (navegação + manifest) e do bypass de RSC (é o RSC bypass que
// evita a "tarja azul", NÃO o zerar-cache). Pra forçar limpeza geral algum dia,
// aí sim renomeie o CACHE (o activate apaga os de nome diferente).
const CACHE = "acabou-pwa";

// Casca do app pra ABRIR offline. /home é o start_url; / é a landing. Tentamos
// guardar /home já na instalação (se logado); se falhar (deslogado → redirect pro
// /login, que o Cache API rejeita), o network-first guarda na 1ª abertura online.
const APP_SHELL = ["/", "/manifest.json", "/home"];

// ── Instalação ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const url of APP_SHELL) {
        try { await cache.add(url); } catch (e) { console.warn("[SW] Precache falhou:", url); }
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

  // ── PEDIDOS RSC do Next (navegação LEVE entre abas / prefetch) ──────────────
  // ⚠️ NÃO REMOVER — protegido pelo guard de build scripts/check-sw-rsc.mjs.
  // SEMPRE rede, NUNCA cache. O Next já faz cache-busting com ?_rsc=<hash>, mas
  // esse hash NÃO depende do build. Se o SW (cache-first) servir um RSC cacheado
  // de um BUILD ANTIGO, o cliente detecta build divergente e cai pra navegação
  // DURA (recarrega o documento inteiro = a "tarja azul" + reload a cada aba).
  // Não interceptar = o browser busca da rede normalmente = navegação leve, sem
  // tarja. (Era a causa real da tarja azul/recarregar em toda troca de aba.)
  if (
    url.searchParams.has("_rsc") ||
    event.request.headers.get("RSC") === "1" ||
    event.request.headers.get("Next-Router-Prefetch") === "1"
  ) {
    return; // deixa passar direto pra rede (sem cache do SW)
  }

  // ── manifest.json: NETWORK-FIRST ──────────────────────────────────────────
  // A cor da SPLASH da PWA instalada vem do `theme_color` do manifest. Se o SW
  // servir um manifest CACHEADO (cache-first), mudanças de cor NÃO chegam (a
  // tarja branca na abertura "não saía" mesmo após deploy). Network-first → o
  // Chrome sempre pega o manifest novo; cai pro cache só offline.
  if (url.pathname === "/manifest.json") {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
          }
          return response;
        })
        .catch(function() { return caches.match(event.request); })
    );
    return;
  }

  // NAVEGAÇÕES (HTML pages): network-first com fallback offline
  // Chrome EXIGE que navegações passem por respondWith para classificar como PWA válida
  if (event.request.mode === "navigate") {
    // Páginas de convite: NUNCA cachear (devem sempre buscar do servidor)
    var isConvite = url.pathname.startsWith("/convite");
    if (isConvite) {
      event.respondWith(
        fetch(event.request).catch(function() {
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title></head>' +
            '<body style="font-family:system-ui;text-align:center;padding:60px 20px">' +
            '<div style="font-size:64px">📶</div><h1>Sem conexão</h1>' +
            '<p style="color:#666">Verifique sua internet e tente novamente.</p>' +
            '<button onclick="location.reload()" style="background:#16a34a;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:16px;cursor:pointer;margin-top:16px">Tentar novamente</button>' +
            '</body></html>',
            { status: 503, headers: { "Content-Type": "text/html" } }
          );
        })
      );
      return;
    }

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
          // OFFLINE: serve a CASCA do cache pro app ABRIR e renderizar do cache
          // local (localStorage → store). Ordem: a própria URL → /home (start_url)
          // → /. Só cai no "Sem conexão" se NUNCA tiver aberto online (sem casca).
          return caches.match(event.request).then(function(cached) {
            if (cached) return cached;
            return caches.match("/home").then(function(shellHome) {
              if (shellHome) return shellHome;
              return caches.match("/").then(function(shellRoot) {
                if (shellRoot) return shellRoot;
                return new Response(
                  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão</title></head>' +
                  '<body style="font-family:system-ui;text-align:center;padding:60px 20px">' +
                  '<div style="font-size:64px">📶</div><h1>Sem conexão</h1>' +
                  '<p style="color:#666">Verifique sua internet e tente novamente.</p>' +
                  '<button onclick="location.reload()" style="background:#16a34a;color:#fff;border:none;padding:12px 32px;border-radius:12px;font-size:16px;cursor:pointer;margin-top:16px">Tentar novamente</button>' +
                  '</body></html>',
                  { status: 503, headers: { "Content-Type": "text/html" } }
                );
              });
            });
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

// ── Push Notifications ──
self.addEventListener("push", function(event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: "Acabou?",
      body: event.data.text(),
      icon: "/web-app-manifest-192x192.png",
      url: "/home",
    };
  }

  var options = {
    body: payload.body || "",
    icon: payload.icon || "/web-app-manifest-192x192.png",
    badge: payload.badge || "/badge.png",
    tag: payload.tag || "acabou-default",
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || "/home",
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "Acabou?", options)
  );
});

// ── Clique na notificação: abre o app na URL certa ──
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  var targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/home";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      // Se já tem uma aba aberta, foca nela e navega
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Senão, abre nova aba
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Aceita SKIP_WAITING do client
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── BLINDAGEM ANTI-FALHA DE NOTIFICACAO (camada 2) ───────────────────────────
// Quando o NAVEGADOR rotaciona/expira a push subscription (acontece sozinho de
// tempos em tempos), ele dispara este evento. Aqui re-inscrevemos na hora e
// re-salvamos no servidor — mesmo SEM o usuario abrir o app. Junto com o
// re-sync na abertura (usePushNotifications), garante que o servidor NUNCA
// fique sem a subscription atual. Foi por isso que so 5/78 recebiam.
var VAPID_PUBLIC_KEY = "BDCuDXLFo5k8SS1MFMlYrfCPQM8lOJBa5MoQjrM1K8_bjnC3HDXRSgRGGfKCIp-Tpg5RdI17JhBH2XsYw2q701g";

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  var raw = self.atob(base64);
  var arr = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

self.addEventListener("pushsubscriptionchange", function(event) {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      .then(function(sub) {
        return fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        });
      })
      .catch(function() {})
  );
});
