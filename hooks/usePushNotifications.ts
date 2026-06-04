"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushState = "loading" | "unsupported" | "denied" | "prompt" | "subscribed";

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkState();
  }, []);

  async function checkState() {
    // Verifica suporte
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission;

    if (permission === "denied") {
      setState("denied");
      return;
    }

    // Verifica se já tem subscription ativa
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // RE-SINCRONIZA com o servidor (upsert idempotente). Corrige o bug em que
        // a subscription expira/rotaciona (ou é removida do servidor após um envio
        // com falha 410) e o aparelho continua mostrando "Ativado", mas o servidor
        // fica SEM nenhuma subscription — fazendo o usuário não receber nada.
        // Como o usuário abre o app com frequência, isso se auto-corrige sozinho.
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        }).catch(() => {});
        setState("subscribed");
      } else {
        setState("prompt");
      }
    } catch {
      setState("prompt");
    }
  }

  const subscribe = useCallback(async () => {
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      // Cancela subscription antiga se existir
      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
      }

      // Cria nova subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Salva no servidor
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar subscription no servidor");
      }

      setState("subscribed");
      return true;
    } catch (err: any) {
      console.error("[Push] Erro ao se inscrever:", err);
      setError(err.message ?? "Erro ao ativar notificações");
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Remove do servidor
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        await sub.unsubscribe();
      }

      setState("prompt");
      return true;
    } catch (err: any) {
      console.error("[Push] Erro ao cancelar:", err);
      setError(err.message ?? "Erro ao desativar notificações");
      return false;
    }
  }, []);

  return {
    state,
    error,
    isSupported: state !== "unsupported",
    isSubscribed: state === "subscribed",
    isDenied: state === "denied",
    subscribe,
    unsubscribe,
    refresh: checkState,
  };
}
