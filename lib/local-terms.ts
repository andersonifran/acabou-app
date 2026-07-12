import { ItemStatus, STATUS_LABELS } from "@/types";

// =============================================================
// VOCABULÁRIO POR TIPO DE LOCAL — fonte única (Anderson 02/07).
//
// Quem criou uma EMPRESA não pode ler "Tem em casa" (pego no teste E2E).
// O padrão já existia na Lista (LOCATION_COPY) — aqui ele vira a fonte
// única pra TODO o app: badges, modal de adicionar, despensa, histórico,
// home. Regra: onde o app fala DO LOCAL DO USUÁRIO → adapta; onde fala
// do produto em geral (landing/termos) → neutro.
//
// `property_type` vem de houses.property_type (casa | apartamento | praia
// | veraneio | empresa | outro). Fallback SEMPRE "casa" (dados antigos).
// =============================================================

export type LocalTerms = {
  /** Rótulo completo do status "tem" — ex.: "Tem em casa" / "Tem na empresa". */
  temLabel: string;
  /** Locativo curto pra compor frases — "em casa" / "na empresa" / "no apê". */
  noLocal: string;
  /** Possessivo — "sua casa" / "sua empresa" / "seu apê" (minúsculo). */
  seuLocal: string;
};

const TERMS: Record<string, LocalTerms> = {
  casa:        { temLabel: "Tem em casa",     noLocal: "em casa",     seuLocal: "sua casa" },
  apartamento: { temLabel: "Tem no apê",      noLocal: "no apê",      seuLocal: "seu apê" },
  praia:       { temLabel: "Tem na praia",    noLocal: "na praia",    seuLocal: "sua casa de praia" },
  veraneio:    { temLabel: "Tem no veraneio", noLocal: "no veraneio", seuLocal: "seu veraneio" },
  empresa:     { temLabel: "Tem na empresa",  noLocal: "na empresa",  seuLocal: "sua empresa" },
  outro:       { temLabel: "Tem no local",    noLocal: "no local",    seuLocal: "seu local" },
};

export function localTerms(propertyType?: string | null): LocalTerms {
  return TERMS[propertyType ?? "casa"] ?? TERMS.casa;
}

/** STATUS_LABELS ciente do local: só o "tem" muda; os demais são neutros. */
export function statusLabelFor(status: ItemStatus, propertyType?: string | null): string {
  if (status === "tem") return localTerms(propertyType).temLabel;
  return STATUS_LABELS[status];
}
