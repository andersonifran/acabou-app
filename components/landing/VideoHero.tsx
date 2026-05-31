"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Vídeo de demonstração na landing — 9:16 em moldura de celular.
 * Autoplay mudo em loop (exigência dos navegadores) com botão
 * opcional para ativar o som, já que parte dos usuários gosta de ouvir.
 */
export function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      // Ao ativar o som, garante que está tocando
      v.play().catch(() => {});
    }
    setMuted(next);
  }

  return (
    <div className="mx-auto max-w-[280px]">
      <div className="relative rounded-[2rem] bg-gray-900 p-2 shadow-2xl shadow-green-200/50">
        <video
          ref={videoRef}
          className="w-full rounded-[1.5rem] block"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/video-hero.mp4" type="video/mp4" />
        </video>

        {/* Botão de som opcional */}
        <button
          onClick={toggleSound}
          aria-label={muted ? "Ativar som" : "Desativar som"}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition-all"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  );
}
