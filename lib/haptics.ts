/**
 * Haptic feedback (vibração tátil sutil ao tocar).
 *
 * Funciona no Android (Chrome/TWA) via Vibration API. No iOS Safari a API
 * não é suportada — degrada silenciosamente (sem erro). Como nosso público
 * principal e a publicação na Play Store são Android, isso cobre a maioria.
 *
 * Use com parcimônia, nos toques que importam (marcar item, trocar aba,
 * concluir ação) — dá aquela sensação "premium" de app nativo.
 */

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* silencioso */
  }
}

/** Toque leve — navegação, seleção, troca de aba. */
export const hapticLight = () => vibrate(8);

/** Toque médio — abrir modal, ação confirmada. */
export const hapticMedium = () => vibrate(15);

/** Sucesso — item marcado/comprado (padrão curto duplo). */
export const hapticSuccess = () => vibrate([12, 30, 18]);

/** Alerta/erro — algo deu errado (padrão mais longo). */
export const hapticError = () => vibrate([20, 50, 20, 50]);
