import { cn } from "@/lib/utils";

/**
 * Ícones 3D de local (public/locais/) — mini-cenas premium estilo app-icon.
 * Cada tipo tem sua imagem; cai pra "casa" se vier um tipo desconhecido.
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
