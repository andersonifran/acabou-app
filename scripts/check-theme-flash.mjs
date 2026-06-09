// =============================================================
// GUARD DE BUILD — protege contra a volta da "tarja branca" no topo
// =============================================================
// Roda no `npm run build` (logo, em TODO deploy da Vercel). Se app/layout.tsx
// voltar a declarar `themeColor` no viewport, o BUILD FALHA e o deploy NÃO sobe.
//
// CONTEXTO: o Next "restaura" a meta theme-color pro valor estático do viewport a
// CADA navegação. Como o ThemeApplier re-coloca o navy logo depois, o branco
// aparecia no meio = a "tarja branca" piscando ao trocar de aba (commit 63e622c).
// A barra de status é controlada 100% pelo nosso script inline (<head>) +
// ThemeApplier — o viewport NÃO pode declarar themeColor.
//
// Se este check falhar: NÃO o remova. Tire o `themeColor:` do viewport.
import { readFileSync } from "node:fs";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

// Procura a PROPRIEDADE `themeColor:` (não pega a palavra em comentários).
if (/themeColor\s*:/.test(layout)) {
  console.error(
    "\n❌ BUILD BLOQUEADO: app/layout.tsx voltou a declarar `themeColor` no viewport.\n" +
      "   Isso faz o Next RESTAURAR a meta theme-color a cada navegação → a 'tarja\n" +
      "   branca' volta a piscar no topo ao trocar de aba.\n\n" +
      "   A barra de status é controlada pelo script inline (<head>) + ThemeApplier.\n" +
      "   REMOVA o `themeColor:` do export `viewport` em app/layout.tsx.\n"
  );
  process.exit(1);
}

console.log("✓ Guard: viewport sem themeColor (barra de status controlada pelo nosso script).");
