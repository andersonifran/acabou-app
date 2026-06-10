/**
 * Tipos de local (property_type) — espelha os PROPERTY_TYPES da UI
 * (casa/nova, onboarding etc.). Usado em notificações (push/in-app) pra mostrar
 * o emoji certo do local — nunca um 🏠 fixo quando o usuário escolheu "Empresa".
 */
export const LOCATION_EMOJI: Record<string, string> = {
  casa: "🏠",
  apartamento: "🏢",
  praia: "🏖️",
  veraneio: "🌳",
  empresa: "💼",
  outro: "📍",
};

export function locationEmoji(type?: string | null): string {
  return LOCATION_EMOJI[type ?? "casa"] ?? LOCATION_EMOJI.casa;
}
