"use client";

// =============================================================
// APRENDIZADO DE ITENS — o app "aprende" o que VOCÊ usa, entre TODAS as casas.
//
// Guardado no localStorage (por aparelho), então um item usado na "Casa" passa
// a ser sugerido também na "Praia"/"Empresa". A contagem de uso vira RANKING:
// quanto mais você usa um item, mais alto ele aparece nas sugestões.
//
// 100% local (sem servidor) = instantâneo, offline, privado. Limitado aos 300
// mais usados pra nunca crescer demais.
// =============================================================

const KEY = "acabou-learned-items";
const MAX = 300;

export type LearnedItem = { name: string; category: string; count: number; updatedAt: number };

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function read(): Record<string, LearnedItem> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, LearnedItem>;
  } catch {
    return {};
  }
}

function write(map: Record<string, LearnedItem>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota cheia → ignora silenciosamente */
  }
}

// Registra que o usuário usou (adicionou/marcou) um item. Soma na contagem.
export function recordItemUse(name: string, category: string) {
  const clean = name.trim();
  if (!clean) return;
  const map = read();
  const k = norm(clean);
  const prev = map[k];
  map[k] = {
    name: clean,
    category: category || prev?.category || "Outros",
    count: (prev?.count ?? 0) + 1,
    updatedAt: Date.now(),
  };

  // Mantém só os 300 mais usados (poda os menos usados / mais antigos).
  const entries = Object.entries(map);
  if (entries.length > MAX) {
    entries.sort((a, b) => b[1].count - a[1].count || b[1].updatedAt - a[1].updatedAt);
    write(Object.fromEntries(entries.slice(0, MAX)));
  } else {
    write(map);
  }
}

// Lista os itens aprendidos, do mais usado pro menos usado.
export function getLearnedItems(): LearnedItem[] {
  return Object.values(read()).sort((a, b) => b.count - a.count || b.updatedAt - a.updatedAt);
}
