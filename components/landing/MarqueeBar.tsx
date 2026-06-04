const items = [
  { emoji: "☕", name: "Café" },
  { emoji: "🍚", name: "Arroz" },
  { emoji: "🧴", name: "Detergente" },
  { emoji: "🥛", name: "Leite" },
  { emoji: "🧼", name: "Sabonete" },
  { emoji: "🍞", name: "Pão de forma" },
  { emoji: "🥚", name: "Ovos" },
  { emoji: "📄", name: "Folha A4" },
  { emoji: "🧈", name: "Margarina" },
  { emoji: "🧻", name: "Papel higiênico" },
  { emoji: "🐕", name: "Ração" },
  { emoji: "🍎", name: "Maçã" },
  { emoji: "🧹", name: "Vassoura" },
  { emoji: "🥤", name: "Copo descartável" },
  { emoji: "🖊️", name: "Caneta" },
  { emoji: "☕", name: "Cápsula Nespresso" },
];

export function MarqueeBar() {
  const doubled = [...items, ...items];

  return (
    <div className="brand-grad overflow-hidden py-3">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-sm text-white font-medium mx-5 shrink-0">
            <span className="text-base">{item.emoji}</span>
            <span>{item.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
