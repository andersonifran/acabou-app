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
        // RE-SINCRONIZA com o servidor (upsert idempotente). Corrige o caso em que
        // a subscription expira/rotaciona (ou é removida do servidor após um envio
        // com falha 410) e o aparelho continua mostrando "Ativado", mas o servidor
        // fica SEM nenhuma subscription. Como o usuário abre o app com frequência,
        // isso se auto-corrige sozinho.
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        }).catch(() => {});
        setState("subscribed");
        return;
      }

      // SEM subscription no aparelho, MAS o usuário JÁ concedeu a permissão → a
      // inscrição se PERDEU (rotação/expiração/reinstalação/limpeza). AUTO-CURA:
      // recria em SILÊNCIO e re-salva no servidor, sem obrigar o usuário a
      // reativar na mão. É o que evita o "parou de receber e não volta sozinho".
      if (Notification.permission === "granted") {
        try {
          const fresh = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
          });
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: fresh.toJSON() }),
          });
          setState("subscribed");
          return;
        } catch {
          // subscribe() falhou → notificações bloqueadas no SISTEMA (não dá pra
          // recriar pela web). Mostra o convite de reativar (com instrução).
          setState("prompt");
          return;
        }
      }

      // Nunca concedeu permissão ainda → mostra o convite normal.
      setState("prompt");
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
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource;

      // Remove QUALQUER inscrição antiga — do SERVIDOR e do navegador — antes de
      // criar a nova. Sem isso, o aparelho podia ficar preso numa inscrição MORTA
      // (410) ou com chave VAPID antiga, e o re-cadastro falhava (caso real no
      // S24 após trocar PWA↔TWA). Limpar primeiro garante uma inscrição fresca.
      const old = await reg.pushManager.getSubscription();
      if (old) {
        try {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: old.endpoint }),
          });
        } catch {}
        try { await old.unsubscribe(); } catch {}
      }

      // Cria nova subscription. Se falhar por já existir uma com outra chave
      // (InvalidStateError), limpa o que sobrou e tenta UMA vez mais.
      let subscription: PushSubscription;
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      } catch {
        const leftover = await reg.pushManager.getSubscription();
        if (leftover) { try { await leftover.unsubscribe(); } catch {} }
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

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
