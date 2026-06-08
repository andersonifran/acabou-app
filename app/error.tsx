"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";

// Rede de segurança: se QUALQUER tela der um erro de renderização, em vez de
// "tela branca" o usuário vê uma tela amigável com botão de recuperar. Os dados
// ficam salvos (localStorage). Estilos inline (não dependem de CSS externo) pra
// funcionar mesmo se o erro for no carregamento de estilos.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Loga pro Sentry/console (não quebra se Sentry não estiver disponível)
    console.error("[Acabou? Error Boundary]", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 24px",
        gap: 14,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        background: "#ffffff",
        color: "#111827",
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 22,
          background: "#1E9839",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          boxShadow: "0 10px 24px rgba(30,152,57,.3)",
        }}
        aria-hidden
      >
        🛒
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 0" }}>Ops, algo deu errado</h1>
      <p style={{ color: "#6b7280", maxWidth: 340, lineHeight: 1.6, margin: 0, fontSize: 15 }}>
        Tivemos um errinho ao carregar a tela. Não se preocupe — seus dados estão salvos.
        É só tentar de novo. 💚
      </p>
      <button
        onClick={() => unstable_retry()}
        style={{
          marginTop: 10,
          background: "#1E9839",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          padding: "14px 38px",
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Tentar novamente
      </button>
      <button
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
        style={{
          background: "transparent",
          color: "#6b7280",
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 2,
        }}
      >
        Recarregar o app
      </button>
    </div>
  );
}
