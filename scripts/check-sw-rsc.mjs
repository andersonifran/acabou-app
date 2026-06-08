// =============================================================
// GUARD DE BUILD — protege o bypass de RSC no service worker
// =============================================================
// Roda no `npm run build` (logo, em TODO deploy da Vercel). Se o public/sw.js
// perder o bypass de RSC, o BUILD FALHA e o deploy NÃO sobe — assim o bug da
// "tarja azul + recarregar a cada troca de aba" nunca volta por descuido.
//
// CONTEXTO: o Next faz navegação leve via GET /rota?_rsc=<hash>. Se o service
// worker cachear (cache-first) esses pedidos, ele serve um RSC de build ANTIGO
// pro cliente novo → Next detecta build divergente → cai pra navegação DURA
// (recarrega o documento = tarja azul). A correção é o SW deixar os pedidos RSC
// SEMPRE irem pra rede (nunca cache). Ver commit 39923c0.
//
// Se este check falhar: NÃO remova o check. Restaure o bypass no public/sw.js.
import { readFileSync } from "node:fs";

const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

const hasRscBypass =
  sw.includes('searchParams.has("_rsc")') &&
  sw.includes("Next-Router-Prefetch");

if (!hasRscBypass) {
  console.error(
    "\n❌ BUILD BLOQUEADO: public/sw.js perdeu o bypass de RSC.\n" +
      "   Sem ele, o service worker volta a cachear os pedidos de navegação do\n" +
      "   Next e reintroduz a 'tarja azul' + recarregar a cada troca de aba.\n\n" +
      "   Restaure no sw.js, ANTES de qualquer estratégia de cache:\n\n" +
      '     if (\n' +
      '       url.searchParams.has("_rsc") ||\n' +
      '       event.request.headers.get("RSC") === "1" ||\n' +
      '       event.request.headers.get("Next-Router-Prefetch") === "1"\n' +
      "     ) {\n" +
      "       return; // pedidos RSC sempre da rede, nunca cache\n" +
      "     }\n"
  );
  process.exit(1);
}

console.log("✓ Guard: bypass de RSC presente no service worker.");
