import { cn } from "@/lib/utils";

/**
 * Sacolino — o mascote do Acabou? (imagens 3D em public/mascote/).
 * Cada pose tem a sua PRÓPRIA animação, combinando com o gesto:
 *  - "acenando"    → balança como quem dá tchau (boas-vindas / tela vazia)
 *  - "buscando"    → vai e volta como quem procura (busca sem resultado)
 *  - "feliz"       → sobe/desce contente (tudo em dia / joinha)
 *  - "comemorando" → pulinho de alegria (compra finalizada)
 */
const SRC = {
  acenando: "/mascote/sacolino-acenando.png",
  buscando: "/mascote/sacolino-buscando.png",
  feliz: "/mascote/sacolino-feliz.png",
  comemorando: "/mascote/sacolino-comemorando.png",
  alerta: "/mascote/sacolino-alerta.png",
} as const;

const ANIM = {
  acenando: "animate-mascot-wave",
  buscando: "animate-mascot-scan",
  feliz: "animate-mascot-nod",
  comemorando: "animate-mascot-celebrate",
  alerta: "animate-mascot-alert",
} as const;

export type MascoteMood = keyof typeof SRC;

export function Mascote({
  mood,
  size = 132,
  animated = true,
  className = "",
}: {
  mood: MascoteMood;
  size?: number;
  /** Liga a animação própria da pose. false = estático (ex: tela com confete). */
  animated?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[mood]}
      alt="Sacolino, mascote do Acabou?"
      style={{ height: size, width: "auto" }}
      draggable={false}
      className={cn(
        "select-none pointer-events-none",
        animated && ANIM[mood],
        className
      )}
    />
  );
}
