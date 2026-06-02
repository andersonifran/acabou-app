import { cn } from "@/lib/utils";
import { Mascote, type MascoteMood } from "@/components/shared/Mascote";

interface EmptyStateProps {
  icon?: string;
  /** Mostra o Sacolino (mascote) no lugar do emoji */
  mascot?: "happy" | "search" | "done";
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

export function EmptyState({ icon, mascot, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      {mascot ? (
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
