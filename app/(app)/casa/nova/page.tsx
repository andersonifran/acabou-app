"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = [
  { id: "casa",        label: "Casa",        icon: "🏠", desc: "Residência principal" },
  { id: "apartamento", label: "Apartamento", icon: "🏢", desc: "Apartamento / apê" },
  { id: "praia",       label: "Praia",       icon: "🏖️", desc: "Casa de praia" },
  { id: "veraneio",    label: "Veraneio",    icon: "🌲", desc: "Sítio / campo / chácara" },
  { id: "empresa",     label: "Empresa",     icon: "💼", desc: "Escritório / negócio" },
  { id: "outro",       label: "Outro",       icon: "📍", desc: "Outro tipo de local" },
];

export default function NovaCasaPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, allHouses, setAllHouses } = useAppStore();

  const [isPaid, setIsPaid] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [houseName, setHouseName] = useState("");
  const [propertyType, setPropertyType] = useState("casa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Verifica plano direto no banco (não no store que pode estar desatualizado)
    async function checkPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      // Verifica se QUALQUER casa do usuário tem plano pago
      const { data: paidHouse } = await supabase
        .from("houses")
        .select("plan")
        .eq("owner_id", user.id)
        .in("plan", ["monthly", "yearly"])
        .limit(1)
        .maybeSingle();

      const paid = !!paidHouse;
      setIsPaid(paid);
      setCheckingPlan(false);

      if (!paid) {
        router.replace("/planos?motivo=multiplas-casas");
      }
    }
    checkPlan();
  }, []);

  async function handleCreate() {
    if (!houseName.trim()) { setError("Informe o nome do local."); return; }
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const res = await fetch("/api/criar-casa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          houseName: houseName.trim(),
          propertyType,
          fullName: "",
          phone: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao criar.");
      }

      const data = await res.json();

      // Adiciona a nova casa na lista
      const { data: newHouse } = await supabase
        .from("houses").select("*").eq("id", data.houseId).single();

      if (newHouse) {
        setAllHouses([...allHouses, newHouse as any]);
      }

      // Vai para o onboarding da nova casa ou direto para home
      router.push("/home");
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar local.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingPlan || !isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Header title="Adicionar novo local" showBack />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Tipo */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Que tipo de local é esse?</p>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPropertyType(p.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-3.5 rounded-2xl border-2 transition-all",
                  propertyType === p.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-200"
                )}
              >
                <span className="text-2xl">{p.icon}</span>
                <span className={cn("text-xs font-semibold", propertyType === p.id ? "text-green-700" : "text-gray-600")}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {PROPERTY_TYPES.find(p => p.id === propertyType)?.desc}
          </p>
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nome do local *
          </label>
          <input
            type="text"
            value={houseName}
            onChange={(e) => setHouseName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Ex: Casa de Praia, Empresa, Apê..."
            maxLength={60}
            autoFocus
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-green-400 focus:bg-white transition-colors text-gray-900"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !houseName.trim()}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-60 text-base shadow-md shadow-green-200"
        >
          {loading ? "Criando..." : `Criar ${PROPERTY_TYPES.find(p => p.id === propertyType)?.label}`}
        </button>

        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-800 text-center">
            ✅ Plano Família — locais ilimitados incluídos
          </p>
        </div>
      </div>
    </div>
  );
}
