import { RevealOnScroll } from "./RevealOnScroll";

const pains = [
  { icon: "📱", text: "A lista ficou perdida no WhatsApp, entre figurinhas e áudios." },
  { icon: "🤷", text: "Alguém achou que o outro já tinha comprado — e ninguém comprou." },
  { icon: "🔄", text: "Comprou repetido e só descobriu na hora de guardar." },
  { icon: "🧼", text: "Acabou bem na hora que precisava — e ninguém tinha avisado." },
  { icon: "🛒", text: "No mercado: \"será que tem em casa?\" Comprou na dúvida." },
];

export function PainSection() {
  return (
    <section className="px-6 pt-8 md:pt-12 pb-8 md:pb-12 bg-white">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <span className="inline-flex items-center bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full mb-4">Esse roteiro é familiar?</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
              Você só lembra que esqueceu…<br />quando já voltou do mercado.
            </h2>
            <p className="text-gray-500 text-base md:text-lg italic max-w-xl mx-auto">
              &ldquo;Sábado, sacolas no chão, armário aberto… e o café ficou no mercado. De novo.&rdquo;
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map((pain, i) => (
            <RevealOnScroll key={i} delay={i * 80}>
              <div className="bg-red-50 rounded-2xl p-5 border border-red-200/60 hover:border-red-300 hover:shadow-md transition-all h-full">
                <span className="text-3xl block mb-3">{pain.icon}</span>
                <p className="text-gray-800 text-sm leading-relaxed font-medium">{pain.text}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <p className="text-center text-sm text-gray-500 mt-8">
            Se isso já aconteceu com você →{" "}
            <a href="/cadastro" className="text-green-600 font-bold hover:underline">teste grátis por 14 dias</a>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
