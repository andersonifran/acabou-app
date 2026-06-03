"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Logo } from "@/components/shared/Logo";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

const PROPERTY_LABELS: Record<string, { label: string; icon: string; preposition: string }> = {
  casa:        { label: "casa",      icon: "🏠", preposition: "na" },
  apartamento: { label: "apê",       icon: "🏢", preposition: "no" },
  praia:       { label: "casa de praia", icon: "🏖️", preposition: "na" },
  veraneio:    { label: "casa de veraneio", icon: "🌲", preposition: "na" },
  empresa:     { label: "empresa",   icon: "💼", preposition: "na" },
  outro:       { label: "local",     icon: "📍", preposition: "no" },
};

export default function ConvitePage({ params }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [houseName, setHouseName] = useState("");
  const [propertyType, setPropertyType] = useState("casa");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      checkInvite(t);
    });
  }, []);

  // Re-verifica quando o usuário volta para a aba (ex: saiu e voltou)
  useEffect(() => {
    if (!token) return;
    function onVisibilityChange() {
      if (document.visibilityState === "visible" && status === "error") {
        checkInvite(token);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [token, status]);

  async function checkInvite(t: string) {
    setStatus("loading");

    try {
      // Leitura no SERVIDOR (rota com admin client) — a tabela invite_tokens
      // não é mais lida direto pelo cliente (evita listar todos os tokens).
      const res = await fetch(`/api/convite/info?token=${encodeURIComponent(t)}`);
      const data = await res.json();

      if (!data.valid) {
        setError(data.reason ?? "Link de convite inválido ou expirado.");
        setStatus("error");
        return;
      }

      setHouseName(data.houseName ?? "");
      setPropertyType(data.propertyType ?? "casa");
      setStatus("ready");
    } catch (err) {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setStatus("error");
    }
  }

  async function handleAccept() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Salva o token em cookie + localStorage como fallback para Google OAuth
      document.cookie = `acabou_pending_invite=${token}; path=/; max-age=3600; SameSite=Lax`;
      localStorage.setItem("acabou_pending_invite", token);
      router.push(`/cadastro?convite=${token}`);
      return;
    }

    // Aceite no SERVIDOR (admin client) — todas as validações (token, plano,
    // expiração, já-é-membro) acontecem lá, sem dar pra burlar pelo cliente.
    try {
      const res = await fetch("/api/convite/aceitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível aceitar o convite.");
        setStatus("error");
        return;
      }

      if (data.alreadyMember) {
        router.push("/home");
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/home"), 2000);
    } catch (err) {
      setError("Erro ao aceitar convite. Tente novamente.");
      setStatus("error");
    }
  }

  // Monta a frase com base no tipo de imóvel
  const prop = PROPERTY_LABELS[propertyType] || PROPERTY_LABELS.outro;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <Logo size="md" />
      </div>

      {status === "loading" && <LoadingSpinner size="lg" text="Verificando convite..." />}

      {status === "ready" && (
        <div className="max-w-sm w-full">
          <div className="text-5xl mb-4">{prop.icon}</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Você foi convidado!</h2>

          {/* Nome do local em destaque */}
          {houseName && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 mb-4 inline-block">
              <p className="text-sm text-gray-500">Para {prop.preposition}</p>
              <p className="text-lg font-bold text-gray-900">{prop.icon} {houseName}</p>
            </div>
          )}

          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Entre no app <strong className="text-gray-700">Acabou?</strong> e acompanhe a lista de compras compartilhada deste local em tempo real.
          </p>

          <button
            onClick={handleAccept}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors text-base shadow-lg shadow-green-200"
          >
            Aceitar convite
          </button>
          <Link href="/" className="block mt-4 text-gray-400 text-sm hover:text-gray-600">
            Não tenho interesse
          </Link>
        </div>
      )}

      {status === "success" && (
        <div className="max-w-sm w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Pronto!</h2>
          <p className="text-gray-500">
            Você entrou {prop.preposition} <strong className="text-gray-700">{houseName || "o local"}</strong>. Redirecionando...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => token && checkInvite(token)}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors text-base mb-3"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="block text-gray-400 text-sm hover:text-gray-600"
          >
            Ir para o início
          </Link>
        </div>
      )}
    </div>
  );
}
