import { RevealOnScroll } from "./RevealOnScroll";

const benefits = [
  { icon: "⚡", title: "Nunca mais esquece nada", desc: "A lista se monta sozinha. Se alguém viu que acabou, já tá na lista — sem esforço, sem briga.", span: true },
  { icon: "👥", title: "Toda a família participa", desc: "Marido, esposa, filhos — todo mundo marca e vê.", span: false },
  { icon: "📶", title: "Funciona sem internet", desc: "Marca offline. Sincroniza depois. Sítio e praia cobertos.", span: false },
  { icon: "💬", title: "WhatsApp em 1 toque", desc: "Envia a lista formatada direto no chat.", span: false },
  { icon: "🔔", title: "Lembrete às 18h", desc: "\"4 itens pra comprar.\" Passa no mercado no caminho.", span: false },
  { icon: "🏠", title: "Casa, empresa, praia — tudo em 1 app", desc: "Cada local com sua lista e sua equipe. Gerencie tudo de um lugar só.", span: true },
  { icon: "🚀", title: "Simples como WhatsApp", desc: "Se sabe usar WhatsApp, já sabe usar. 1 toque.", span: false },
  { icon: "🔄", title: "Zero compra repetida", desc: "Sabe se tem em casa antes de comprar.", span: false },
];

export function BentoGrid() {
  return (
    <section className="px-6 py-16 bg-[#e8f7ee]">
      <div className="max-w-4xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Benefícios</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">O que muda na sua rotina</h2>
          </div>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <RevealOnScroll key={b.title} delay={i * 60}>
              <div className={`bg-white rounded-2xl p-5 border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all h-full ${b.span ? "sm:col-span-2" : ""} ${i === 0 ? "bg-green-600 border-green-600 text-white sm:col-span-2" : ""}`}>
                <span className="text-2xl block mb-2">{b.icon}</span>
                <h3 className={`font-bold mb-1 text-base ${i === 0 ? "text-white" : "text-gray-900"}`}>{b.title}</h3>
                <p className={`text-sm leading-relaxed ${i === 0 ? "text-green-100" : "text-gray-500"}`}>{b.desc}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
