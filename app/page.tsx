import Link from "next/link";
import { Check } from "lucide-react";
import { LogoIcon } from "@/components/shared/Logo";
import { ScenarioShowcase } from "@/components/landing/ScenarioShowcase";
import { NotificationShowcase } from "@/components/landing/NotificationShowcase";
import { InstallButton, InstallPWA } from "@/components/shared/InstallPWA";

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
            <span className="text-gray-900">Acabou o leite?</span><br />
            <span className="text-green-600">Quem viu, marca.</span><br />
            <span className="text-gray-900">Quem compra, vê.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-4 max-w-lg mx-auto leading-relaxed">
            O app de lista de compras que toda a família usa de verdade. Marque o que acabou em segundos e vá ao mercado sem esquecer nada.
          </p>
          <p className="text-sm text-green-700 font-semibold mb-8 bg-green-50 inline-block px-4 py-2 rounded-full">
            📶 Funciona offline e sincroniza quando voltar a internet
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/cadastro" className="bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-lg shadow-lg shadow-green-200">
              Começar grátis agora
            </Link>
            <Link href="#como-funciona" className="bg-white text-gray-700 font-semibold px-8 py-4 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-colors text-lg">
              Ver como funciona
            </Link>
          </div>
          <p className="text-sm text-gray-400">✅ Sem cartão de crédito · Pronto em 2 minutos · Grátis para sempre</p>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
            <p className="text-2xl md:text-4xl font-black">2 min</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">para configurar</p>
          </div>
          <div>
            <p className="text-xl md:text-3xl font-black leading-tight">⭐ R$ 6,66<span className="text-base font-bold">/mês</span></p>
            <p className="text-green-200 text-xs md:text-sm mt-1">no plano anual</p>
          </div>
          <div>
            <p className="text-2xl md:text-4xl font-black">100%</p>
            <p className="text-green-200 text-xs md:text-sm mt-1">grátis pra começar</p>
          </div>
        </div>
      </section>

      {/* ── CENÁRIOS INTERATIVOS ── */}
      <ScenarioShowcase />

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="px-6 py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">Como funciona</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Tão simples quanto perguntar pra alguém da sua casa: <BrandName /></p>
          <div className="space-y-8">
            {[
              { n: "1", emoji: "✅", title: "Crie sua conta grátis", desc: "Cadastro em 2 minutos. Só nome, e-mail e senha — sem cartão de crédito." },
              { n: "2", emoji: "🏠", title: "Monte sua despensa", desc: "Escolha os itens que você já tem em casa. Mais de 50 sugestões prontas por categoria." },
              { n: "3", emoji: "📲", title: "Marque quando algo acabar", desc: 'Abriu o último pacote de café? Toque em "Acabou" — vai direto para a lista. Qualquer um da família pode fazer isso.' },
              { n: "4", emoji: "🛒", title: "Vá ao mercado sem erro", desc: "A lista fica organizada por categoria. Compartilhe pelo WhatsApp com quem vai ao mercado. Marque conforme compra." },
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
            Por que o <BrandName /> funciona
          </h2>
          <p className="text-gray-500 text-center mb-12 text-base md:text-lg">
            Simples o suficiente para toda a família usar — em qualquer celular
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                iconBg: "bg-green-100",
                iconColor: "text-green-700",
                icon: "⚡",
                title: "Lista automática",
                desc: "Marcou que acabou — já foi para a lista. Sem trabalho extra, sem esquecimento.",
              },
              {
                iconBg: "bg-blue-100",
                iconColor: "text-blue-700",
                icon: "👥",
                title: "Todo mundo acompanha",
                desc: "Convide sua família, funcionários e todos atualizam a mesma lista em tempo real.",
              },
              {
                iconBg: "bg-purple-100",
                iconColor: "text-purple-700",
                icon: "📶",
                title: "Funciona sem internet",
                desc: "Sem sinal na praia ou no sítio? Sem problema. Sincroniza quando voltar a conexão.",
              },
              {
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-700",
                icon: "💬",
                title: "Compartilha no WhatsApp",
                desc: "Um toque envia a lista pro WhatsApp. Quem vai ao mercado já sabe tudo que precisa.",
              },
              {
                iconBg: "bg-amber-100",
                iconColor: "text-amber-700",
                icon: "🔔",
                title: "Notificacao no celular",
                desc: "Alguem marcou que acabou? Voce recebe um alerta na hora. E no plano pago, receba lembrete diario para ir as compras.",
              },
              {
                iconBg: "bg-gray-100",
                iconColor: "text-gray-700",
                icon: "🔒",
                title: "Seguro em qualquer aparelho",
                desc: "Android, iOS, Mac ou PC — acesse de onde quiser. Seus dados protegidos na nuvem.",
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
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-3">Comece gratis. Evolua quando quiser.</h2>
          <p className="text-gray-500 text-center mb-12 text-lg">Sem surpresa, sem multa. Cancele quando quiser.</p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: "Gratis", price: "R$ 0", period: "para sempre", highlight: false, badge: null,
                features: [
                  "1 casa",
                  "Ate 2 pessoas",
                  "Ate 40 itens",
                  "Lista compartilhada",
                  "Alerta quando item acaba",
                  "Compartilhar pelo WhatsApp",
                ],
                notIncluded: [
                  "Lembrete diario no celular",
                  "Pessoas ilimitadas",
                  "Casas ilimitadas",
                ],
                cta: "Comecar gratis", href: "/cadastro", color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
              },
              {
                name: "Familia Mensal", price: "R$ 9,90", period: "/mes", highlight: false, badge: null,
                features: [
                  "Tudo do Gratis +",
                  "Pessoas ilimitadas",
                  "Itens ilimitados",
                  "Casas ilimitadas",
                  "Lembrete diario no celular",
                  "Lembretes recorrentes",
                  "Historico completo",
                ],
                notIncluded: [],
                cta: "Assinar por R$ 9,90/mes", href: "/cadastro", color: "bg-gray-900 text-white hover:bg-gray-800",
              },
              {
                name: "Familia Anual", price: "R$ 79,90", period: "/ano", highlight: true,
                badge: "Mais popular — R$ 6,66/mes",
                features: [
                  "Tudo do Mensal +",
                  "2 meses gratis",
                  "Prioridade em novidades",
                  "Suporte prioritario",
                ],
                notIncluded: [],
                cta: "Economizar 20% no anual", href: "/cadastro", color: "bg-green-600 text-white hover:bg-green-700",
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
            Sem cartao de credito para comecar. Cancele quando quiser. Dados protegidos.
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
            Sua casa sempre vai saber<br />o que precisa comprar.
          </h2>
          <p className="text-green-100 mb-10 text-lg">
            Comece agora. É grátis. Pronto em 2 minutos. Sem cartão.
          </p>
          <Link href="/cadastro" className="inline-block bg-white text-green-700 font-black px-12 py-4 rounded-2xl hover:bg-green-50 transition-all hover:scale-105 text-lg shadow-2xl">
            Criar minha conta grátis →
          </Link>
          <div className="flex justify-center mt-5">
            <InstallButton />
          </div>
          <div className="flex justify-center gap-6 mt-6 text-green-200 text-sm flex-wrap">
            <span>✅ Grátis para sempre</span>
            <span>✅ Sem cartão</span>
            <span>✅ 2 minutos</span>
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
