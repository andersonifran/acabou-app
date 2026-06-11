// ─────────────────────────────────────────────────────────────────────────────
// GUARDA DE BUILD — anti-vazamento de segredos. ⚠️ NÃO REMOVER.
// Roda no `npm run build` (local E na Vercel). Se um SEGREDO for commitado por
// engano (chave, token, .env, chave privada), BLOQUEIA o build/deploy → o segredo
// NUNCA chega em produção. É a rede de segurança do "nada de segredo no Git".
//
// Varre só os arquivos VERSIONADOS (git ls-files) — scripts locais gitignorados
// (que podem ter chaves de diagnóstico) NÃO entram, pois não vão pro deploy.
// ─────────────────────────────────────────────────────────────────────────────
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

let files;
try {
  files = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter(Boolean);
} catch {
  // Sem git no ambiente: não trava o build por isso (o .gitignore + a auditoria
  // já protegem; este guarda é uma camada extra).
  console.log("[check-secrets] git indisponível — pulando (não bloqueia).");
  process.exit(0);
}

const violations = [];

// 1) Nenhum arquivo de ambiente (.env, .env.local, .env.production…) versionado.
for (const f of files) {
  const base = f.split("/").pop() ?? "";
  if (/^\.env($|\.)/.test(base) && !/\.(example|sample|template)$/.test(base)) {
    violations.push(`Arquivo de ambiente versionado (segredos!): ${f}`);
  }
}

// 2) Padrões de segredo no conteúdo dos arquivos de TEXTO versionados.
const PATTERNS = [
  { re: /APP_USR-[0-9a-fA-F]{8,}-\d{6,}/, name: "Token Mercado Pago (produção)" },
  { re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, name: "Chave privada (PEM)" },
  { re: /re_[A-Za-z0-9]{24,}/, name: "Chave Resend (re_)" },
  { re: /sk_(?:live|test)_[A-Za-z0-9]{20,}/, name: "Chave secreta (sk_live/test)" },
  { re: /xkeysib-[A-Za-z0-9]{20,}/, name: "Chave Brevo/Sendinblue" },
  { re: /SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/, name: "Chave SendGrid" },
  { re: /AIza[0-9A-Za-z_-]{35}/, name: "Chave Google API" },
];

// JWT de SERVICE_ROLE (a chave perigosa do Supabase). A anon key também é JWT,
// mas é PÚBLICA — então só bloqueia se decodificar pra role=service_role.
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

const SKIP = /\.(png|jpe?g|webp|gif|svg|ico|mp4|webm|ttf|woff2?|otf|lock|pdf)$/i;

for (const f of files) {
  if (SKIP.test(f) || /package-lock\.json$/.test(f) || /\.(example|sample|template)$/.test(f)) continue;
  if (f.startsWith("scripts/check-secrets")) continue; // não se auto-flagar
  let content;
  try {
    content = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const { re, name } of PATTERNS) {
    if (re.test(content)) violations.push(`${name} em ${f}`);
  }
  // JWT service_role
  const jwts = content.match(JWT_RE) ?? [];
  for (const tok of jwts) {
    try {
      const payload = JSON.parse(Buffer.from(tok.split(".")[1], "base64url").toString("utf8"));
      if (payload && payload.role === "service_role") {
        violations.push(`JWT SERVICE_ROLE (Supabase admin) em ${f}`);
      }
    } catch {
      // não é JWT decodificável / não é service_role → ignora (anon key é pública)
    }
  }
}

if (violations.length) {
  console.error("\n🚨 [check-secrets] SEGREDO em arquivo versionado — BUILD/DEPLOY BLOQUEADO:");
  for (const v of violations) console.error("   ✗ " + v);
  console.error(
    "\n   Tire o segredo do código. Se for um .env, rode: git rm --cached <arquivo>"
  );
  console.error("   Use SEMPRE variáveis de ambiente (.env.local local + painel da Vercel).\n");
  process.exit(1);
}

console.log("[check-secrets] OK — nenhum segredo em arquivos versionados. ✅");
