// =============================================
// Helpers de rastreamento de conversões
// =============================================
// Dispara eventos de conversão para Google Ads e Meta Pixel.
// Seguro para SSR: só executa no browser e se a lib existir.

/**
 * Dispara conversão de "Cadastro Completo" no Google Ads + Meta Pixel.
 * Chamado quando um novo usuário conclui o cadastro.
 */
export function trackCadastroCompleto() {
  if (typeof window === "undefined") return;

  // Google Ads — conversão "Cadastro Completo"
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "conversion", {
        send_to: "AW-17962382785/asT8CJikjbYcEMHrkPVC",
        value: 5.0,
        currency: "BRL",
      });
    }
  } catch { /* ignora erro de rastreamento */ }

  // Meta Pixel — CompleteRegistration
  try {
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      fbq("track", "CompleteRegistration");
    }
  } catch { /* ignora erro de rastreamento */ }
}
