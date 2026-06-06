import Link from "next/link";
import { Check } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";
import { VideoHero } from "@/components/landing/VideoHero";
import { AppShowcase } from "@/components/landing/AppShowcase";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { PainSection } from "@/components/landing/PainSection";
import { MarqueeBar } from "@/components/landing/MarqueeBar";
import { TrustBar } from "@/components/landing/TrustBar";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { MobileStickyBar } from "@/components/landing/MobileStickyBar";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";
import { PaymentTrust } from "@/components/shared/PaymentTrust";
import { InstallPWA } from "@/components/shared/InstallPWA";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";

function BrandName({ className = "" }: { className?: string }) {
  return <span className={`font-black text-gray-900 ${className}`}>Acabou?</span>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <InstallPWA />

      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 cursor-pointer" aria-label="Voltar ao topo">
            <LogoIcon size={42} />
            <BrandName className="text-2xl" />
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="#como-funciona" className="hidden md:block text-gray-500 hover:text-gray-900 text-sm font-medium">
              Como funciona
            </Link>
            <Link href="#planos" className="hidden md:block text-gray-500 hover:text-gray-900 text-sm font-medium">
              Planos
            </Link>
            <Link href="#faq" className="hidden md:block text-gray-500 hover:text-gray-900 text-sm font-medium">
              Dúvidas
            </Link>
            <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Entrar
            </Link>
            <div className="flex flex-col items-end gap-2 sm:block">
              <Link href="/cadastro" className="bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                Testar grátis
              </Link>
              <Link href="/login" className="sm:hidden text-sm font-bold text-green-700 bg-green-50 border-2 border-green-200 px-5 py-2 rounded-xl hover:bg-green-100 active:scale-95 transition-colors">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section id="top" className="relative overflow-hidden px-6 pt-14 pb-16 md:pt-20 md:pb-24 scroll-mt-20" style={{ background: "linear-gradient(160deg, #d4f5e0 0%, #f0fdf4 40%, #ffffff 80%)" }}>
        {/* Floating emojis */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            // MOBILE+DESKTOP (4) — 🛒☕ no topo + 🍎🖊️ ao lado do celular, ALTURAS DIFERENTES (vida propria)
            { emoji: "🛒", x: "3%", y: "6%", size: "1.9rem", opacity: 0.26, dur: "10s" },
            { emoji: "☕", x: "90%", y: "12%", size: "1.8rem", opacity: 0.26, dur: "8.5s" },
            { emoji: "🍅", x: "2%", y: "62%", size: "1.8rem", opacity: 0.26, dur: "11s" },
            { emoji: "🍪", x: "93%", y: "80%", size: "1.8rem", opacity: 0.26, dur: "12s" },
            // SÓ DESKTOP (escondidos no mobile) — preenchem a tela larga
            { emoji: "🥦", x: "3%", y: "32%", size: "1.7rem", opacity: 0.24, dur: "9.5s", hideMobile: true },
            { emoji: "🍌", x: "92%", y: "34%", size: "1.7rem", opacity: 0.24, dur: "10.5s", hideMobile: true },
            { emoji: "🥛", x: "6%", y: "88%", size: "1.8rem", opacity: 0.24, dur: "11.5s", hideMobile: true },
            { emoji: "📦", x: "90%", y: "88%", size: "1.8rem", opacity: 0.24, dur: "9s", hideMobile: true },
          ].map((f, i) => (
            <span
              key={i}
              className={`absolute animate-float ${f.hideMobile ? "hidden md:block" : ""}`}
              style={{ left: f.x, top: f.y, fontSize: f.size, opacity: f.opacity, animationDuration: f.dur, animationDelay: `${-i * 1.5}s` }}
            >
              {f.emoji}
            </span>
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Lado esquerdo — copy */}
            <div className="text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                  🇧🇷 Feito pra famílias brasileiras
                </span>
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                  🎁 7 dias grátis
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-5 tracking-tight">
                <span className="text-gray-900">Voltou do mercado e</span><br />
                <span className="text-gray-900">esqueceu o </span>
                <span className="text-red-500">café</span>
                <span className="text-gray-900">?</span><br />
                <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">Nunca mais.</span>
              </h1>

              <p className="text-base md:text-lg text-gray-500 mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Quem vê que acabou, marca. Quem compra, já sabe. A lista da casa se monta sozinha — para todo mundo ver.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-4">
                <Link href="/cadastro" className="bg-green-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-base shadow-lg shadow-green-200 text-center">
                  Quero parar de esquecer →
                </Link>
                <Link href="#como-funciona" className="bg-white text-gray-700 font-semibold px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-colors text-base text-center">
                  Ver como funciona ↓
                </Link>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-gray-400 font-medium">
                <span>✓ Sem cartão</span>
                <span>✓ Sem compromisso</span>
                <span>✓ 30 segundos</span>
              </div>
            </div>

            {/* Lado direito — phone mockup */}
            <div className="flex justify-center">
              <div className="relative w-[280px]">
                <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    {/* Header do app */}
                    <div className="bg-green-600 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-[10px] font-medium">🏠 Casa da Silva</p>
                        <p className="text-white font-bold text-sm">O que mudou hoje?</p>
                      </div>
                      <div className="relative">
                        <span className="text-lg">🔔</span>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">4</span>
                      </div>
                    </div>
                    {/* Contadores */}
                    <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
                      <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-lg font-black text-green-600">3</p>
                        <p className="text-[9px] text-gray-500 font-medium">Para comprar</p>
                      </div>
                      <div className="bg-red-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-lg font-black text-red-500">2</p>
                        <p className="text-[9px] text-gray-500 font-medium">Acabou</p>
                      </div>
                    </div>
                    {/* Ações */}
                    <div className="px-3 pb-2">
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">O que aconteceu?</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { icon: "📦", label: "Acabou!", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
                          { icon: "⏰", label: "Acabando!", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
                          { icon: "🛒", label: "Comprar!", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
                          { icon: "✅", label: "Comprei!", bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
                        ].map((a) => (
                          <div key={a.label} className={`${a.bg} ${a.border} border rounded-xl px-2 py-2 text-center`}>
                            <p className="text-base">{a.icon}</p>
                            <p className={`text-[10px] font-bold ${a.text}`}>{a.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Ver lista */}
                    <div className="px-3 pb-3">
                      <div className="bg-green-600 text-white rounded-xl px-3 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold">Ver lista de compras</p>
                          <p className="text-[9px] text-green-100">3 itens para comprar</p>
                        </div>
                        <span className="text-base">🛒</span>
                      </div>
                    </div>
                    {/* Bottom nav */}
                    <div className="flex items-center justify-around border-t border-gray-100 py-2">
                      {[
                        { icon: "🏠", label: "Início", active: true },
                        { icon: "📋", label: "Despensa", active: false },
                        { icon: "✅", label: "Lista", active: false },
                        { icon: "👥", label: "Casa", active: false },
                      ].map((n) => (
                        <div key={n.label} className="text-center">
                          <p className="text-sm">{n.icon}</p>
                          <p className={`text-[8px] font-semibold ${n.active ? "text-green-600" : "text-gray-400"}`}>{n.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Glow */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-200 rounded-full opacity-30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-300 rounded-full opacity-20 blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <MarqueeBar />

      {/* ═══ TRUST BAR ═══ */}
      <TrustBar />

      {/* ═══ VÍDEO ═══ */}
      <section className="px-6 pt-14 md:pt-16 pb-8 md:pb-10 bg-white">
        <div className="max-w-md mx-auto text-center">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              ▶ Veja em 10 segundos
            </span>
            <VideoHero />
            <p className="text-gray-500 text-sm mt-6 max-w-xs mx-auto leading-relaxed">
              Quem viu que acabou, <strong className="text-gray-700">marca</strong>. Quem compra, <strong className="text-gray-700">já sabe</strong>.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══ PAIN ═══ */}
      <PainSection />

      {/* ═══ COMO FUNCIONA ═══ */}
      <section id="como-funciona" className="px-6 pt-8 md:pt-12 pb-16 bg-white">
        <div className="max-w-2xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-flex items-center bg-green-100 text-green-700 text-sm font-bold px-4 py-2 rounded-full mb-4">O mecanismo</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Se sabe usar WhatsApp,<br />já sabe usar.</h2>
              <p className="text-gray-500 text-lg">4 passos. 30 segundos. Sua casa nunca mais esquece nada.</p>
            </div>
          </RevealOnScroll>

          {/* Status pills */}
          <RevealOnScroll>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">✓ Tem em casa</span>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">⚠ Acabando</span>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full">✕ Acabou</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">＋ Quero comprar</span>
            </div>
            <p className="text-center text-sm text-gray-500 mb-10">
              Tudo como <strong>&ldquo;Acabou&rdquo;</strong>, <strong>&ldquo;Acabando&rdquo;</strong> ou <strong>&ldquo;Quero comprar&rdquo;</strong> vai direto para a lista de compras — automaticamente.
            </p>
          </RevealOnScroll>

          <div className="space-y-8">
            {[
              { n: "1", emoji: "✅", title: "Crie sua conta em 30 segundos", desc: "Só nome e e-mail. Sem cartão, sem burocracia. Google? Também dá. E já ganha 7 dias grátis do Plano Família." },
              { n: "2", emoji: "🏠", title: "Monte sua despensa rapidinho", desc: "Escolha os itens que você costuma ter. Mais de 50 sugestões prontas por categoria — é só tocar e selecionar." },
              { n: "3", emoji: "📲", title: "Acabou? Marca em 1 toque", desc: "Abriu o último pacote de café? Toque em \"Acabou\" e pronto. O item vai direto pra lista de compras. Qualquer pessoa da casa pode fazer." },
              { n: "4", emoji: "🛒", title: "Vai ao mercado sem esquecer nada", desc: "A lista já está pronta, organizada e compartilhável pelo WhatsApp. Comprou? Marca. O item volta pro status de \"tem em casa\"." },
            ].map(({ n, emoji, title, desc }, i) => (
              <RevealOnScroll key={n} delay={i * 100}>
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-green-200">
                    {n}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-bold text-gray-900 text-lg">{emoji} {title}</h3>
                    <p className="text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="text-center mt-12">
              <Link href="/cadastro" className="inline-block bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-base shadow-lg shadow-green-200">
                Criar minha conta grátis →
              </Link>
              <p className="text-xs text-gray-400 mt-3">Leva menos tempo que pedir um café no balcão</p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <BeforeAfter />

      {/* ═══ BENEFÍCIOS (Bento Grid) ═══ */}
      <BentoGrid />

      {/* ═══ CONHEÇA O APP (Showcase interativo) ═══ */}
      <AppShowcase />

      {/* ═══ PROVA SOCIAL ═══ */}
      <section className="px-6 py-16 bg-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Quem usa, aprova</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Quem usa, não volta<br className="md:hidden" /> pro papel
            </h2>
            <p className="text-gray-500 text-lg mb-10">Veja o que estão dizendo sobre o Acabou?</p>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3 text-left mb-10">
            {[
              {
                name: "Ana Paula", role: "Mãe de 3 filhos · São Paulo", initials: "AP", color: "bg-pink-500",
                text: "Meu marido NUNCA sabia o que comprar. Agora ele abre o app e vai direto. Acabou a ligação do mercado!",
              },
              {
                name: "Carlos Eduardo", role: "Mora sozinho · Curitiba", initials: "CE", color: "bg-blue-500",
                text: "Eu achava que não precisava. Depois que esqueci detergente pela terceira vez na mesma semana, baixei. Nunca mais esqueci nada.",
              },
              {
                name: "Fernanda Lima", role: "Dona de restaurante · BH", initials: "FL", color: "bg-violet-500",
                text: "Uso no restaurante! Funcionários marcam o que acabou na copa e no estoque. Economizei tempo e dinheiro.",
              },
            ].map((dep, i) => (
              <RevealOnScroll key={dep.name} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] h-full">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">&ldquo;{dep.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${dep.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {dep.initials}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{dep.name}</p>
                      <p className="text-xs text-gray-500">{dep.role}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARATIVO ═══ */}
      <section className="px-6 py-16 bg-[#f8faf8]">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10">
              <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Comparativo</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Melhor que lista perdida no WhatsApp.</h2>
            </div>
          </RevealOnScroll>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "📱 WhatsApp", items: ["Se perde no chat", "Ninguém atualiza", "Vira bagunça", "Sem status"], bad: true },
              { title: "📝 Papel", items: ["Esquece em casa", "Só 1 pessoa vê", "Rasura e confusão", "Sem aviso"], bad: true },
              { title: "📋 Bloco de notas", items: ["Não compartilha", "Sem status", "Não avisa", "Sem automação"], bad: true },
              { title: "✅ Acabou?", items: ["Todo mundo vê", "Status em tempo real", "Lista automática", "WhatsApp + offline", "Lembrete diário"], bad: false },
            ].map((col, i) => (
              <RevealOnScroll key={col.title} delay={i * 100}>
                <div className={`rounded-2xl p-5 border h-full ${col.bad ? "bg-white border-gray-200/80 shadow-[0_6px_20px_-10px_rgba(0,0,0,0.15)]" : "brand-grad border-green-700 text-white shadow-xl shadow-green-600/25"}`}>
                  <h4 className={`font-bold text-sm mb-4 ${col.bad ? "text-gray-900" : "text-white"}`}>{col.title}</h4>
                  <div className="space-y-2.5">
                    {col.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <span className={col.bad ? "text-red-400" : "text-green-100"}>{col.bad ? "✕" : "✓"}</span>
                        <span className={col.bad ? "text-gray-600" : "text-white"}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="text-center mt-8">
              <Link href="/cadastro" className="inline-block bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-sm shadow-lg shadow-green-200">
                Começar sem cartão →
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══ PLANOS ═══ */}
      <section id="planos" className="px-6 py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="text-center mb-10">
              <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Planos</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Comece grátis. Assine só se fizer sentido.</h2>
              <p className="text-gray-500 text-lg">Uma ida extra ao mercado custa mais que um mês de Acabou?</p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Grátis", price: "R$ 0", period: "para sempre", highlight: false, badge: null,
                features: ["1 local", "Apenas você (1 pessoa)", "Até 10 itens", "Lista automática"],
                notIncluded: ["Compartilhar no WhatsApp", "Lembrete diário", "Pessoas ilimitadas", "Locais ilimitados"],
                cta: "Começar grátis", color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
              },
              {
                name: "Família Mensal", price: "R$ 8,90", period: "/mês", highlight: false, badge: "🎁 7 DIAS GRÁTIS",
                features: ["Tudo do Grátis +", "Pessoas ilimitadas", "Itens ilimitados", "Locais ilimitados", "Compartilhar no WhatsApp", "Lembrete diário", "Lembretes recorrentes", "Histórico completo"],
                notIncluded: [],
                cta: "Testar 7 dias grátis", color: "bg-gray-900 text-white hover:bg-gray-800",
              },
              {
                name: "Família Anual", price: "R$ 59,90", period: "/ano", highlight: true, badge: "🔥 MELHOR VALOR — R$ 4,99/mês",
                features: ["Tudo do Mensal +", "Economize R$ 46,90/ano", "Prioridade em novidades", "Suporte prioritário"],
                notIncluded: [],
                cta: "Garantir por R$ 4,99/mês", color: "bg-green-600 text-white hover:bg-green-700",
              },
            ].map((plan) => (
              <RevealOnScroll key={plan.name}>
                <div className={`rounded-2xl border overflow-hidden transition-transform h-full flex flex-col ${plan.highlight ? "relative z-10 bg-gradient-to-b from-green-50 to-white border-green-500 pulse-glow md:-translate-y-3 md:scale-[1.04]" : "bg-white border-gray-200 shadow-[0_14px_40px_-14px_rgba(15,23,42,0.18)] hover:scale-[1.01]"}`}>
                  {plan.badge && <div className="bg-green-600 text-white text-center py-2.5 text-xs font-bold px-3">{plan.badge}</div>}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-700 text-sm mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <Check size={16} className="text-green-600 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.notIncluded.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                          <span className="w-4 text-center shrink-0">—</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/cadastro" className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm ${plan.color}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <RevealOnScroll>
            <div className="mt-10 bg-green-50 border-2 border-green-200 rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto">
              <span className="text-4xl mb-3 block">🛡️</span>
              <h3 className="font-black text-gray-900 text-xl mb-3">Teste por 7 dias. Sem cartão. Sem pegadinha.</h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Acesse o Plano Família completo. Se não assinar, volta pro grátis automaticamente. <strong>Sem cobrança, sem burocracia.</strong>
              </p>
            </div>
          </RevealOnScroll>

          {/* Selo de pagamento seguro — Mercado Pago */}
          <RevealOnScroll>
            <PaymentTrust className="mt-8" />
          </RevealOnScroll>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <FaqSection />

      {/* ═══ CTA FINAL ═══ */}
      <FinalCTA />

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 text-gray-400 px-6 py-10 text-center text-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <LogoIcon size={36} />
            <span className="text-xl font-black text-white">Acabou?</span>
          </div>

          {/* Selo de pagamento seguro (logo branca para fundo escuro) */}
          <PaymentTrust variant="dark" className="mb-6" />

          <div className="flex justify-center gap-6 mb-4 flex-wrap">
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
            <Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
          <p>© {new Date().getFullYear()} Acabou? · Grupo Kazin · Feito com ❤️ para famílias brasileiras</p>
        </div>
      </footer>

      {/* ═══ MOBILE STICKY CTA ═══ */}
      <MobileStickyBar />
    </div>
  );
}
