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

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoIcon size={42} />
            <BrandName className="text-2xl" />
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop/tablet: Entrar ao lado */}
            <Link href="/login" className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium">
              Entrar
            </Link>

            {/* Mobile: Começar grátis + Entrar empilhados */}
            <div className="flex flex-col items-end gap-1 sm:block">
              <Link href="/cadastro" className="bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                Começar grátis
              </Link>
              <Link href="/login" className="sm:hidden text-xs text-gray-500 font-medium border border-gray-200 px-3 py-1 rounded-lg hover:border-green-300 hover:text-green-700 transition-colors">
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="px-6 py-16 md:py-24 text-center" style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full mb-8">
            🇧🇷 Feito para famílias brasileiras
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            <span className="text-gray-900">Acabou o café?</span><br />
            <span className="text-green-600">Quem viu, marca.</span><br />
            <span className="text-gray-900">Quem compra, já sabe.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-4 max-w-lg mx-auto leading-relaxed">
            Chega de esquecer itens no mercado, comprar repetido ou ficar perguntando "tem arroz?". Um toque e toda a família sabe o que falta.
          </p>
          <p className="text-sm text-green-700 font-semibold mb-8 bg-green-50 inline-block px-4 py-2 rounded-full">
            📶 Funciona offline e sincroniza quando voltar a internet
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/cadastro" className="bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-lg shadow-lg shadow-green-200">
              Criar minha lista grátis
            </Link>
            <Link href="#como-funciona" className="bg-white text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-colors text-lg">
              Como funciona?
            </Link>
          </div>
          <p className="text-sm text-gray-400">✅ Sem cartão · Pronto em 30 segundos · Grátis para sempre</p>
        </div>

        {/* Preview do app */}
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
                { name: "Arroz", quem: "João marcou", status: "Acabando", color: "bg-amber-100 text-amber-700" },
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
                Compartilhar no WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NÚMEROS ── */}
      <section className="px-6 py-10 bg-green-600">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center text-white">
          <div>
            <p className="text-2xl md:text-4xl font-black">30 seg</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">para configurar tudo</p>
          </div>
          <div>
            <p className="text-xl md:text-3xl font-black leading-tight">R$ 4,99<span className="text-base font-bold">/mês</span></p>
            <p className="text-green-200 text-xs md:text-sm mt-1">preço de lançamento</p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-black">0 itens</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">esquecidos no mercado</p>
          </div>
        </div>
      </section>

      {/* ── CENÁRIOS INTERATIVOS ── */}
      <ScenarioShowcase />

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="px-6 py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">Simples assim</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Mais fácil do que mandar um "acabou o café" no grupo da família</p>
          <div className="space-y-8">
            {[
              { n: "1", emoji: "✅", title: "Crie sua conta em 30 segundos", desc: "Só nome e e-mail. Sem cartão, sem burocracia. Pode entrar com Google também." },
              { n: "2", emoji: "🏠", title: "Monte sua despensa", desc: "Escolha os itens que você já tem em casa. Mais de 50 sugestões prontas separadas por categoria." },
              { n: "3", emoji: "📲", title: "Acabou? Um toque resolve", desc: 'Abriu o último pacote de café? Toque em "Acabou" e pronto — vai direto pra lista de compras. Qualquer pessoa da casa pode fazer.' },
              { n: "4", emoji: "🛒", title: "Vá ao mercado sem esquecer nada", desc: "Lista organizada, compartilhável pelo WhatsApp. Quem vai ao mercado já sabe exatamente o que comprar." },
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
        </div>
      </section>

      {/* ── BENEFÍCIOS ── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 text-center mb-3">
            Chega de lista no papel que ninguém lê
          </h2>
          <p className="text-gray-500 text-center mb-12 text-base md:text-lg">
            Simples o suficiente para toda a família usar — do avô ao neto
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                iconBg: "bg-green-100",
                iconColor: "text-green-700",
                icon: "⚡",
                title: "Lista que se monta sozinha",
                desc: "Marcou que acabou? Já foi pra lista de compras. Zero esforço, zero esquecimento.",
              },
              {
                iconBg: "bg-blue-100",
                iconColor: "text-blue-700",
                icon: "👥",
                title: "Toda a família participa",
                desc: "Convide quem mora com você. Todo mundo marca o que viu acabar — a lista fica sempre atualizada.",
              },
              {
                iconBg: "bg-purple-100",
                iconColor: "text-purple-700",
                icon: "📶",
                title: "Funciona sem internet",
                desc: "Na praia, no sítio ou no elevador. Funciona offline e sincroniza quando voltar a conexão.",
              },
              {
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-700",
                icon: "💬",
                title: "Manda pro WhatsApp",
                desc: "Envie a lista completa em 1 toque. Coloque a marca e detalhes de sua preferência — quem vai ao mercado não precisa ligar pra perguntar.",
              },
              {
                iconBg: "bg-amber-100",
                iconColor: "text-amber-700",
                icon: "🔔",
                title: "Notificação na hora",
                desc: "Alguém marcou que acabou? Você recebe o alerta instantaneamente. No plano Família, receba lembrete diário.",
              },
              {
                iconBg: "bg-gray-100",
                iconColor: "text-gray-700",
                icon: "🔒",
                title: "Seguro em qualquer aparelho",
                desc: "Android, iPhone, computador — acesse de onde quiser. Seus dados protegidos na nuvem.",
              },
            ].map(({ iconBg, iconColor, icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all">
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

      {/* ── POR QUE ASSINAR — Showcase com mockup ── */}
      <NotificationShowcase />

      {/* ── PLANOS ── */}
      <section id="planos" className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">Comece grátis. Sua família vai agradecer.</h2>
          <p className="text-gray-500 text-center mb-12 text-lg">Sem surpresas, sem multa, sem cartão para começar.</p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Grátis", price: "R$ 0", period: "para sempre", highlight: false, badge: null,
                features: [
                  "1 casa",
                  "Apenas você (1 pessoa)",
                  "Até 20 itens",
                  "Lista compartilhada",
                  "Notificação quando alguém marca acabou",
                  "Compartilhar pelo WhatsApp",
                ],
                notIncluded: [
                  "Lembrete diário no celular",
                  "Pessoas ilimitadas",
                  "Casas ilimitadas",
                ],
                cta: "Começar grátis", href: "/cadastro", color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
              },
              {
                name: "Família Mensal", price: "R$ 8,90", period: "/mês", highlight: false, badge: "🚀 Preço de lançamento",
                features: [
                  "Tudo do Grátis +",
                  "Pessoas ilimitadas",
                  "Itens ilimitados",
                  "Casas ilimitadas",
                  "Lembrete diário no celular",
                  "Lembretes recorrentes",
                  "Histórico completo",
                ],
                notIncluded: [],
                cta: "Assinar por R$ 8,90/mês", href: "/cadastro", color: "bg-gray-900 text-white hover:bg-gray-800",
              },
              {
                name: "Família Anual", price: "R$ 59,90", period: "/ano", highlight: true,
                badge: "🚀 Lançamento — R$ 4,99/mês",
                features: [
                  "Tudo do Mensal +",
                  "Economize R$ 46,90 por ano",
                  "Prioridade em novidades",
                  "Suporte prioritário",
                ],
                notIncluded: [],
                cta: "Garantir preço de lançamento", href: "/cadastro", color: "bg-green-600 text-white hover:bg-green-700",
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
          <p className="text-center text-sm text-gray-400 mt-6">
            Sem cartão de crédito para começar. Cancele quando quiser. Dados protegidos.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-20 text-white text-center" style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}>
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-6">
            <LogoIcon size={72} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Nunca mais volte do mercado<br />e descubra que faltou algo.
          </h2>
          <p className="text-green-100 mb-10 text-lg">
            É grátis, leva 30 segundos e não precisa de cartão.
          </p>
          <Link href="/cadastro" className="inline-block bg-white text-green-700 font-black px-12 py-4 rounded-2xl hover:bg-green-50 transition-all hover:scale-105 text-lg shadow-2xl">
            Quero organizar minha casa →
          </Link>
          <div className="flex justify-center mt-5">
            <InstallButton />
          </div>
          <div className="flex justify-center gap-6 mt-6 text-green-200 text-sm flex-wrap">
            <span>✅ Grátis para sempre</span>
            <span>✅ Sem cartão</span>
            <span>✅ 30 segundos</span>
            <span>✅ Funciona offline</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
