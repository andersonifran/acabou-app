"use client";

import { useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

/**
 * Vídeo de demonstração na landing — 9:16 em moldura de celular.
 * NÃO toca sozinho: mostra a capa com botão ▶️ e só inicia ao clicar
 * (com som, já que o usuário escolheu assistir).
 * Bloqueia o menu de download (clique longo / botão direito).
 */
export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  function handlePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
    setStarted(true);
  }

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
  }

  return (
    <div className="mx-auto max-w-[280px]">
      <div className="relative rounded-[2rem] bg-gray-900 p-2 shadow-2xl shadow-green-200/50">
        <video
          ref={videoRef}
          className="w-full rounded-[1.5rem] block"
          loop
          playsInline
          preload="metadata"
          poster="/web-app-manifest-512x512.png"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src="/video-hero.mp4" type="video/mp4" />
        </video>

        {/* Capa com botão de play — antes de iniciar */}
        {!started && (
          <button
            onClick={handlePlay}
            aria-label="Assistir vídeo"
            className="absolute inset-2 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-green-700/85 to-green-900/90 text-white transition-opacity hover:opacity-95"
          >
            <span className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Play size={28} className="text-green-600 fill-green-600 ml-1" />
            </span>
            <span className="font-bold text-sm">Assistir (10s)</span>
            <span className="text-green-100 text-xs">Toque para ver como funciona</span>
          </button>
        )}

        {/* Botão de som — só aparece depois de iniciar */}
        {started && (
          <button
            onClick={toggleSound}
            aria-label={muted ? "Ativar som" : "Desativar som"}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition-all"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
