"use client";

/**
 * Transição sutil ao trocar de aba/página dentro do app.
 * Fade rápido (150ms) — dá sensação de movimento "premium" sem
 * parecer lento. Usa só opacity (não transform) para NÃO quebrar
 * os headers sticky das páginas.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
