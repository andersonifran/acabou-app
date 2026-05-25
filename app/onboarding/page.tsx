"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Itens por tipo de imóvel
const ITEMS_BY_TYPE: Record<string, { category: string; items: string[] }[]> = {
  casa: [
    { category: "🍚 Alimentos", items: ["Arroz", "Feijão", "Café", "Açúcar", "Sal", "Óleo", "Leite", "Ovos", "Pão", "Manteiga", "Macarrão", "Molho de tomate", "Farinha", "Carne", "Frango", "Queijo", "Presunto", "Frutas", "Verduras", "Legumes"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Sabão em pó", "Amaciante", "Água sanitária", "Desinfetante", "Esponja", "Saco de lixo", "Papel toalha", "Multiuso"] },
    { category: "🚿 Higiene", items: ["Papel higiênico", "Sabonete", "Shampoo", "Condicionador", "Creme dental", "Escova de dente", "Desodorante", "Absorvente"] },
    { category: "🐾 Pet", items: ["Ração", "Areia do gato", "Tapete higiênico", "Petisco"] },
    { category: "👶 Bebê", items: ["Fralda", "Lenço umedecido", "Pomada", "Fórmula"] },
    { category: "💊 Farmácia", items: ["Curativo", "Álcool", "Algodão", "Termômetro"] },
  ],
  apartamento: [
    { category: "🍚 Alimentos", items: ["Arroz", "Feijão", "Café", "Açúcar", "Sal", "Óleo", "Leite", "Ovos", "Pão", "Manteiga", "Macarrão", "Molho de tomate", "Frango", "Queijo"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Sabão em pó", "Amaciante", "Água sanitária", "Multiuso", "Esponja", "Saco de lixo", "Papel toalha"] },
    { category: "🚿 Higiene", items: ["Papel higiênico", "Sabonete", "Shampoo", "Condicionador", "Creme dental", "Desodorante"] },
  ],
  praia: [
    { category: "🏖️ Praia essencial", items: ["Protetor solar", "Repelente", "Protetor labial", "Óculos de sol", "Toalha de praia", "Chinelo"] },
    { category: "🍺 Bebidas", items: ["Cerveja", "Água mineral", "Refrigerante", "Suco", "Água de coco", "Gelo"] },
    { category: "🍖 Churrasqueira", items: ["Carvão", "Carne", "Frango", "Linguiça", "Costelinha", "Farofa", "Vinagrete", "Pão de alho", "Sal grosso"] },
    { category: "🍽️ Descartáveis", items: ["Copo descartável", "Prato descartável", "Garfo descartável", "Guardanapo", "Palito", "Toalha umedecida"] },
    { category: "🍚 Alimentos", items: ["Arroz", "Feijão", "Óleo", "Sal", "Ovos", "Pão", "Manteiga", "Frutas"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Esponja", "Papel toalha", "Saco de lixo"] },
  ],
  veraneio: [
    { category: "🌲 Sítio / Campo", items: ["Carvão", "Sal grosso", "Farofa", "Carne", "Frango", "Linguiça", "Costelinha", "Milho", "Mandioca", "Pão de alho"] },
    { category: "🍺 Bebidas", items: ["Cerveja", "Refrigerante", "Água mineral", "Gelo", "Suco"] },
    { category: "🍚 Alimentos", items: ["Arroz", "Feijão", "Óleo", "Sal", "Ovos", "Pão", "Manteiga", "Batata", "Cebola", "Alho"] },
    { category: "🍽️ Descartáveis", items: ["Copo descartável", "Prato descartável", "Guardanapo", "Papel toalha"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Água sanitária", "Saco de lixo", "Esponja", "Desinfetante"] },
    { category: "🔦 Utilidades", items: ["Pilha", "Vela", "Isqueiro", "Repelente"] },
  ],
  empresa: [
    { category: "☕ Copa / Cozinha", items: ["Café", "Cápsula de café", "Açúcar", "Adoçante", "Leite em pó", "Chá", "Biscoito", "Bala / Bombom", "Água mineral", "Achocolatado", "Suco de caixinha"] },
    { category: "🍽️ Descartáveis", items: ["Copo descartável (200ml)", "Copinho para café (50ml)", "Prato descartável", "Garfo descartável", "Faca descartável", "Colher descartável", "Mexedor descartável", "Guardanapo", "Papel toalha", "Canudinho"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Esponja", "Sabão em pó", "Saco de lixo", "Desinfetante", "Multiuso", "Papel toalha", "Água sanitária", "Luva de borracha", "Rodo", "Vassoura"] },
    { category: "🚿 Banheiro", items: ["Papel higiênico", "Sabonete líquido", "Papel toalha", "Álcool gel", "Desodorizador de banheiro", "Absorvente"] },
    { category: "📎 Escritório", items: ["Caneta", "Folha A4", "Post-it", "Grampo", "Clipe", "Fita adesiva", "Pilha AA", "Pilha AAA", "Toner impressora", "Envelope", "Etiqueta adesiva", "Pincel atômico"] },
  ],
  outro: [
    { category: "🍚 Alimentos", items: ["Arroz", "Feijão", "Café", "Açúcar", "Sal", "Óleo", "Leite", "Ovos", "Pão", "Manteiga"] },
    { category: "🧹 Limpeza", items: ["Detergente", "Sabão em pó", "Água sanitária", "Esponja", "Saco de lixo"] },
    { category: "🚿 Higiene", items: ["Papel higiênico", "Sabonete", "Shampoo", "Creme dental"] },
  ],
};

// Mapeia categoria para o nome sem emoji para salvar no banco
function categoryNameClean(cat: string) {
  return cat.replace(/^[\p{Emoji}\s]+/u, "").trim();
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [houseId, setHouseId] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("casa");
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: member } = await supabase
        .from("house_members")
        .select("house_id, houses(property_type)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (member) {
        setHouseId(member.house_id);
        const pType = (member as any).houses?.property_type ?? "casa";
        setPropertyType(pType);
        setActiveCategory((ITEMS_BY_TYPE[pType] ?? ITEMS_BY_TYPE.casa)[0].category);
      }

      const { data: cats } = await supabase.from("categories").select("id, name");
      if (cats) {
        const map: Record<string, string> = {};
        cats.forEach((c) => { map[c.name] = c.id; });
        setCategories(map);
      }
    }
    init();
  }, []);

  function toggleItem(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleAll(items: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = items.every(i => next.has(i));
      if (allSelected) items.forEach(i => next.delete(i));
      else items.forEach(i => next.add(i));
      return next;
    });
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      if (!houseId) { router.push("/home"); return; }

      if (selected.size > 0) {
        const groups = ITEMS_BY_TYPE[propertyType] ?? ITEMS_BY_TYPE.casa;
        const itemMap: Record<string, string> = {};
        groups.forEach(g => g.items.forEach(i => { itemMap[i] = categoryNameClean(g.category); }));

        const items = Array.from(selected).map((name) => {
          const catName = itemMap[name] ?? "Outros";
          const catId = categories[catName] ?? Object.values(categories)[0];
          return { house_id: houseId, category_id: catId, name, status: "tem", created_by: user.id, updated_by: user.id, source: "app" };
        });

        await supabase.from("items").insert(items);
      }

      router.push("/home");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const groups = ITEMS_BY_TYPE[propertyType] ?? ITEMS_BY_TYPE.casa;
  const activeGroup = groups.find(g => g.category === activeCategory) ?? groups[0];

  const PROPERTY_LABELS: Record<string, string> = {
    casa: "🏠 Casa", apartamento: "🏢 Apartamento", praia: "🏖️ Praia",
    veraneio: "🌲 Veraneio", empresa: "💼 Empresa", outro: "📍 Outro"
  };

  const ONBOARDING_TITLE: Record<string, string> = {
    casa:        "O que costuma ter em casa?",
    apartamento: "O que costuma ter no apê?",
    praia:       "O que costuma ter na praia?",
    veraneio:    "O que costuma ter no veraneio?",
    empresa:     "O que costuma ter na empresa?",
    outro:       "O que costuma ter no local?",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header fixo */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
        <div className="px-4 pt-5 pb-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-black text-gray-900">{ONBOARDING_TITLE[propertyType] ?? ONBOARDING_TITLE.casa}</h1>
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">
              {selected.size} {selected.size === 1 ? "item" : "itens"}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {PROPERTY_LABELS[propertyType]} · Marque os itens. Pode mudar depois.
          </p>
        </div>

        {/* Tabs de categoria — scroll horizontal */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {groups.map((g) => {
            const count = g.items.filter(i => selected.has(i)).length;
            return (
              <button
                key={g.category}
                onClick={() => setActiveCategory(g.category)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all",
                  activeCategory === g.category
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200"
                )}
              >
                {g.category.split(" ")[0]}
                <span className="hidden sm:inline">{g.category.split(" ").slice(1).join(" ")}</span>
                {count > 0 && (
                  <span className={cn("text-xs font-black px-1.5 py-0.5 rounded-full", activeCategory === g.category ? "bg-white/20 text-white" : "bg-green-100 text-green-700")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de itens da categoria ativa */}
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full pb-32">
        {/* Selecionar todos */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">{activeGroup.category}</p>
          <button
            onClick={() => toggleAll(activeGroup.items)}
            className="text-xs text-green-600 font-semibold hover:text-green-700"
          >
            {activeGroup.items.every(i => selected.has(i)) ? "Desmarcar todos" : "Selecionar todos"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {activeGroup.items.map((item) => {
            const active = selected.has(item);
            return (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm font-medium border transition-all text-left active:scale-95",
                  active
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-green-300"
                )}
              >
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all", active ? "bg-white border-white" : "border-gray-300")}>
                  {active && <Check size={11} className="text-green-600" strokeWidth={3} />}
                </div>
                <span className="leading-tight">{item}</span>
              </button>
            );
          })}
        </div>

        {/* Navegar entre categorias */}
        <div className="flex gap-3 mt-6">
          {groups.indexOf(activeGroup) < groups.length - 1 && (
            <button
              onClick={() => setActiveCategory(groups[groups.indexOf(activeGroup) + 1].category)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:border-green-300 transition-colors"
            >
              Próxima categoria <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Botão fixo no fundo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleFinish}
            disabled={loading}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base shadow-md shadow-green-200 active:scale-[0.98]"
          >
            {loading ? "Salvando..." : selected.size > 0 ? `✅ Entrar com ${selected.size} ${selected.size === 1 ? "item" : "itens"}` : "Começar sem itens →"}
          </button>
        </div>
      </div>
    </div>
  );
}
