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

  async function checkInvite(t: string) {
    const { data: invite, error } = await supabase
      .from("invite_tokens")
      .select("*, house:houses(name, property_type)")
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

    const house = invite.house as any;
    setHouseName(house?.name ?? "");
    setPropertyType(house?.property_type ?? "casa");
    setStatus("ready");
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

    // Aceita convites de casas com plano pago (ativo ou trial)
    const validStatuses = ["active", "trialing"];
    if (!house || house.plan === "free" || !validStatuses.includes(house.plan_status)) {
      setError("O dono desta casa precisa ter o Plano Família ativo para convidar membros.");
      setStatus("error");
      return;
    }

    // Verifica se o trial/plano não expirou (proteção extra caso cron não tenha rodado)
    if (house.plan_status === "trialing") {
      const { data: houseExpiry } = await supabase
        .from("houses")
        .select("plan_expires_at")
        .eq("id", invite.house_id)
        .single();
      if (houseExpiry?.plan_expires_at && new Date(houseExpiry.plan_expires_at) < new Date()) {
        setError("O período de teste grátis do dono desta casa expirou.");
        setStatus("error");
        return;
      }
    }

    // Busca dados extras do convite (nome, tipo, parentesco)
    const { data: inviteExtra } = await supabase
      .from("invite_tokens")
      .select("invitee_name, member_type, relation_label")
      .eq("token", token)
      .single();

    // Adiciona como membro com os dados do convite
    await supabase.from("house_members").insert({
      house_id: invite.house_id,
      user_id: user.id,
      role: "member",
      status: "active",
      invited_by: user.id,
      display_name: (inviteExtra as any)?.invitee_name || null,
      member_type: (inviteExtra as any)?.member_type || "familiar",
      relation_label: (inviteExtra as any)?.relation_label || null,
    } as any);

    // Marca token como usado
    await supabase
      .from("invite_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token);

    setStatus("success");
    setTimeout(() => router.push("/home"), 2000);
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
