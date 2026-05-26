import Link from "next/link";
import { Check } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";
import { ScenarioShowcase } from "@/components/landing/ScenarioShowcase";
import { NotificationShowcase } from "@/components/landing/NotificationShowcase";
import { InstallButton, InstallPWA } from "@/components/shared/InstallPWA";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

function BrandName({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black text-gray-900 ${className}`}>
      Acabou?
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <InstallPWA />

      {/* ══════════════════════════════════════════
          NAV — sticky, clean, com urgência sutil
          ══════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={42} />
            <BrandName className="text-2xl" />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Entrar
            </Link>
            <div className="flex flex-col items-end gap-1 sm:block">
              <Link href="/cadastro" className="bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                Testar grátis
              </Link>
              <Link href="/login" className="sm:hidden text-xs text-gray-500 font-medium border border-gray-200 px-3 py-1 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          BLOCO 1 — HERO / HEADLINE
          Schwartz: tráfego frio → abrir com DOR reconhecível
          Heath: Simple + Unexpected + Concrete
          Sullivan: headline é 80% do resultado
          Whitman: Life Force 7 (cuidar dos entes queridos)
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 md:py-24 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-8">
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full">
              🇧🇷 Feito para famílias brasileiras
            </span>
            <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full animate-pulse">
              🎁 7 dias grátis — acesso total
            </span>
          </div>

          {/* Headline principal — ângulo de dor + solução */}
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            <span className="text-gray-900">Voltou do mercado</span><br />
            <span className="text-gray-900">e esqueceu</span>{" "}
            <span className="text-red-500">o café?</span><br />
            <span className="text-green-600">Nunca mais.</span>
          </h1>

          {/* Subheadline — contexto + promessa concreta */}
          <p className="text-lg md:text-xl text-gray-500 mb-4 max-w-lg mx-auto leading-relaxed">
            Um app onde qualquer pessoa da casa marca o que acabou — e quem vai ao mercado já sabe <strong className="text-gray-700">exatamente</strong> o que comprar. Sem ligar, sem perguntar, sem esquecer.
          </p>

          <p className="text-sm text-green-700 font-semibold mb-8 bg-green-50 inline-block px-4 py-2 rounded-full">
            ⚡ Pronto em 30 segundos · Funciona até sem internet
          </p>

          {/* CTA PRIMÁRIO — acima da dobra */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href="/cadastro" className="bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-lg shadow-lg shadow-green-200">
              Quero parar de esquecer itens →
            </Link>
            <Link href="#como-funciona" className="bg-white text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-colors text-lg">
              Como funciona?
            </Link>
          </div>
          {/* Micro-copy de desarme — Whitman: reversão de risco */}
          <p className="text-sm text-gray-400">✅ Sem cartão · ✅ Sem compromisso · ✅ Cancela quando quiser</p>
        </div>

        {/* Preview do app — prova visual */}
        <div className="max-w-sm mx-auto mt-14">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left">
            <div className="bg-green-600 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">🏠 Casa da Silva</p>
                <p className="text-white font-bold text-lg">Lista de compras</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <p className="text-white text-xs font-bold">4 itens</p>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { name: "Café", quem: "Ana marcou", status: "Acabou", color: "bg-red-100 text-red-700" },
                { name: "Arroz 5kg", quem: "João marcou", status: "Acabando", color: "bg-amber-100 text-amber-700" },
                { name: "Detergente", quem: "Ana marcou", status: "Acabou", color: "bg-red-100 text-red-700" },
                { name: "Sabonete", quem: "Maria marcou", status: "Comprar", color: "bg-blue-100 text-blue-700" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.quem}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4">
              <div className="bg-[#25D366] text-white text-center text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <WhatsAppIcon size={16} />
                Enviar lista pelo WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 2 — NÚMEROS DE IMPACTO
          Heath: Concrete + Credible
          Whitman: especificidade numérica
          ══════════════════════════════════════════ */}
      <section className="px-6 py-10 bg-green-600">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center text-white">
          <div>
            <p className="text-2xl md:text-4xl font-black">30 seg</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">pra configurar tudo</p>
          </div>
          <div>
            <p className="text-xl md:text-3xl font-black leading-tight">R$ 4,99<span className="text-base font-bold">/mês</span></p>
            <p className="text-green-200 text-xs md:text-sm mt-1">no plano anual</p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-black">1 toque</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">pra marcar o que acabou</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 3 — IDENTIFICAÇÃO DA DOR
          Schwartz: nível 1-2 (frio) → agitar a dor
          Whitman: Life Force 5 (conforto) + 7 (família)
          Heath: Emotional + Stories
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
              Se você se identificou com<br />
              <span className="text-red-500">alguma dessas situações...</span>
            </h2>
          </div>

          {/* Mini-história — Heath: Stories */}
          <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-8 border border-gray-100">
            <p className="text-gray-700 leading-relaxed text-base md:text-lg">
              <span className="text-2xl">🛒</span> Sábado, 18h. Você chega do mercado com 6 sacolas pesadas. Guarda tudo, abre o armário pra fazer um café e... <strong className="text-red-600">cadê o café?</strong> Esqueceu. De novo. Sua esposa olha com aquela cara. Seu marido suspira. E você pensa: <em className="text-gray-500">"eu SABIA que tinha que comprar, como eu esqueci?"</em>
            </p>
          </div>

          {/* Bullets de dor — Whitman: specificity */}
          <div className="space-y-4">
            {[
              { emoji: "😤", text: "Você já voltou do mercado e descobriu que esqueceu justamente o item mais importante" },
              { emoji: "🔄", text: "Já comprou algo que já tinha em casa — e descobriu quando foi guardar" },
              { emoji: "📱", text: 'Já mandou "precisa de algo?" no grupo da família e ninguém respondeu' },
              { emoji: "📝", text: "Já fez lista no papel, no bloco de notas, no WhatsApp... e esqueceu de olhar na hora" },
              { emoji: "😩", text: 'Já ouviu "acabou o sabonete" NO MEIO do banho — e ninguém avisou antes' },
              { emoji: "🤷", text: 'Já ficou na frente da prateleira pensando "será que tem em casa?"' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-4 p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                <span className="text-2xl shrink-0">{emoji}</span>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-lg font-bold text-gray-900 mb-2">
              Se marcou 2 ou mais... você <strong className="text-green-600">precisa</strong> do Acabou?
            </p>
            <p className="text-gray-500 text-sm">
              (e se marcou todas, sua família vai te agradecer por descobrir esse app)
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 4 — APRESENTAÇÃO DA SOLUÇÃO
          Schwartz: mecanismo único revelado
          Hormozi: sonho × probabilidade / tempo × esforço
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-green-50">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-green-600 text-white text-xs font-black px-4 py-2 rounded-full mb-6 uppercase tracking-wide">
            A solução
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-6">
            Um app onde quem vê que acabou,<br />
            <span className="text-green-600">marca. E quem compra, já sabe.</span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            O Acabou? é o jeito mais simples de manter sua casa abastecida. Qualquer pessoa da família abre o app, marca o que acabou em 1 toque, e pronto — a lista de compras se monta sozinha, em tempo real, pra todo mundo ver.
          </p>

          {/* Equação de Hormozi visual */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-5 border border-green-200 text-center">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Resultado</p>
              <p className="text-sm font-bold text-gray-900">Casa sempre abastecida, sem briga, sem esquecimento</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-200 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Probabilidade</p>
              <p className="text-sm font-bold text-gray-900">Funciona com 1 toque — até seu avô consegue usar</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-200 text-center">
              <p className="text-3xl mb-2">⚡</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Tempo</p>
              <p className="text-sm font-bold text-gray-900">30 segundos pra configurar, resultado imediato</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-green-200 text-center">
              <p className="text-3xl mb-2">😎</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Esforço</p>
              <p className="text-sm font-bold text-gray-900">Zero. A lista se monta sozinha conforme alguém marca</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 5 — COMO FUNCIONA (4 passos)
          Heath: Simple + Concrete
          Hormozi: tempo e esforço mínimos
          ══════════════════════════════════════════ */}
      <section id="como-funciona" className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">Tão simples que sua avó vai usar</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">4 passos. 30 segundos. Sua casa nunca mais esquece nada.</p>
          <div className="space-y-8">
            {[
              { n: "1", emoji: "✅", title: "Crie sua conta em 30 segundos", desc: "Só nome e e-mail. Sem cartão, sem burocracia. Google? Também dá. E já ganha 7 dias grátis do Plano Família." },
              { n: "2", emoji: "🏠", title: "Monte sua despensa rapidinho", desc: "Escolha os itens que você costuma ter. Mais de 50 sugestões prontas por categoria — é só tocar e selecionar." },
              { n: "3", emoji: "📲", title: "Acabou? Marca em 1 toque", desc: 'Abriu o último pacote de café? Toque em "Acabou" e pronto. O item vai direto pra lista de compras. Qualquer pessoa da casa pode fazer.' },
              { n: "4", emoji: "🛒", title: "Vai ao mercado sem esquecer nada", desc: "A lista já está pronta, organizada e compartilhável pelo WhatsApp. Comprou? Marca. O item volta pro status de 'tem em casa'." },
            ].map(({ n, emoji, title, desc }) => (
              <div key={n} className="flex items-start gap-5">
                <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-green-200">
                  {n}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-gray-900 text-lg">{emoji} {title}</h3>
                  <p className="text-gray-500 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA intermediário — Cialdini: compromisso (micro-sim) */}
          <div className="text-center mt-12">
            <Link href="/cadastro" className="inline-block bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-base shadow-lg shadow-green-200">
              Criar minha conta grátis →
            </Link>
            <p className="text-xs text-gray-400 mt-3">Leva menos tempo que pedir um café no balcão</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 6 — BENEFÍCIOS (NÃO features)
          Sullivan: benefícios > features, SEMPRE
          Whitman: Life Force 5, 6, 7
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 text-center mb-3">
            O que muda na sua vida<br className="hidden md:block" /> com o Acabou?
          </h2>
          <p className="text-gray-500 text-center mb-12 text-base md:text-lg">
            Não é sobre o app. É sobre o que ele faz pela sua família.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                iconBg: "bg-green-100",
                icon: "⚡",
                title: "Nunca mais esquece nada",
                desc: "A lista se monta sozinha. Se alguém da casa viu que acabou, já está na lista. Sem esforço, sem esquecimento, sem briga.",
              },
              {
                iconBg: "bg-blue-100",
                icon: "👥",
                title: "Toda a família participa",
                desc: "Do marido que nunca sabe o que comprar à filha que gastou o último shampoo. Todo mundo atualiza, todo mundo vê.",
              },
              {
                iconBg: "bg-purple-100",
                icon: "📶",
                title: "Funciona até na roça",
                desc: "Sem sinal? Sem problema. Marca offline e sincroniza quando voltar a internet. Perfeito pra sítio, praia e fazenda.",
              },
              {
                iconBg: "bg-emerald-100",
                icon: "💬",
                title: "Manda pro WhatsApp em 1 toque",
                desc: "Alguém vai ao mercado? Envia a lista com marcas e detalhes. Acabou o 'compra pra mim, mas não sei o quê'.",
              },
              {
                iconBg: "bg-amber-100",
                icon: "🔔",
                title: "Avisa antes de você perceber",
                desc: "Às 18h, antes de sair do trabalho: 'Você tem 4 itens pra comprar'. Passa no mercado no caminho de casa.",
              },
              {
                iconBg: "bg-rose-100",
                icon: "🏠",
                title: "Várias casas, um app só",
                desc: "Casa, apê, praia, empresa. Cada lugar com sua lista e sua equipe. Tudo organizado num lugar só.",
              },
            ].map(({ iconBg, icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <span className="text-2xl">{icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 text-base">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 7 — CENÁRIOS INTERATIVOS (componente)
          Cialdini: afinidade (o visitante se enxerga)
          Heath: Concrete + Emotional
          ══════════════════════════════════════════ */}
      <ScenarioShowcase />

      {/* ══════════════════════════════════════════
          BLOCO 8 — PROVA SOCIAL
          Cialdini: prova social + autoridade
          Whitman: credibilidade via números
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Quem usa, não volta pro papel
          </h2>
          <p className="text-gray-500 text-lg mb-12">Veja o que estão dizendo sobre o Acabou?</p>

          {/* Depoimentos */}
          <div className="grid gap-6 md:grid-cols-3 text-left mb-12">
            {[
              {
                name: "Ana Paula",
                role: "Mãe de 3 filhos",
                avatar: "👩",
                text: "Meu marido NUNCA sabia o que comprar. Agora ele abre o app e vai direto. Acabou a ligação do mercado!",
                stars: 5,
              },
              {
                name: "Carlos",
                role: "Mora sozinho",
                avatar: "👨",
                text: "Eu achava que não precisava. Depois que esqueci detergente pela terceira vez na mesma semana, baixei. Nunca mais esqueci.",
                stars: 5,
              },
              {
                name: "Fernanda",
                role: "Dona de restaurante",
                avatar: "👩‍🍳",
                text: "Uso no restaurante! Funcionários marcam o que acabou na copa e no estoque. Economizei tempo e dinheiro.",
                stars: 5,
              },
            ].map((dep) => (
              <div key={dep.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: dep.stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{dep.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{dep.avatar}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{dep.name}</p>
                    <p className="text-xs text-gray-500">{dep.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Números de destaque — Cialdini: prova social */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { number: "4.9/5", label: "avaliação média" },
              { number: "50+", label: "itens sugeridos prontos" },
              { number: "6", label: "tipos de imóvel" },
            ].map(({ number, label }) => (
              <div key={label}>
                <p className="text-2xl md:text-3xl font-black text-green-600">{number}</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 9 — POR QUE ASSINAR (NotificationShowcase)
          Hormozi: stack de valor do plano pago
          Cialdini: escassez (trial 7 dias)
          ══════════════════════════════════════════ */}
      <NotificationShowcase />

      {/* ══════════════════════════════════════════
          BLOCO 10 — QUEBRA DE OBJEÇÕES
          Cialdini: compromisso (micro-sins ao responder)
          Schwartz: desarmar dúvidas do tráfego frio
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">
            Ainda com dúvida?
          </h2>
          <p className="text-gray-500 text-center mb-10 text-lg">
            Normal. Veja se alguma dessas te ajuda.
          </p>
          <div className="space-y-5">
            {[
              {
                objection: '"Eu já uso lista no WhatsApp"',
                answer: "A lista no WhatsApp funciona — até alguém apagar sem querer, até a mensagem se perder entre 47 figurinhas, até ninguém atualizar. No Acabou?, a lista é viva: qualquer pessoa marca, e todos veem em tempo real. Sem se perder no chat.",
              },
              {
                objection: '"Minha família não vai usar"',
                answer: "Se alguém da sua casa consegue usar WhatsApp, consegue usar o Acabou?. É literalmente 1 toque. E o melhor: quando a pessoa vê que funciona (e para de ouvir reclamação), ela mesma começa a marcar. Teste com 1 convite — você vai se surpreender.",
              },
              {
                objection: '"R$ 9 por mês pra lista de compras?"',
                answer: "Pensa assim: quantas vezes por mês você compra algo que já tinha em casa? Ou volta ao mercado porque esqueceu um item? Uma ida extra ao mercado custa mais que R$ 9 em gasolina e tempo. O Acabou? se paga na primeira semana. E o anual sai por R$ 4,99/mês — menos que um café.",
              },
              {
                objection: '"Já baixei apps assim e abandonei"',
                answer: "A maioria dos apps de lista exige que VOCÊ digite tudo. Dá preguiça e abandona. No Acabou?, você monta a despensa uma vez (com sugestões prontas), e depois é só 1 toque. Acabou o café? Toca. Pronto. Sem digitar nada. Por isso as pessoas continuam usando.",
              },
              {
                objection: '"E se eu não gostar?"',
                answer: "Sem risco nenhum. Você testa 7 dias grátis com acesso total ao Plano Família. Se não curtir, volta pro plano grátis automaticamente. Sem cobrança, sem complicação, sem precisar cancelar nada.",
              },
            ].map(({ objection, answer }) => (
              <details key={objection} className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100 transition-colors">
                  <p className="font-bold text-gray-900 text-sm md:text-base pr-4">{objection}</p>
                  <span className="text-green-600 text-xl shrink-0 group-open:rotate-45 transition-transform font-bold">+</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 11 — PLANOS + OFERTA + GARANTIA
          Hormozi: stack de valor + ancoragem
          Cialdini: escassez (trial) + reciprocidade (grátis)
          Whitman: reversão de risco forte
          ══════════════════════════════════════════ */}
      <section id="planos" className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">
            Quanto custa parar de esquecer?
          </h2>
          <p className="text-gray-500 text-center mb-4 text-lg">Menos do que uma ida extra ao mercado.</p>

          {/* Badge de trial — Cialdini: reciprocidade + escassez */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-5 py-2.5 rounded-full">
              🎁 Teste grátis de 7 dias — acesso completo, sem cartão
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Grátis", price: "R$ 0", period: "para sempre", highlight: false, badge: null,
                features: [
                  "1 local",
                  "Apenas você (1 pessoa)",
                  "Até 20 itens",
                  "Lista de compras automática",
                  "Compartilhar pelo WhatsApp",
                ],
                notIncluded: [
                  "Lembrete diário no celular",
                  "Pessoas ilimitadas",
                  "Locais ilimitados",
                ],
                cta: "Começar grátis", href: "/cadastro", color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
              },
              {
                name: "Família Mensal", price: "R$ 8,90", period: "/mês", highlight: false, badge: "🎁 7 DIAS GRÁTIS",
                features: [
                  "Tudo do Grátis +",
                  "Pessoas ilimitadas",
                  "Itens ilimitados",
                  "Locais ilimitados",
                  "Lembrete diário no celular",
                  "Lembretes recorrentes",
                  "Histórico completo",
                ],
                notIncluded: [],
                cta: "Testar 7 dias grátis", href: "/cadastro", color: "bg-gray-900 text-white hover:bg-gray-800",
              },
              {
                name: "Família Anual", price: "R$ 59,90", period: "/ano", highlight: true,
                badge: "🔥 MELHOR CUSTO — R$ 4,99/mês",
                features: [
                  "Tudo do Mensal +",
                  "Economize R$ 46,90 por ano",
                  "Prioridade em novidades",
                  "Suporte prioritário",
                ],
                notIncluded: [],
                cta: "Garantir por R$ 4,99/mês", href: "/cadastro", color: "bg-green-600 text-white hover:bg-green-700",
              },
            ].map((plan) => (
              <div key={plan.name} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-transform hover:scale-[1.01] ${plan.highlight ? "border-green-400 ring-2 ring-green-100" : "border-gray-100"}`}>
                {plan.badge && <div className="bg-green-600 text-white text-center py-2.5 text-xs font-bold px-3">{plan.badge}</div>}
                <div className="p-6">
                  <h3 className="font-bold text-gray-700 text-sm mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <Check size={16} className="text-green-600 shrink-0" />
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded?.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <span className="w-4 text-center shrink-0">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${plan.color}`}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Garantia — Whitman: reversão de risco forte */}
          <div className="mt-10 bg-green-50 border-2 border-green-200 rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto">
            <span className="text-4xl mb-3 block">🛡️</span>
            <h3 className="font-black text-gray-900 text-xl mb-3">Garantia zero risco</h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Teste o Plano Família por <strong>7 dias completos</strong> sem pagar nada e sem cadastrar cartão. Se não gostar, você automaticamente volta pro plano grátis — sem cobrança, sem burocracia, sem precisar cancelar. <strong className="text-green-700">O risco é todo nosso.</strong>
            </p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Sem cartão de crédito para começar. Cancele quando quiser. Dados protegidos pela LGPD.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 12 — FAQ
          Schwartz: empurrar a decisão
          Cialdini: compromisso (cada resposta é um micro-sim)
          ══════════════════════════════════════════ */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-10">
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Preciso instalar alguma coisa?",
                a: "Não obrigatoriamente. O Acabou? funciona direto no navegador do celular, como um site. Mas se quiser, pode instalar como app (PWA) — fica no celular igualzinho um app da loja, mas sem ocupar espaço. Funciona em Android, iPhone e computador.",
              },
              {
                q: "Como convido minha família?",
                a: "Dentro do app, toque em 'Convidar' e envie o link pelo WhatsApp. A pessoa clica, cria a conta em 30 segundos e já entra direto na sua casa. Simples assim.",
              },
              {
                q: "Funciona sem internet?",
                a: "Sim! Você pode marcar itens offline. Quando a internet voltar, tudo sincroniza automaticamente. Perfeito pra quem tem casa na praia, sítio ou viaja bastante.",
              },
              {
                q: "É seguro? Meus dados ficam protegidos?",
                a: "Sim. Seus dados são criptografados e armazenados em servidores seguros. Seguimos a LGPD (Lei Geral de Proteção de Dados). Você pode excluir sua conta e todos os seus dados a qualquer momento.",
              },
              {
                q: "Quanto tempo preciso dedicar por dia?",
                a: "Literalmente 5 segundos. Viu que o café acabou? Abre o app, toca em 'Acabou'. Pronto. Não precisa digitar nada, não precisa abrir lista, não precisa mandar mensagem pra ninguém.",
              },
              {
                q: "E se eu quiser cancelar o Plano Família?",
                a: "Cancele a qualquer momento nas configurações. Sem multa, sem burocracia. Você volta pro plano grátis e continua usando normalmente — só com os limites do grátis (20 itens, 1 pessoa, 1 local).",
              },
              {
                q: "Quais formas de pagamento aceitam?",
                a: "Pix, cartão de crédito e boleto — via Mercado Pago. Tudo seguro e rápido. No cartão, você pode parcelar o plano anual.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-100 transition-colors">
                  <p className="font-bold text-gray-900 text-sm md:text-base pr-4">{q}</p>
                  <span className="text-green-600 text-xl shrink-0 group-open:rotate-45 transition-transform font-bold">+</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BLOCO 13 — CTA FINAL + PS
          Sullivan: último empurrão emocional
          Cialdini: escassez (trial) + afinidade
          Whitman: Life Force 7 (cuidar da família)
          ══════════════════════════════════════════ */}
      <section className="px-6 py-20 text-white text-center" style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}>
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-6">
            <LogoIcon size={72} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
            Sua família merece uma casa<br />onde nada falta.
          </h2>
          <p className="text-green-100 mb-4 text-lg leading-relaxed">
            Chega de esquecer. Chega de comprar repetido. Chega de perguntar "tem arroz?". Em 30 segundos você organiza sua casa pra sempre.
          </p>
          <p className="text-green-200 mb-8 text-sm font-semibold">
            🎁 Ganhe 7 dias grátis do Plano Família — sem cartão, sem risco
          </p>
          <Link href="/cadastro" className="inline-block bg-white text-green-700 font-black px-12 py-4 rounded-2xl hover:bg-green-50 transition-all hover:scale-105 text-lg shadow-2xl">
            Quero organizar minha casa →
          </Link>
          <div className="flex justify-center mt-5">
            <InstallButton />
          </div>

          {/* PS — uma das partes mais lidas da página */}
          <div className="mt-12 pt-8 border-t border-green-500/30 text-left max-w-md mx-auto">
            <p className="text-green-200 text-sm leading-relaxed">
              <strong className="text-white">PS:</strong> Se você chegou até aqui, provavelmente já se identificou com pelo menos uma daquelas situações lá em cima. O Acabou? resolve isso de verdade — e você pode testar sem pagar nada por 7 dias. O único risco é continuar esquecendo itens no mercado. 😉
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-8 text-green-200 text-sm flex-wrap">
            <span>✅ 7 dias grátis</span>
            <span>✅ Sem cartão</span>
            <span>✅ 30 segundos</span>
            <span>✅ Funciona offline</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-10 text-center text-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <LogoIcon size={36} />
            <span className="text-xl font-black text-white">Acabou?</span>
          </div>
          <div className="flex justify-center gap-6 mb-4 flex-wrap">
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p>© {new Date().getFullYear()} Acabou?. Feito com ❤️ para famílias brasileiras.</p>
        </div>
      </footer>
    </div>
  );
}
