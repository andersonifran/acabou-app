"use client";

import { useEffect, useState } from "react";

interface DebugInfo {
  ua?: string;
  isStandalone?: boolean;
  hasSW?: boolean;
  promptCaptured?: boolean;
  swRegistrations?: number;
  swScopes?: string[];
  swFileStatus?: number | string;
  swContentType?: string | null;
  manifestStatus?: number | string;
  promptFiredNow?: boolean;
  readyState?: string;
}

export default function DebugPWAPage() {
  const [info, setInfo] = useState<DebugInfo>({});
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((prev) => [...prev, `${new Date().toISOString().slice(11, 23)} — ${msg}`]);
  }

  useEffect(() => {
    const ua = navigator.userAgent;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const hasSW = "serviceWorker" in navigator;
    const promptCaptured = !!(window as any).__pwaPrompt;

    setInfo({ ua, isStandalone, hasSW, promptCaptured, readyState: document.readyState });
    addLog(`UA: ${ua.slice(0, 80)}`);
    addLog(`Standalone: ${isStandalone} | SW suportado: ${hasSW}`);
    addLog(`__pwaPrompt capturado: ${promptCaptured}`);
    addLog(`document.readyState: ${document.readyState}`);

    // Checa registros SW
    if (hasSW) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setInfo((p) => ({ ...p, swRegistrations: regs.length, swScopes: regs.map((r) => r.scope) }));
        addLog(`SWs registrados: ${regs.length} — ${regs.map((r) => r.scope + "(" + (r.active?.state ?? "sem ativo") + ")").join(", ")}`);
        if (regs.length === 0) addLog("⚠️ NENHUM SERVICE WORKER REGISTRADO! Este é o problema.");
      });
    }

    // Checa arquivo sw.js
    fetch("/sw.js", { cache: "no-store" })
      .then((r) => {
        const ct = r.headers.get("content-type");
        setInfo((p) => ({ ...p, swFileStatus: r.status, swContentType: ct }));
        addLog(`/sw.js: HTTP ${r.status} | Content-Type: ${ct}`);
        if (r.status !== 200) addLog("❌ sw.js não está sendo servido corretamente!");
      })
      .catch((e) => {
        setInfo((p) => ({ ...p, swFileStatus: "ERRO" }));
        addLog(`❌ Erro ao buscar /sw.js: ${e}`);
      });

    // Checa manifest.json
    fetch("/manifest.json", { cache: "no-store" })
      .then((r) => {
        setInfo((p) => ({ ...p, manifestStatus: r.status }));
        addLog(`/manifest.json: HTTP ${r.status}`);
      })
      .catch((e) => {
        setInfo((p) => ({ ...p, manifestStatus: "ERRO" }));
        addLog(`❌ Erro ao buscar /manifest.json: ${e}`);
      });

    // Escuta se o evento chegar durante esta página
    const handler = (e: Event) => {
      e.preventDefault();
      setInfo((p) => ({ ...p, promptFiredNow: true }));
      addLog("✅ beforeinstallprompt DISPAROU enquanto você estava nesta página!");
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Tenta registrar o SW manualmente desta página
    if (hasSW) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          addLog(`SW register() chamado: scope=${reg.scope} estado=${reg.active?.state ?? "aguardando"}`);
        })
        .catch((err) => {
          addLog(`❌ SW register() ERRO: ${err}`);
        });
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-green-300 p-4 font-mono text-xs">
      <h1 className="text-white text-lg font-bold mb-4">🔍 PWA Debug — Acabou?</h1>

      <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-1">
        <p><span className="text-gray-400">Standalone (já instalado):</span> <span className={info.isStandalone ? "text-green-400" : "text-yellow-400"}>{String(info.isStandalone)}</span></p>
        <p><span className="text-gray-400">Service Worker suportado:</span> <span className={info.hasSW ? "text-green-400" : "text-red-400"}>{String(info.hasSW)}</span></p>
        <p><span className="text-gray-400">SWs registrados:</span> <span className={info.swRegistrations === 0 ? "text-red-400 font-bold" : "text-green-400"}>{info.swRegistrations ?? "..."}</span></p>
        <p><span className="text-gray-400">/sw.js HTTP status:</span> <span className={info.swFileStatus === 200 ? "text-green-400" : "text-red-400"}>{info.swFileStatus ?? "..."}</span></p>
        <p><span className="text-gray-400">/manifest.json status:</span> <span className={info.manifestStatus === 200 ? "text-green-400" : "text-red-400"}>{info.manifestStatus ?? "..."}</span></p>
        <p><span className="text-gray-400">__pwaPrompt capturado:</span> <span className={info.promptCaptured ? "text-green-400" : "text-yellow-400"}>{String(info.promptCaptured)}</span></p>
        <p><span className="text-gray-400">Prompt disparou agora:</span> <span className={info.promptFiredNow ? "text-green-400 font-bold" : "text-gray-500"}>{String(info.promptFiredNow ?? false)}</span></p>
      </div>

      <div className="bg-gray-800 rounded-xl p-4 mb-4">
        <p className="text-white font-bold mb-2">Log em tempo real:</p>
        {log.map((line, i) => (
          <p key={i} className={line.includes("❌") || line.includes("⚠️") ? "text-red-400" : line.includes("✅") ? "text-green-400" : "text-gray-300"}>
            {line}
          </p>
        ))}
        {log.length === 0 && <p className="text-gray-500">Carregando...</p>}
      </div>

      <div className="bg-gray-800 rounded-xl p-3">
        <p className="text-gray-400 break-all">{info.ua}</p>
      </div>

      <p className="text-gray-600 mt-4 text-center">Esta página é temporária — só para diagnóstico</p>
    </div>
  );
}
