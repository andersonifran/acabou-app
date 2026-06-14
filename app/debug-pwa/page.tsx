"use client";

import { useEffect, useState } from "react";

// Página TEMPORÁRIA de diagnóstico offline/PWA. Pública (middleware).
// Objetivo: mostrar se o Service Worker está CONTROLANDO a página e o que está
// guardado no cache — pra descobrir por que o app não abre offline (ERR_FAILED).
export default function DebugPWAPage() {
  const [lines, setLines] = useState<string[]>([]);
  const add = (m: string) => setLines((p) => [...p, m]);

  useEffect(() => {
    (async () => {
      add("ONLINE agora: " + navigator.onLine);
      add("Standalone (instalado/TWA): " + window.matchMedia("(display-mode: standalone)").matches);
      add("UA: " + navigator.userAgent.slice(0, 100));
      add("");

      if (!("serviceWorker" in navigator)) {
        add("❌ Service Worker NÃO suportado neste navegador.");
        return;
      }

      // 1) ESTE é o ponto-chave: o SW está controlando a página?
      const ctrl = navigator.serviceWorker.controller;
      if (ctrl) {
        add("✅ SW CONTROLANDO esta página");
        add("   script: " + ctrl.scriptURL);
      } else {
        add("❌ SW NÃO está controlando esta página (controller = null)");
        add("   → é por isso que offline dá ERR_FAILED (o SW nem intercepta).");
      }
      add("");

      // 2) Registros do SW
      const regs = await navigator.serviceWorker.getRegistrations();
      add("SWs registrados: " + regs.length);
      regs.forEach((r, i) => {
        add(
          "  #" + (i + 1) + " scope=" + r.scope +
          " | active=" + (r.active ? r.active.state : "—") +
          " | waiting=" + (r.waiting ? "SIM" : "não") +
          " | installing=" + (r.installing ? "SIM" : "não")
        );
        if (r.active) add("     activeScript=" + r.active.scriptURL);
      });
      add("");

      // 3) Caches: o que está guardado?
      const names = await caches.keys();
      add("Caches: [" + names.join(", ") + "]");
      for (const n of names) {
        try {
          const c = await caches.open(n);
          const keys = await c.keys();
          const paths = keys.map((req) => {
            try { return new URL(req.url).pathname; } catch { return req.url; }
          });
          const nextCount = paths.filter((p) => p.startsWith("/_next/")).length;
          const has = (p: string) => (paths.includes(p) ? "✅" : "❌");
          add(
            "  [" + n + "] " + keys.length + " itens" +
            " | /home:" + has("/home") +
            " | /:" + has("/") +
            " | manifest:" + has("/manifest.json") +
            " | _next:" + nextCount
          );
        } catch (e) {
          add("  [" + n + "] erro ao ler: " + e);
        }
      }
      add("");
      add("=== fim do diagnóstico — tire um print desta tela ===");
    })().catch((e) => add("❌ ERRO no diagnóstico: " + e));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-green-300 p-4 font-mono text-[13px] leading-relaxed">
      <h1 className="text-white text-lg font-bold mb-3">🔍 Diagnóstico Offline — Acabou?</h1>
      <div className="bg-gray-800 rounded-xl p-4 space-y-1">
        {lines.length === 0 && <p className="text-gray-500">Carregando…</p>}
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line.includes("❌")
                ? "text-red-400 font-bold"
                : line.includes("✅")
                ? "text-green-400"
                : "text-gray-300 break-all"
            }
          >
            {line || " "}
          </p>
        ))}
      </div>
      <p className="text-gray-600 mt-4 text-center">Página temporária — só diagnóstico</p>
    </div>
  );
}
