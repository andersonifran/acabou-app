import { cn } from "@/lib/utils";
import { Mascot } from "@/components/shared/Mascot";

interface EmptyStateProps {
  icon?: string;
  /** Mostra o mascote (sacola) no lugar do emoji, com o humor escolhido */
  mascot?: "happy" | "search" | "done";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, mascot, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      {mascot ? (
        <div className="mb-5">
          <Mascot mood={mascot} size={128} />
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
