import { RevealOnScroll } from "./RevealOnScroll";

const benefits = [
  { icon: "⚡", title: "Nunca mais esquece nada", desc: "A lista se monta sozinha. Se alguém viu que acabou, já tá na lista — sem esforço, sem briga.", accent: true, span: true },
  { icon: "👥", title: "Toda a família participa", desc: "Marido, esposa, filhos — todo mundo marca e vê.", accent: false, span: false },
  { icon: "📶", title: "Funciona sem internet", desc: "Marca offline. Sincroniza depois. Sítio e praia cobertos.", accent: false, span: false },
  { icon: "💬", title: "WhatsApp em 1 toque", desc: "Envia a lista formatada direto no chat.", accent: false, span: false },
  { icon: "🔔", title: "Lembrete às 18h", desc: "\"4 itens pra comprar.\" Passa no mercado no caminho.", accent: false, span: false },
  { icon: "🏠", title: "Casa, empresa, praia — tudo em 1 app", desc: "Cada local com sua lista e sua equipe. Gerencie tudo de um lugar só.", accent: false, span: true },
  { icon: "🚀", title: "Simples como WhatsApp", desc: "Se sabe usar WhatsApp, já sabe usar. 1 toque.", accent: false, span: false },
  { icon: "🔄", title: "Zero compra repetida", desc: "Sabe se tem em casa antes de comprar.", accent: false, span: false },
];

export function BentoGrid() {
  return (
    <section className="px-6 py-16 bg-[#dff2e6]">
      <div className="max-w-4xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <span className="inline-flex items-center bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">Benefícios</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">O que muda na sua rotina</h2>
          </div>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <RevealOnScroll key={b.title} delay={i * 60}>
              <div className={`rounded-2xl p-5 border transition-all h-full ${b.span ? "sm:col-span-2" : ""} ${
                b.accent
                  ? "brand-grad border-green-700 shadow-lg shadow-green-300/30"
                  : "bg-white border-gray-200/60 hover:border-green-300 hover:shadow-md"
              }`}>
                <span className="text-2xl block mb-2">{b.icon}</span>
                <h3 className={`font-bold mb-1 text-base ${b.accent ? "text-white" : "text-gray-900"}`}>{b.title}</h3>
                <p className={`text-sm leading-relaxed ${b.accent ? "text-white/90" : "text-gray-600"}`}>{b.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
