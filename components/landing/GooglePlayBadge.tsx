// Badge OFICIAL "Disponível no Google Play" (asset do próprio Google, sem
// modificação — regra de marca do badge). Aponta pra ficha do app na Play.
//
// ⚠️ CHAVE DE LANÇAMENTO: manter `PLAY_STORE_LIVE = false` até a PRODUÇÃO
// publicar na Play. Hoje só testadores do teste fechado veem a ficha — pra
// visitante comum o link daria "app não encontrado" (péssimo pro tráfego de
// anúncio). Quando a produção publicar → flipar pra `true` e deployar.
//
// ⚠️ O badge é ADIÇÃO à landing, NUNCA troca: o Mercado Pago CONTINUA na
// landing web (memória pagamento-twa-vs-web-compliance — só se esconde
// DENTRO do TWA, nunca no site).
// ✅ LIGADO em 12/07/2026 — produção publicada na Play ("A atualização do
// app foi publicada"). A ficha agora é pública pra qualquer visitante.
export const PLAY_STORE_LIVE = true;

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=br.com.acabouapp.www.twa";

export function GooglePlayBadge({
  className = "",
  height = 52,
}: {
  className?: string;
  height?: number;
}) {
  if (!PLAY_STORE_LIVE) return null;
  return (
    <a
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Disponível no Google Play"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/google-play-badge.png"
        alt="Disponível no Google Play"
        style={{ height }}
        className="w-auto transition-transform hover:scale-105"
        draggable={false}
      />
    </a>
  );
}
