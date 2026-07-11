import "server-only"; // nunca pode ir pro client (usa node:crypto + lógica anti-farm)
import { createHash } from "node:crypto";

/**
 * Normaliza o email para detectar a MESMA pessoa em variações comuns usadas
 * para farmar trial (excluir conta + recriar com "outro" email que cai na mesma
 * caixa):
 *  - minúsculas + trim
 *  - remove +alias (nome+qualquercoisa@dominio → nome@dominio) — a maioria dos
 *    provedores entrega na mesma caixa
 *  - gmail/googlemail: remove os PONTOS do local part (j.o.a.o@gmail = joao@gmail)
 *    e trata googlemail.com como gmail.com
 *
 * É a ÚNICA fonte de normalização (runtime + backfill usam esta função), pra
 * nunca dar divergência de hash.
 */
export function normalizeEmail(email: string): string {
  const e = (email || "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0) return e; // sem @ válido → devolve como veio (lower+trim)
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  // remove +alias
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  // gmail ignora pontos no local part; googlemail é o mesmo provedor
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return local + "@" + domain;
}

/**
 * Hash SHA-256 (hex) do email normalizado. É o "fingerprint" anti-farm: igual
 * para o mesmo email (e suas variações), sem guardar o email em si.
 */
export function emailTrialHash(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

/**
 * Hash SHA-256 do TELEFONE normalizado (2ª camada anti-farm — Anderson 02/07).
 * Racional: criar um e-mail novo é grátis; trocar de WhatsApp, não. Quem tenta
 * farmar trial com "outro e-mail" quase sempre repete o telefone do cadastro.
 * Normalização: só dígitos; remove o DDI 55 do Brasil quando presente.
 * Prefixo "tel:" no hash → nunca colide com hash de e-mail na mesma tabela.
 * Retorna null se curto demais pra ser um telefone real (não rastreável).
 */
export function phoneTrialHash(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const d = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
  return createHash("sha256").update("tel:" + d).digest("hex");
}
