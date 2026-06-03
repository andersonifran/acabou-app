"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

/**
 * Vídeo de demonstração na landing — 9:16 em moldura de celular.
 * NÃO toca sozinho: mostra a capa com ▶️ e só inicia ao clicar (com som).
 * Depois de iniciado: tocar no vídeo pausa/retoma; botões de pausar e de som.
 * Proporção fixa (aspect-[9/16]) evita "pulo" de layout (CLS).
 */
export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  function startVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    v.play().catch(() => {});
    setStarted(true);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
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
          className="w-full aspect-[9/16] object-cover rounded-[1.5rem] block bg-gray-900"
          loop
          playsInline
          preload="metadata"
          poster="/web-app-manifest-512x512.png"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => { if (started) togglePlay(); }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src="/video-hero.mp4" type="video/mp4" />
        </video>

        {/* Capa com botão de play — antes de iniciar */}
        {!started && (
          <button
            onClick={startVideo}
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

        {/* Indicador de "pausado" (visual; o clique vai pro vídeo, que retoma) */}
        {started && !playing && (
          <div className="absolute inset-2 rounded-[1.5rem] flex items-center justify-center bg-black/25 pointer-events-none">
            <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play size={28} className="text-green-600 fill-green-600 ml-1" />
            </span>
          </div>
        )}

        {/* Controles — depois de iniciar */}
        {started && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pausar" : "Reproduzir"}
              className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition-all"
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={toggleSound}
              aria-label={muted ? "Ativar som" : "Desativar som"}
              className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition-all"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
