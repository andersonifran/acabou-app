"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Mascote } from "@/components/shared/Mascote";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Convite PREMIUM pra ativar notificações — PRÉ-PROMPT.
 *
 * É a NOSSA tela (não o popup do sistema). O usuário só dispara o popup nativo
 * quando toca em "Quero ser avisado". Assim:
 *   • um "Agora não" NÃO queima a permissão do sistema (podemos pedir de novo);
 *   • a chance única do popup nativo é gasta só com quem já quer → ativa muito
 *     mais gente.
 *
 * Aparece no momento de ALTA INTENÇÃO (logo após o 1º item marcado no
 * onboarding). onClose(true) = ativou; onClose(false) = "agora não"/fechou.
 */
export function NotificationOptInModal({
  open,
  onClose,
  mode = "ask",
}: {
  open: boolean;
  onClose: (activated: boolean) => void;
  /** "ask" = convite normal (permissão indecisa). "reenable" = bloqueado no
   *  sistema → mostra COMO religar (o botão "Ativar" não funciona se bloqueado). */
  mode?: "ask" | "reenable";
}) {
  const { subscribe, isDenied } = usePushNotifications();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [blocked, setBlocked] = useState(false);

  if (!open) return null;

  async function handleActivate() {
    setLoading(true);
    const ok = await subscribe(); // dispara o popup NATIVO do sistema
    setLoading(false);
    if (ok) {
      setDone(true);
      setTimeout(() => onClose(true), 2200);
    } else {
      // Negou no popup nativo (ou bloqueado no SO). Não perde o usuário: mostra
      // um aviso gentil e fecha — a home volta a oferecer reativar depois.
      setBlocked(true);
      setTimeout(() => onClose(false), 2600);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 animate-optin-fade">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={() => !loading && !done && onClose(false)}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl px-6 pt-7 pb-6 overflow-hidden animate-optin-pop">
        {/* brilho de marca no topo do card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(34,197,94,0.22), transparent)" }}
        />

        {done ? (
          // ───── Sucesso ─────
          <div className="relative flex flex-col items-center text-center py-2">
            <Mascote mood="comemorando" size={120} className="mb-1" />
            <h2 className="text-xl font-black text-gray-900 mt-2">Prontinho! 🎉</h2>
            <p className="text-gray-500 text-sm mt-1.5 max-w-[16rem] leading-snug">
              Agora eu te aviso na hora certa. Pode contar comigo! 💚
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-green-600 font-bold text-sm">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={13} strokeWidth={3} />
              </span>
              Notificações ativadas
            </div>
          </div>
        ) : mode === "reenable" ? (
          // ───── Bloqueado no sistema → COMO religar (botão "Ativar" não
          //        funciona quando bloqueado; aqui só ensinamos o caminho) ─────
          <div className="relative">
            <button
              onClick={() => onClose(false)}
              className="absolute -top-2 -right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="flex justify-center mb-2">
              <Mascote mood="alerta" size={88} />
            </div>
            <h2 className="text-center text-xl font-black text-gray-900 leading-tight">
              Suas notificações estão pausadas 🔕
            </h2>
            <p className="text-center text-gray-500 text-sm mt-2 max-w-[18rem] mx-auto leading-snug">
              As notificações do Acabou? foram bloqueadas no aparelho. Pra voltar a receber os lembretes, é rapidinho:
            </p>
            <div className="mt-4 space-y-2">
              {[
                { n: "1", t: "Abra as Configurações do celular" },
                { n: "2", t: 'Toque em "Apps" e procure "Acabou?"' },
                { n: "3", t: 'Em "Notificações", ligue "Permitir"' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-3 bg-green-50 rounded-xl px-3.5 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {s.n}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{s.t}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onClose(false)}
              className="w-full mt-5 bg-green-600 text-white font-black py-3.5 rounded-2xl hover:bg-green-700 transition-transform duration-100 active:scale-[0.96]"
            >
              Entendi 👍
            </button>
          </div>
        ) : blocked ? (
          // ───── Recusou no nativo / bloqueado ─────
          <div className="relative flex flex-col items-center text-center py-2">
            <Mascote mood="acenando" size={104} className="mb-1" />
            <h2 className="text-lg font-black text-gray-900 mt-2">Tudo bem! 💚</h2>
            <p className="text-gray-500 text-sm mt-1.5 max-w-[17rem] leading-snug">
              {isDenied
                ? "Quando quiser, é só ligar as notificações nas configurações do app. Te espero por lá!"
                : "Quando mudar de ideia, é só tocar no sininho lá dentro. A qualquer hora. 😉"}
            </p>
          </div>
        ) : (
          // ───── Convite ─────
          <div className="relative">
            <button
              onClick={() => onClose(false)}
              className="absolute -top-2 -right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            {/* Sino reluzente + Sacolino espiando (uma unidade visual só) */}
            <div className="flex justify-center mb-1">
              <div className="relative flex items-center justify-center w-40 h-28">
                <span aria-hidden className="absolute w-24 h-24 rounded-full bg-green-400/40 animate-halo" />
                <span
                  aria-hidden
                  className="absolute w-24 h-24 rounded-full bg-green-400/30 animate-halo"
                  style={{ animationDelay: "1.2s" }}
                />
                <div
                  className="pulse-glow relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #22c55e, #059669)" }}
                >
                  <Bell size={36} className="text-white animate-bell-ring" fill="white" />
                </div>
                {/* Sacolino estratégico: pequeno, espiando o sino do canto */}
                <Mascote mood="feliz" size={60} className="absolute bottom-0 right-0 drop-shadow-md" />
              </div>
            </div>

            <h2 className="text-center text-[1.35rem] leading-tight font-black text-gray-900">
              Posso te avisar na hora certa?
            </h2>
            <p className="text-center text-gray-500 text-sm mt-2 max-w-[18rem] mx-auto leading-snug">
              Ative as notificações e <strong className="text-gray-700">nunca mais esqueça</strong> nada no mercado.
            </p>

            {/* Benefícios */}
            <div className="mt-4 space-y-2">
              {[
                { e: "🛒", t: "Na hora certa de ir às compras" },
                { e: "📦", t: "Quando algo estiver acabando" },
                { e: "👨‍👩‍👧", t: "Quando alguém atualizar a lista" },
              ].map((b) => (
                <div key={b.t} className="flex items-center gap-3 bg-green-50 rounded-xl px-3.5 py-2.5">
                  <span className="text-lg shrink-0">{b.e}</span>
                  <span className="text-sm font-medium text-gray-700">{b.t}</span>
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="mt-5 relative z-10">
              <button
                onClick={handleActivate}
                disabled={loading}
                className="w-full bg-green-600 text-white font-black py-3.5 rounded-2xl hover:bg-green-700 transition-transform duration-100 disabled:opacity-70 text-base shadow-md shadow-green-200 active:scale-[0.96] flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Ativando..."
                ) : (
                  <>
                    <Bell size={18} fill="white" /> Sim, quero ser avisado
                  </>
                )}
              </button>

              {/* Dica sutil de priming: prepara pro popup nativo, sem assustar.
                  Some quando está ativando (a nativa já apareceu). */}
              {!loading && (
                <p className="text-center text-[11px] text-gray-500 mt-2 leading-snug px-2">
                  📲 Seu celular vai confirmar — é só tocar em{" "}
                  <strong className="text-green-700">Permitir</strong>
                </p>
              )}

              <button
                onClick={() => onClose(false)}
                disabled={loading}
                className="w-full mt-1.5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-60 transition-transform duration-100 active:scale-[0.97]"
              >
                Agora não
              </button>
            </div>

            <p className="text-center text-[10.5px] text-gray-400 mt-1">
              🔒 Você controla. Pode desativar quando quiser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
