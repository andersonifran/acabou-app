"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { LocationIcon } from "@/components/shared/LocationIcon";
import { cn } from "@/lib/utils";

function hasPaidHouse(houses: any[]): boolean {
  return houses.some(
    (h) =>
      (h.plan === "monthly" || h.plan === "yearly") &&
      (h.plan_status === "active" || h.plan_status === "trialing")
  );
}

const PROPERTY_TYPES = [
  { id: "casa",        label: "Casa",        desc: "Residência principal" },
  { id: "apartamento", label: "Apartamento", desc: "Apartamento / apê" },
  { id: "praia",       label: "Praia",       desc: "Casa de praia" },
  { id: "veraneio",    label: "Veraneio",    desc: "Sítio / campo / chácara" },
  { id: "empresa",     label: "Empresa",     desc: "Escritório / negócio" },
  { id: "outro",       label: "Outro",       desc: "Outro tipo de local" },
];

export default function NovaCasaPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentHouse, allHouses, setAllHouses } = useAppStore();

  const isPaid = hasPaidHouse(allHouses);
  const [houseName, setHouseName] = useState("");
  const [propertyType, setPropertyType] = useState("casa");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPaid) {
      router.replace("/planos?motivo=multiplas-casas");
    }
  }, [isPaid, router]);

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

      // Adiciona a nova casa na lista do store
      const { data: newHouse } = await supabase
        .from("houses").select("*").eq("id", data.houseId).single();

      if (newHouse) {
        setAllHouses([...allHouses, newHouse as any]);
      }

      // Redireciona para onboarding com o houseId + propertyType para selecionar itens
      router.push(`/onboarding?houseId=${data.houseId}&type=${propertyType}`);
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar local.");
    } finally {
      setLoading(false);
    }
  }

  if (!isPaid) return null;

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
                  "flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all active:scale-95",
                  propertyType === p.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-200"
                )}
              >
                <LocationIcon type={p.id} size={52} className={cn("transition-transform", propertyType === p.id && "scale-110")} />
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
