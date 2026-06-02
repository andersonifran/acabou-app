import { cn } from "@/lib/utils";

/**
 * Ícones de local — estilo emoji 3D (Fluent), em public/locais/.
 * Objeto único, colorido e reconhecível na hora. Cai pra "casa" se vier
 * um tipo desconhecido.
 */
const SRC: Record<string, string> = {
  casa: "/locais/local-casa.png",
  apartamento: "/locais/local-apartamento.png",
  praia: "/locais/local-praia.png",
  veraneio: "/locais/local-veraneio.png",
  empresa: "/locais/local-empresa.png",
  outro: "/locais/local-outro.png",
};

export function LocationIcon({
  type,
  size = 40,
  className = "",
}: {
  type?: string;
  size?: number;
  className?: string;
}) {
  const src = SRC[type ?? "casa"] ?? SRC.casa;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ width: size, height: size, objectFit: "contain" }}
      className={cn("select-none pointer-events-none", className)}
    />
  );
}
