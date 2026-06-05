import { RevealOnScroll } from "./RevealOnScroll";

export function BeforeAfter() {
  return (
    <section className="px-6 py-16 bg-[#f0fdf4]">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Antes vs Depois</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">A diferença de ter o Acabou?</h2>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
          {/* Sem */}
          <RevealOnScroll>
            <div className="bg-gradient-to-b from-red-50/70 to-white rounded-2xl border border-red-200/70 p-6 h-full shadow-[0_8px_24px_-12px_rgba(220,38,38,0.25)]">
              <h3 className="font-black text-gray-900 mb-5 text-base">😤 Sem o Acabou?</h3>
              <div className="space-y-3">
                {[
                  "Lista perdida no WhatsApp",
                  "\"Alguém precisa de algo?\" — silêncio",
                  "Compra duplicada toda semana",
                  "Volta ao mercado por 1 item",
                  "Briga por esquecimento",
                  "\"Achei que você tinha comprado\"",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="text-red-400 font-bold shrink-0">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>

          {/* VS */}
          <RevealOnScroll>
            <div className="hidden md:flex items-center justify-center">
              <span className="brand-grad text-xl font-black text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-green-600/25 ring-4 ring-white">VS</span>
            </div>
            <div className="md:hidden flex justify-center py-1">
              <span className="brand-grad inline-flex items-center justify-center text-sm font-black text-white w-9 h-9 rounded-full shadow-md shadow-green-600/25 ring-2 ring-white">VS</span>
            </div>
          </RevealOnScroll>

          {/* Com */}
          <RevealOnScroll delay={150}>
            <div className="bg-gradient-to-b from-green-50/80 to-white rounded-2xl border border-green-200 p-6 h-full ring-1 ring-green-100 shadow-[0_12px_30px_-12px_rgba(22,163,74,0.3)]">
              <h3 className="font-black text-gray-900 mb-5 text-base">😌 Com o Acabou?</h3>
              <div className="space-y-3">
                {[
                  "Lista sempre atualizada pra todos",
                  "Acabou? 1 toque — toda família vê",
                  "Sabe o que tem antes de comprar",
                  "Lista pronta no WhatsApp",
                  "Zero briga, zero esquecimento",
                  "Lembrete diário: \"4 itens pra comprar\"",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <span className="text-green-600 font-bold shrink-0">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
