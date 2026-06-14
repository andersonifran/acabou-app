<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ⚠️ REGRA CRÍTICA — Service Worker NUNCA pode cachear pedidos RSC

`public/sw.js` **NÃO pode cachear** os pedidos de navegação do Next App Router
(URLs com `?_rsc=`, ou header `RSC: 1` / `Next-Router-Prefetch: 1`). Eles têm que
ir **sempre pra rede**. Se forem cacheados (cache-first), o SW serve um RSC de
build ANTIGO pro cliente novo → o Next detecta build divergente → cai pra
navegação DURA (recarrega o documento) = **"tarja azul" + recarregar a cada troca
de aba**. Já aconteceu e custou caro (commit 39923c0).

- O bypass de RSC fica NO TOPO do `fetch` handler do `sw.js`, ANTES de qualquer
  estratégia de cache (`return;` sem `respondWith`).
- Há um guard de build (`scripts/check-sw-rsc.mjs`, roda no `npm run build`/Vercel)
  que **bloqueia o deploy** se o bypass sumir. NÃO remova o guard.
- ⚠️ **NÃO versionar o nome do `CACHE` por deploy.** Desde v4 ele é ESTÁVEL
  (`acabou-pwa`). Cache versionado (`acabou-v144`→`v145`…) **ZERAVA o offline a
  cada deploy** — o `activate` apagava a casca, e o app caía no "Sem conexão" até
  reabrir online (foi o bug que o Anderson pegou no modo avião). O SW atualiza
  sozinho quando o `sw.js` muda (registrado com `updateViaCache:'none'` +
  `skipWaiting`/`clients.claim`), **sem** precisar bumpar o nome do cache. Quem
  protege da "tarja azul" é o **bypass de RSC** (acima), NÃO o zerar-cache. Só
  renomeie o `CACHE` se um dia precisar forçar uma limpeza geral (o `activate`
  apaga caches de nome diferente do atual).
- Templates do Next (`template.tsx`) remontam a página a cada navegação → NÃO usar
  em rotas de aba (causa "recarregar toda vez", inclusive ao clicar na aba atual).

# ℹ️ OFFLINE-FIRST (PWA) — como o app abre/funciona sem internet

- ⚠️ **REGRA DE OURO (v5):** NUNCA cachear nem servir uma resposta **REDIRECIONADA**
  numa NAVEGAÇÃO. O Chrome recusa "redirected response" em navegação (redirect mode
  != follow) → **ERR_FAILED** ao abrir offline. A raiz `/` redireciona pra `/home`
  (logado) e o **app da Play (TWA) abre na `/`** (`startUrl:"/"` no twa-manifest) →
  por isso NUNCA cacheamos `/` e filtramos `response.redirected` ao cachear E ao
  servir. Isso já quebrou o offline (ERR_FAILED) e custou 3 tentativas — não voltar.
- **Abrir offline:** no `catch` da navegação (rede falhou), o `sw.js` serve a
  CASCA do cache nesta ordem: a própria URL → `/home` (start_url) → `/`, **pulando
  qualquer resposta redirecionada/opaque**. Assim o app ABRE offline e o cliente
  renderiza do **cache local** (`localStorage` → store Zustand `acabou-app-cache`).
  Só cai no HTML "Sem conexão" se NUNCA tiver aberto online (sem casca guardada).
- **Auth offline:** `app/(app)/layout.tsx` renderiza na hora se há casa no cache
  (`hasCachedHouse()`); os `getUser()` de fundo estão em `try/catch` → rede ruim
  NÃO redireciona pro `/login` nem quebra (mantém o cache). 1ª vez sem internet
  (sem cache) → tela honesta `offlineNoData` ("abra uma vez conectado").
- **TODO (Etapa 2 — combinada):** marcar/editar offline hoje **reverte** (sem
  fila). Falta uma FILA de escrita offline + sync ao voltar a rede (respeitando o
  anti-burla no servidor) pra cumprir a promessa "marca offline, sincroniza
  depois" da landing. Ver memória `offline-first-pwa`.

# ⚠️ REGRA CRÍTICA — não declarar `themeColor` no viewport (tarja branca no topo)

O `export const viewport` em `app/layout.tsx` **NÃO pode declarar `themeColor`**. O
Next "restaura" a meta theme-color pro valor estático a CADA navegação e o
ThemeApplier re-coloca o navy logo depois → a **"tarja branca" pisca no topo ao
trocar de aba** (custou caro, commit 63e622c).

A barra de status usa **dois metas estáticos com `media` no `<head>` JSX**
(`light=#FFFFFF`, `dark=#0f172a`) — JSX cru, NÃO `themeColor` no viewport, então o
Next NÃO os restaura por navegação. Eles dão o caminho NATIVO (Chrome >=93, PWA
instalado/standalone Android resolve claro/escuro), o que conserta o **topo branco
no PWA instalado em modo escuro** (a meta dinâmica única não bastava).

O JS (script inline no `<head>` + `ThemeApplier` + o evento `acabou-theme` do
toggle) **força a cor desejada (`want`) escrevendo o MESMO `content` nos DOIS
metas**. Como os dois ficam com a mesma cor, qualquer que seja o tema do SISTEMA
que o Chrome use pra escolher entre eles, a barra fica certa: navy no escuro do
app; branco no claro **e na landing mesmo sob sistema escuro**; e o toggle
`acabou_theme` manda (força navy/branco independente do sistema).

⚠️ **NÃO** apendar um meta theme-color SEM `media` DEPOIS dos com-media achando que
"vence" — NÃO vence: o Chrome usa o **PRIMEIRO** meta cujo `media` casa
(*first-match-wins*, tree order). Pra sobrepor, **escreva o `content` dos próprios
metas-com-media** (o Chrome honra mudança dinâmica de content). Esse erro já foi
cometido e a verificação adversarial pegou (override apendado nunca era alcançado
sob sistema escuro → landing/claro ficavam navy).

ANTI-FLASH: só alterar o `content` quando o valor MUDA (na troca de aba, mesmo
tema → não toca → não pisca). O toggle dispara `window.dispatchEvent(new
Event("acabou-theme"))` pra a barra atualizar NA HORA.
- Guard de build: `scripts/check-theme-flash.mjs` (roda no `npm run build`/Vercel)
  bloqueia o deploy se `themeColor` voltar pro viewport. NÃO remova o guard.

# ℹ️ LIMITE CONHECIDO — tarja branca na SPLASH da PWA instalada (NÃO é bug, NÃO perseguir)

Ao ABRIR a PWA instalada (Android, display standalone), aparece ~200ms de barra de
status na **cor PADRÃO DO SISTEMA** (branca no claro / escura no escuro) ANTES do
Chrome aplicar o `theme_color` verde. É **ARQUITETURAL**: o Android 12+ desenha a
Window de splash do SISTEMA antes do Chrome entrar, e a PWA pura NÃO tem acesso a
esse tema. Só a casca nativa (TWA/.aab da Play) controla o frame 0 — por isso o app
da Play abre verde de ponta a ponta e a PWA não. Confirmado por pesquisa (Chromium
40759522, bubblewrap #488, web.dev ~200ms). 
- `manifest.json` `theme_color`/`background_color` = `#1E9839` (verde) é o TETO do
  controlável pela web — **MANTER** (não voltar pra branco).
- NÃO migrar pra `display:"fullscreen"` (esconde relógio/bateria pra sempre).
- NÃO mexer nos metas theme-color/viewport pra tentar "consertar" a splash —
  quebraria a barra INTERNA (que já está certa) e os guards. Verde perfeito na
  abertura = só via TWA (que já existe).
