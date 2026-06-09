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
- Ao mexer no `sw.js`, **suba a versão do `CACHE`** (ex.: `acabou-v142` → `v143`)
  pra que o SW novo limpe o cache antigo dos usuários no `activate`.
- Templates do Next (`template.tsx`) remontam a página a cada navegação → NÃO usar
  em rotas de aba (causa "recarregar toda vez", inclusive ao clicar na aba atual).

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
