"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Link de opt-in do teste fechado (Play Console → Teste fechado → Testadores)
const OPT_IN_URL = "https://play.google.com/apps/testing/br.com.acabouapp.www.twa?hl=pt-BR";
const DISMISS_KEY = "tester_banner_dismissed_v1";

/**
 * Banner TEMPORÁRIO de recrutamento de testadores (campanha do teste fechado
 * na Play Store). Convida os usuários atuais a virarem testadores oficiais.
 *
 * IMPORTANTE: a página de opt-in do Google (apps/testing) abre EM INGLÊS e não
 * dá pra forçar português (é página do Google). Por isso, antes de mandar o
 * usuário pra lá, mostramos uma telinha NOSSA em português explicando o passo a
 * passo — assim quem não sabe inglês não se assusta nem desiste. Remover após o
 * lançamento.
 */
export function TesterBanner() {
  const [show, setShow] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // REGRA: o banner SÓ some pra quem JÁ baixou o app de teste na Play Store
    // (TWA — identificado pelo referrer android-app://). Quem ainda não baixou
    // continua vendo o convite — mesmo que tenha instalado a PWA pela tela inicial
    // (display-mode standalone NÃO conta como "baixou o teste").
    // Guardamos um flag persistente: uma vez TWA, sempre TWA (o referrer pode se
    // perder em navegações internas, então não dependemos só dele).
    const referrerIsTWA = document.referrer.startsWith("android-app://");
    if (referrerIsTWA) localStorage.setItem("is_twa_install", "1");
    const isPlayStoreTester = referrerIsTWA || localStorage.getItem("is_twa_install") === "1";
    if (isPlayStoreTester) return; // já é testador da Play Store → não convida de novo
    if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <>
      <div className="mx-4 mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-4 text-white shadow-lg shadow-green-600/25">
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="absolute right-2 top-2 p-1 text-white/70 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google-play-icon.png" alt="Google Play" width={32} height={32} className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug">
              Ajude o Acabou? a chegar na Google Play!
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-green-50">
              Vire <strong>testador oficial</strong> em 1 minutinho. Sua ajuda
              libera o app pra milhões — e a gente agradece DEMAIS! 💚
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGuide(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50 active:scale-[0.99]"
        >
          {/* Triângulo "play" (vibe Google Play) */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          Quero ser testador
        </button>

        <p className="mt-1.5 text-center text-[10px] text-green-100">
          🔒 Teste oficial pelo Google Play · leva 1 min
        </p>
      </div>

      {/* ── Telinha NOSSA em português, antes da página (em inglês) do Google ── */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/google-play-icon.png" alt="Google Play" width={32} height={32} className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-gray-900">Quase lá! Falta 1 passo 💚</h3>
                <p className="text-xs text-gray-500">Leva menos de 1 minuto</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                aria-label="Fechar"
                className="ml-auto p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
              ⚠️ A próxima tela é <strong>do Google</strong> e aparece <strong>em inglês</strong> — é
              totalmente <strong>normal e seguro</strong>. O nosso app é <strong>100% em português</strong>! 🇧🇷
            </div>

            <p className="mt-4 text-sm font-bold text-gray-900">É só fazer isto:</p>
            <ol className="mt-2 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">1</span>
                <span className="text-sm text-gray-700">
                  Toque no botão <strong className="text-gray-900">&ldquo;Become a tester&rdquo;</strong>
                  <span className="text-gray-500"> (= &ldquo;Virar testador&rdquo;)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">2</span>
                <span className="text-sm text-gray-700">
                  Toque em <strong className="text-gray-900">&ldquo;Download it on Google Play&rdquo;</strong>
                  <span className="text-gray-500"> (= &ldquo;Baixar no Google Play&rdquo;)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">3</span>
                <span className="text-sm text-gray-700">
                  <strong className="text-gray-900">Instale</strong> e abra — vai estar tudo em
                  português! ✅
                </span>
              </li>
            </ol>

            <a
              href={OPT_IN_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowGuide(false)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-600/30 transition-colors hover:bg-green-700 active:scale-[0.99]"
            >
              Entendi, continuar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-2 w-full rounded-2xl py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </>
  );
}
