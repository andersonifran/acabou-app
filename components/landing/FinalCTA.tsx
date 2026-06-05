import Link from "next/link";
import { LogoIcon } from "@/components/shared/Logo";
import { InstallButton } from "@/components/shared/InstallPWA";

export function FinalCTA() {
  return (
    <section id="final-cta" className="relative overflow-hidden px-6 py-20 text-white text-center brand-grad">
      {/* Floating emojis */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          // Esquerda (4) — variado vs Hero (mercado + limpeza + higiene)
          { emoji: "🥛", x: "4%", y: "10%", size: "2rem", opacity: 0.26, dur: "9s", delay: "0s" },
          { emoji: "🧼", x: "3%", y: "39%", size: "1.7rem", opacity: 0.22, dur: "11s", delay: "-2s" },
          { emoji: "🍞", x: "5%", y: "64%", size: "1.8rem", opacity: 0.24, dur: "10s", delay: "-4s" },
          { emoji: "🧹", x: "4%", y: "88%", size: "1.7rem", opacity: 0.22, dur: "12s", delay: "-1s" },
          // Direita (4)
          { emoji: "🧻", x: "93%", y: "12%", size: "1.9rem", opacity: 0.26, dur: "10.5s", delay: "-3s" },
          { emoji: "🥚", x: "94%", y: "40%", size: "1.6rem", opacity: 0.2, dur: "9.5s", delay: "-5s" },
          { emoji: "🍌", x: "92%", y: "64%", size: "1.8rem", opacity: 0.24, dur: "11.5s", delay: "-2.5s" },
          { emoji: "🧀", x: "93%", y: "88%", size: "1.7rem", opacity: 0.24, dur: "8.5s", delay: "-4.5s" },
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

        {/* PS */}
        <div className="mt-12 pt-8 border-t border-green-500/30 text-left max-w-md mx-auto">
          <p className="text-green-200 text-sm leading-relaxed">
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
