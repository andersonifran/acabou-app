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

export default function ConvitePage({ params }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [houseName, setHouseName] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      checkInvite(t);
    });
  }, []);

  async function checkInvite(t: string) {
    const { data: invite, error } = await supabase
      .from("invite_tokens")
      .select("*, house:houses(name)")
      .eq("token", t)
      .is("used_at", null)
      .single();

    if (error || !invite) {
      setError("Link de convite inválido ou expirado.");
      setStatus("error");
      return;
    }

    if (new Date(invite.expires_at) < new Date()) {
      setError("Este link de convite expirou.");
      setStatus("error");
      return;
    }

    setHouseName((invite.house as any)?.name ?? "Casa");
    setStatus("ready");
  }

  async function handleAccept() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/cadastro?convite=${token}`);
      return;
    }

    const { data: invite } = await supabase
      .from("invite_tokens")
      .select("house_id")
      .eq("token", token)
      .single();

    if (!invite) { setError("Convite inválido."); setStatus("error"); return; }

    // Verifica se já é membro
    const { data: existing } = await supabase
      .from("house_members")
      .select("id")
      .eq("house_id", invite.house_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      router.push("/home");
      return;
    }

    // Verifica se a casa tem plano pago (convites são do Plano Família)
    const { data: house } = await supabase
      .from("houses")
      .select("plan, plan_status")
      .eq("id", invite.house_id)
      .single();

    if (!house || house.plan === "free" || house.plan_status !== "active") {
      setError("O dono desta casa precisa ter o Plano Família ativo para convidar membros.");
      setStatus("error");
      return;
    }

    // Adiciona como membro
    await supabase.from("house_members").insert({
      house_id: invite.house_id,
      user_id: user.id,
      role: "member",
      status: "active",
      invited_by: user.id,
    });

    // Marca token como usado
    await supabase
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    setStatus("success");
    setTimeout(() => router.push("/home"), 2000);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <Logo size="md" />
      </div>

      {status === "loading" && <LoadingSpinner size="lg" text="Verificando convite..." />}

      {status === "ready" && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Você foi convidado!</h2>
          <p className="text-gray-500 mb-6">
            Entrar na casa <strong>{houseName}</strong> e ver a lista compartilhada.
          </p>
          <button
            onClick={handleAccept}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors text-base"
          >
            Aceitar convite
          </button>
          <Link href="/" className="block mt-4 text-gray-400 text-sm hover:text-gray-600">
            Não tenho interesse
          </Link>
        </div>
      )}

      {status === "success" && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pronto!</h2>
          <p className="text-gray-500">Você entrou na casa. Redirecionando...</p>
        </div>
      )}

      {status === "error" && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link
            href="/"
            className="block bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors text-base"
          >
            Ir para o início
          </Link>
        </div>
      )}
    </div>
  );
}
