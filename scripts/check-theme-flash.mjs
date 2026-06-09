// =============================================================
// GUARD DE BUILD — protege a BARRA DE STATUS / SPLASH (3 invariantes)
// =============================================================
// Roda no `npm run build` (logo, em TODO deploy da Vercel). Se qualquer um dos 3
// invariantes abaixo quebrar, o BUILD FALHA e o deploy NÃO sobe. Foram bugs caros
// de resolver — NÃO remova nenhum check. Se um falhar, conserte a CAUSA.
//
// 1) `themeColor` no viewport de app/layout.tsx  → a "tarja branca" pisca no topo
//    ao trocar de aba (o Next "restaura" a meta a cada navegação; commit 63e622c).
// 2) Os 2 metas <meta name="theme-color" media="..."> (light #FFFFFF / dark
//    #0f172a) → sem eles, o TOPO volta a ficar BRANCO no modo escuro no PWA
//    INSTALADO. O JS escreve a cor desejada nos dois; os estáticos são a base.
// 3) manifest.json theme_color = #1E9839 (verde) → é o que faz a SPLASH da PWA
//    instalada abrir VERDE de ponta a ponta. Voltar pra branco traz a tarja
//    branca na abertura de volta.
import { readFileSync } from "node:fs";

const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");

// ── 1) themeColor no viewport (tarja branca piscando) ────────────────────────
if (/themeColor\s*:/.test(layout)) {
  console.error(
    "\n❌ BUILD BLOQUEADO: app/layout.tsx voltou a declarar `themeColor` no viewport.\n" +
      "   Isso faz o Next RESTAURAR a meta theme-color a cada navegação → a 'tarja\n" +
      "   branca' volta a piscar no topo ao trocar de aba (commit 63e622c).\n" +
      "   REMOVA o `themeColor:` do export `viewport`. A barra é controlada pelos 2\n" +
      "   metas com media + o script inline (<head>) + ThemeApplier.\n"
  );
  process.exit(1);
}

// ── 2) Os 2 metas theme-color com media (barra escura no PWA instalado) ───────
// Acha a tag <meta ...media="(prefers-color-scheme: X)"...> e confere que ela é
// um theme-color com a cor certa. Robusto à ordem dos atributos.
function metaTagWithMedia(scheme) {
  const re = new RegExp('<meta\\b[^>]*media="\\(prefers-color-scheme:\\s*' + scheme + '\\)"[^>]*>', "i");
  const m = re.exec(layout);
  return m ? m[0] : null;
}
const lightTag = metaTagWithMedia("light");
const darkTag = metaTagWithMedia("dark");
const lightOk = lightTag && /name="theme-color"/i.test(lightTag) && /content="#FFFFFF"/i.test(lightTag);
const darkOk = darkTag && /name="theme-color"/i.test(darkTag) && /content="#0f172a"/i.test(darkTag);
if (!lightOk || !darkOk) {
  console.error(
    "\n❌ BUILD BLOQUEADO: faltam (ou mudaram) os 2 metas theme-color com `media` em\n" +
      "   app/layout.tsx. Sem eles, a barra de status do TOPO volta a ficar BRANCA no\n" +
      "   modo escuro no PWA INSTALADO (Android). Têm que existir, exatamente:\n" +
      '     <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF" />\n' +
      '     <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />\n' +
      "   (light ok=" + Boolean(lightOk) + ", dark ok=" + Boolean(darkOk) + ")\n"
  );
  process.exit(1);
}

// ── 3) manifest.json theme_color = verde (splash verde de ponta a ponta) ──────
const WANT_THEME = "#1E9839";
let manifestTheme = null;
try {
  manifestTheme = JSON.parse(readFileSync(new URL("../public/manifest.json", import.meta.url), "utf8")).theme_color;
} catch (e) {
  console.error("\n❌ BUILD BLOQUEADO: não consegui ler/parsear public/manifest.json.\n");
  process.exit(1);
}
if (manifestTheme !== WANT_THEME) {
  console.error(
    "\n❌ BUILD BLOQUEADO: public/manifest.json theme_color = " + JSON.stringify(manifestTheme) +
      " (esperado " + JSON.stringify(WANT_THEME) + ").\n" +
      "   Esse verde é o que faz a SPLASH da PWA instalada abrir VERDE de ponta a\n" +
      "   ponta. Voltar pra branco traz a tarja branca na abertura de volta.\n"
  );
  process.exit(1);
}

console.log("✓ Guard: barra de status blindada (viewport sem themeColor, 2 metas com media, manifest verde).");
