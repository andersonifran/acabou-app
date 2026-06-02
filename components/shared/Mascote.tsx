import { cn } from "@/lib/utils";

/**
 * Sacolino — o mascote do Acabou? (imagens 3D em public/mascote/).
 * Dá personalidade às telas vazias, onboarding e celebrações.
 *
 * mood:
 *  - "acenando"    → boas-vindas / tela vazia acolhedora
 *  - "buscando"    → busca sem resultado
 *  - "feliz"       → tudo em dia / sucesso (joinha)
 *  - "comemorando" → compra finalizada (braços pra cima)
 */
const SRC = {
  acenando: "/mascote/sacolino-acenando.png",
  buscando: "/mascote/sacolino-buscando.png",
  feliz: "/mascote/sacolino-feliz.png",
  comemorando: "/mascote/sacolino-comemorando.png",
} as const;

export type MascoteMood = keyof typeof SRC;

export function Mascote({
  mood,
  size = 132,
  bob = true,
  className = "",
}: {
  mood: MascoteMood;
  size?: number;
  bob?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[mood]}
      alt="Sacolino, mascote do Acabou?"
      style={{ height: size, width: "auto" }}
      draggable={false}
      className={cn("select-none pointer-events-none", bob && "animate-bob", className)}
    />
  );
}
