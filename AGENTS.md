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
trocar de aba** (custou caro, commit 63e622c). A barra de status é controlada 100%
pelo **script inline no `<head>`** (cria/atualiza a meta) + **ThemeApplier** (segue o
tema, navy no escuro), e só altera quando o valor MUDA (não pisca na navegação).
- Guard de build: `scripts/check-theme-flash.mjs` (roda no `npm run build`/Vercel)
  bloqueia o deploy se `themeColor` voltar pro viewport. NÃO remova o guard.
