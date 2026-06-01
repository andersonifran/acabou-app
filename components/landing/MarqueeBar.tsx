const items = [
  { emoji: "☕", name: "Café" },
  { emoji: "🍚", name: "Arroz" },
  { emoji: "🧴", name: "Detergente" },
  { emoji: "🥛", name: "Leite" },
  { emoji: "🧼", name: "Sabonete" },
  { emoji: "🍞", name: "Pão de forma" },
  { emoji: "🥚", name: "Ovos" },
  { emoji: "🧈", name: "Margarina" },
  { emoji: "🧻", name: "Papel higiênico" },
  { emoji: "🐕", name: "Ração" },
  { emoji: "🍎", name: "Maçã" },
  { emoji: "🧹", name: "Vassoura" },
];

export function MarqueeBar() {
  // Duplica para loop infinito
  const doubled = [...items, ...items];

  return (
    <div className="bg-green-50 border-y border-green-100 overflow-hidden py-3">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium mx-4 shrink-0">
            <span>{item.emoji}</span>
            <span>{item.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
