import Link from "next/link";
import { LogoIcon } from "@/components/shared/Logo";
import { InstallButton } from "@/components/shared/InstallPWA";

export function FinalCTA() {
  return (
    <section id="final-cta" className="relative overflow-hidden px-6 py-20 text-white text-center brand-grad">
      {/* Floating emojis */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          // Esquerda — variado vs Hero (mercado + limpeza + empresa/nota), espalhado
          { emoji: "🥛", x: "5%", y: "11%", size: "2rem", opacity: 0.28, dur: "9s", delay: "0s" },
          { emoji: "🧼", x: "13%", y: "5%", size: "1.6rem", opacity: 0.24, dur: "11s", delay: "-2s" },
          { emoji: "🍞", x: "4%", y: "62%", size: "1.8rem", opacity: 0.24, dur: "10s", delay: "-4s" },
          { emoji: "🧹", x: "7%", y: "90%", size: "1.7rem", opacity: 0.24, dur: "12s", delay: "-1s" },
          // Direita
          { emoji: "🧻", x: "93%", y: "13%", size: "1.9rem", opacity: 0.28, dur: "10.5s", delay: "-3s" },
          { emoji: "🧾", x: "85%", y: "6%", size: "1.6rem", opacity: 0.24, dur: "9.5s", delay: "-5s" },
          { emoji: "🍌", x: "94%", y: "62%", size: "1.8rem", opacity: 0.24, dur: "11.5s", delay: "-2.5s" },
          { emoji: "🧀", x: "90%", y: "90%", size: "1.7rem", opacity: 0.24, dur: "8.5s", delay: "-4.5s" },
        ].map((f, i) => (
          <span key={i} className="absolute animate-float" style={{ left: f.x, top: f.y, fontSize: f.size, opacity: f.opacity, animationDuration: f.dur, animationDelay: f.delay }}>
            {f.emoji}
          </span>
        ))}
      </div>

      <div className="relative max-w-xl mx-auto">
        <div className="flex justify-center mb-6">
          <LogoIcon size={72} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
          Sua família merece uma{" "}<br className="md:hidden" />casa&nbsp;onde&nbsp;nada&nbsp;falta.
        </h2>
        <p className="text-green-100 mb-4 text-lg leading-relaxed">
          Crie sua casa em 30 segundos e teste o Plano Família por 7 dias. Sem cartão, sem risco.
        </p>
        <p className="text-green-200 mb-8 text-sm font-semibold">
          🎁 7 dias grátis — sem cartão, sem risco
        </p>
        <Link href="/cadastro" className="inline-block bg-white text-green-700 font-black px-12 py-4 rounded-2xl hover:bg-green-50 transition-all hover:scale-105 text-lg shadow-2xl">
          Organizar minha casa agora →
        </Link>
        <div className="flex justify-center mt-5">
          <InstallButton />
        </div>

        {/* PS — balão frosted (destaca sobre o verde) */}
        <div className="mt-10 bg-white/10 border border-white/25 rounded-2xl p-5 text-left max-w-md mx-auto shadow-lg shadow-green-900/20">
          <p className="text-green-50 text-sm leading-relaxed">
            <strong className="text-white">PS:</strong> O único risco é continuar esquecendo itens no mercado. Teste grátis e veja como é viver sem o &ldquo;como eu esqueci?&rdquo;
          </p>
        </div>

        <div className="flex justify-center gap-4 sm:gap-6 mt-8 text-green-200 text-sm flex-wrap">
          <span>✅ 7 dias grátis</span>
          <span>✅ Sem cartão</span>
          <span>✅ 30 segundos</span>
          <span>✅ Funciona offline</span>
        </div>
      </div>
    </section>
  );
}
