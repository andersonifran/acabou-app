import { cn } from "@/lib/utils";
import { Mascote, type MascoteMood } from "@/components/shared/Mascote";

interface EmptyStateProps {
  icon?: string;
  /** Mostra o Sacolino (mascote) no lugar do emoji */
  mascot?: "happy" | "search" | "done";
  /** Ilustração 3D (PNG) com animação suave de flutuar — premium. Prioridade sobre mascot/icon. */
  image?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

// Mapeia o humor "lógico" da tela para a pose do Sacolino
const MOOD: Record<NonNullable<EmptyStateProps["mascot"]>, MascoteMood> = {
  happy: "acenando",
  search: "buscando",
  done: "feliz",
};

export function EmptyState({ icon, mascot, image, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      {image ? (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="animate-empty-bob select-none pointer-events-none drop-shadow-[0_12px_22px_rgba(22,163,74,0.18)]"
            style={{ width: 150, height: "auto" }}
          />
        </div>
      ) : mascot ? (
        <div className="mb-4">
          <Mascote mood={MOOD[mascot]} size={140} />
        </div>
      ) : (
        icon && <span className="text-5xl mb-4">{icon}</span>
      )}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
