"use client";

import { RevealOnScroll } from "./RevealOnScroll";

const objections = [
  { q: "\"Eu já uso lista no WhatsApp.\"", a: "A lista no WhatsApp funciona — até se perder entre figurinhas. No Acabou?, qualquer pessoa marca e todos veem em tempo real. Sem se perder no chat." },
  { q: "\"Minha família não vai usar.\"", a: "Se usa WhatsApp, usa o Acabou?. É 1 toque. Quando a pessoa vê que funciona e para de ouvir \"você esqueceu\", ela mesma começa a marcar." },
  { q: "\"R$ 8,90 por mês pra lista?\"", a: "Uma ida extra ao mercado custa mais que isso em gasolina e tempo. O anual sai R$ 4,99/mês — menos que um café. Se paga na primeira semana." },
  { q: "\"Já abandonei apps assim.\"", a: "Outros apps exigem digitar tudo. No Acabou?, monta a despensa uma vez (com sugestões prontas) e depois é só 1 toque. Sem digitar nada." },
  { q: "\"E se eu não gostar?\"", a: "7 dias grátis com acesso total. Não curtiu? Volta pro grátis automaticamente. Sem cobrança, sem cancelar, sem complicação." },
  { q: "\"Preciso instalar?\"", a: "Não. Funciona no navegador. Mas se quiser, instale como app — fica igual um app da loja. Android, iPhone e computador." },
];

const faqs = [
  { q: "Funciona no iPhone?", a: "Sim! Funciona em qualquer celular pelo navegador. No iPhone, instale pelo Safari para ter o ícone na tela inicial." },
  { q: "Funciona sem internet?", a: "Sim! Marca offline e sincroniza quando a internet voltar. Sítio, praia, fazenda — tudo coberto." },
  { q: "Como convido minha família?", a: "Toque em \"Convidar\", envie o link pelo WhatsApp. A pessoa cria conta em 30 segundos e entra direto." },
  { q: "Preciso de cartão para começar?", a: "Não. Trial de 7 dias é sem cartão. Se não assinar, volta pro grátis. Sem cobrança surpresa." },
  { q: "Como cancelo?", a: "Nas configurações, a qualquer momento. Sem multa, sem burocracia. Volta pro grátis automaticamente." },
  { q: "Quais formas de pagamento?", a: "Pix, cartão e boleto via Mercado Pago. Seguro e rápido. Anual pode parcelar no cartão." },
  { q: "Meus dados estão seguros?", a: "Dados criptografados, servidores seguros, 100% LGPD. Exclua conta e dados a qualquer momento." },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors">
        <p className="font-bold text-gray-900 text-sm pr-4">{q}</p>
        <span className="text-green-600 text-xl shrink-0 group-open:rotate-45 transition-transform font-bold">+</span>
      </summary>
      <div className="px-4 pb-4">
        <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
      </div>
    </details>
  );
}

export function FaqSection() {
  return (
    <section id="faq" className="px-6 py-16 bg-[#fafafa]">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Dúvidas</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Ainda com dúvida? Normal.</h2>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Objeções */}
          <RevealOnScroll>
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-4">Objeções comuns</h3>
              <div className="space-y-3">
                {objections.map((item) => (
                  <AccordionItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          </RevealOnScroll>

          {/* FAQ */}
          <RevealOnScroll delay={100}>
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-4">Perguntas frequentes</h3>
              <div className="space-y-3">
                {faqs.map((item) => (
                  <AccordionItem key={item.q} {...item} />
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
