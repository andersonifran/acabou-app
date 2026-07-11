"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Smartphone } from "lucide-react";
import { Mascote, type MascoteMood } from "@/components/shared/Mascote";
import { cn } from "@/lib/utils";

// Tour premium pra novos usuários (feedback dos testadores). 5 telas, com "Pular".
// Foco: dor real → como resolver → nossas exclusividades → escolher o TEMA
// (slide interativa, preview ao vivo). Aparece só na 1ª vez
// (flag acabou_walkthrough_seen, controlada na home). Premium em claro/escuro/sistema.
type Slide = {
  mascot?: MascoteMood;
  img?: string;
  imgCls?: string;
  accent: string;
  title: string;
  desc: string;
  theme?: boolean; // slide interativa de escolha de tema
};

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", Icon: Sun },
  { mode: "dark", label: "Escuro", Icon: Moon },
  { mode: "system", label: "Sistema", Icon: Smartphone },
];

const SLIDES: Slide[] = [
  {
    mascot: "acenando",
    accent: "bg-green-50",
    title: "Bem-vindo ao Acabou? 👋",
    desc: 'O fim do "ah, esqueci de comprar!". Sua casa sempre vai saber o que precisa — vem ver, é rapidinho.',
  },
  {
    img: "/acoes/acao-acabou.png",
    accent: "bg-red-50",
    title: "Acabou? É só marcar!",
    desc: "Viu que o arroz ou o sabão tá no fim? Um toque e ele já entra na sua lista de compras — sem papelzinho, sem anotar.",
  },
  {
    img: "/familia.png",
    imgCls: "w-32 h-32",
    accent: "bg-amber-50",
    title: "Toda a família, em tempo real",
    desc: "Cada um marca o que falta de onde estiver, e a lista se monta sozinha pra todo mundo. Sem comprar em dobro, com a casa toda em sintonia.",
  },
  {
    img: "/acoes/acao-desejo.png",
    accent: "bg-purple-50",
    title: "Até os sonhos de compra 💜",
    desc: "A air fryer, o robô aspirador, a panela nova... guarde os desejos num cantinho especial e realize um por um.",
  },
  {
    theme: true,
    accent: "bg-sky-50",
    title: "Do seu jeito ✨",
    desc: "Escolha o tema do app — a tela já muda na hora. Dá pra trocar quando quiser em Configurações.",
  },
];

export function Walkthrough({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  // Tema atual (pra slide interativa). Mesma lógica do ThemeToggle: "system" =
  // sem preferência salva → segue o aparelho. NÃO mexe na lógica sensível do
  // tema/barra de status — só grava a escolha e avisa o ThemeApplier.
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("acabou_theme");
      setThemeMode(stored === "dark" ? "dark" : stored === "light" ? "light" : "system");
    } catch {}
  }, []);

  function chooseTheme(next: ThemeMode) {
    setThemeMode(next);
    try {
      if (next === "system") localStorage.removeItem("acabou_theme");
      else localStorage.setItem("acabou_theme", next);
    } catch {}
    // ThemeApplier ouve e reaplica NA HORA (classe .dark + barra de status) →
    // o walkthrough inteiro vira o preview ao vivo da escolha.
    window.dispatchEvent(new Event("acabou-theme"));
  }

  if (!open) return null;
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;
  const ThemeIcon = THEME_OPTIONS.find((o) => o.mode === themeMode)?.Icon ?? Smartphone;

  return (
    <div
      className="fixed inset-0 z-[120] bg-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Pular */}
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={onClose}
          className="text-sm font-semibold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg"
        >
          Pular
        </button>
      </div>

      {/* Conteúdo (centro) — anima a cada troca de tela */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center -mt-6">
        <div key={i} className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className={cn("w-40 h-40 rounded-[2rem] flex items-center justify-center mb-7", slide.accent)}>
            {slide.mascot && <Mascote mood={slide.mascot} size={118} />}
            {slide.img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.img}
                alt=""
                draggable={false}
                className={cn("object-contain select-none pointer-events-none", slide.imgCls ?? "w-24 h-24")}
              />
            )}
            {slide.theme && (
              // Ícone reflete a escolha atual (Sol/Lua/Celular) — troca ao vivo.
              <ThemeIcon size={72} className="text-sky-500" strokeWidth={1.6} />
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">{slide.title}</h2>
          <p className="text-gray-500 leading-relaxed max-w-xs">{slide.desc}</p>

          {/* Slide do TEMA: 3 cartões selecionáveis, preview ao vivo (a própria
              tela do tour muda de cor na hora — sensação premium). */}
          {slide.theme && (
            <div className="flex gap-2.5 mt-6 w-full max-w-xs">
              {THEME_OPTIONS.map((o) => {
                const active = themeMode === o.mode;
                return (
                  <button
                    key={o.mode}
                    onClick={() => chooseTheme(o.mode)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 text-xs font-bold transition-all duration-150 active:scale-[0.94]",
                      active
                        ? "border-green-500 bg-green-50 text-green-700 shadow-md shadow-green-100"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <o.Icon size={22} />
                    {o.label}
                    {active && <span className="text-[10px] font-black text-green-600">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Indicador + botão */}
      <div className="px-8 pb-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === i ? "w-6 bg-green-600" : "w-2 bg-gray-200"
              )}
            />
          ))}
        </div>
        <button
          onClick={() => (isLast ? onClose() : setI((v) => v + 1))}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-700 transition-transform duration-100 active:scale-[0.98]"
        >
          {isLast ? "Começar! 🚀" : "Próximo"}
        </button>
      </div>
    </div>
  );
}
