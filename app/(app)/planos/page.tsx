"use client";

import { useAppStore } from "@/store/appStore";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/layout/Header";
import { Check, Star, Home, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

const plans = [
  {
    id: "free",
    name: "Grátis",
    price: "R$ 0",
    period: "para sempre",
    highlight: false,
    badge: null,
    features: [
      "1 casa",
      "Apenas você (1 pessoa)",
      "Até 20 itens",
      "Lista compartilhada",
      "Notificação quando alguém marca acabou",
    ],
    notIncluded: [
      "Lembrete diário no celular",
      "Pessoas ilimitadas",
      "Casas ilimitadas",
      "Itens ilimitados",
      "Lembretes recorrentes",
      "Histórico completo",
    ],
    cta: "Plano atual",
    ctaDisabled: true,
    priceId: null,
  },
  {
    id: "monthly",
    name: "Família Mensal",
    price: "R$ 8,90",
    period: "por mês",
    highlight: false,
    badge: "🚀 Preço de lançamento",
    features: [
      "Pessoas ilimitadas",
      "Itens ilimitados",
      "Casas ilimitadas",
      "Lembrete diário no celular",
      "Lembretes recorrentes",
      "Histórico completo",
      "Suporte prioritário",
    ],
    notIncluded: [],
    cta: "Assinar por R$ 8,90/mês",
    ctaDisabled: false,
    priceId: "price_monthly",
  },
  {
    id: "yearly",
    name: "Família Anual",
    price: "R$ 59,90",
    period: "por ano",
    highlight: true,
    badge: "🚀 Lançamento — R$ 4,99/mês",
    features: [
      "Tudo do Mensal",
      "Economize R$ 46,90 por ano",
      "Prioridade em novidades",
      "Suporte prioritário",
    ],
    notIncluded: [],
    cta: "Garantir preço de lançamento",
    ctaDisabled: false,
    priceId: "price_yearly",
  },
];

function PlanosContent() {
  const { currentHouse } = useAppStore();
  const { isTrialing, trialDaysLeft, trialExpired } = useSubscription();
  const currentPlan = currentHouse?.plan ?? "free";
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");
  const status = searchParams.get("status");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Quando volta do Mercado Pago com sucesso, confirma e ativa o plano
  useEffect(() => {
    if (status !== "sucesso") return;

    // Meta Pixel — rastreia compra
    if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
      (window as any).fbq("track", "Purchase", { currency: "BRL", value: 0 });
    }

    // Chama API de confirmação para garantir que o plano foi ativado
    async function confirmPayment() {
      try {
        const res = await fetch("/api/confirmar-pagamento", { method: "POST" });
        const data = await res.json();
        if (data.ok && data.plan) {
          // Atualiza o estado local da casa com o novo plano
          const { setCurrentHouse, currentHouse } = useAppStore.getState();
          if (currentHouse) {
            setCurrentHouse({
              ...currentHouse,
              plan: data.plan,
              plan_status: "active",
              plan_expires_at: data.expires_at,
            });
          }
        }
      } catch (err) {
        console.error("[Confirmar pagamento]", err);
      }
    }

    confirmPayment();
  }, [status]);

  async function handleSubscribe(plan: typeof plans[0]) {
    if (plan.ctaDisabled || !plan.priceId || loadingPlan) return;

    setLoadingPlan(plan.id);

    try {
      const res = await fetch("/api/pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Erro ao iniciar pagamento.");
      }

      // Meta Pixel — rastreia início do checkout
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "InitiateCheckout", {
          content_name: plan.name,
          currency: "BRL",
          value: plan.id === "yearly" ? 59.90 : 8.90,
        });
      }

      // Redireciona para o checkout do Mercado Pago
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message ?? "Erro ao iniciar pagamento. Tente novamente.");
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <Header title="Planos" subtitle="Escolha o melhor para sua casa" showBack />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* Banner de retorno do Mercado Pago */}
        {status === "sucesso" && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-800 text-sm">Pagamento aprovado!</p>
              <p className="text-green-700 text-xs mt-1">
                Seu plano Família foi ativado. Aproveite todos os recursos sem limites!
              </p>
            </div>
          </div>
        )}
        {status === "pendente" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Pagamento em processamento</p>
              <p className="text-amber-700 text-xs mt-1">
                Assim que confirmado, seu plano será ativado automaticamente.
              </p>
            </div>
          </div>
        )}
        {status === "erro" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">😕</span>
            <div>
              <p className="font-semibold text-red-800 text-sm">Pagamento não concluído</p>
              <p className="text-red-700 text-xs mt-1">
                Tente novamente ou escolha outra forma de pagamento.
              </p>
            </div>
          </div>
        )}

        {motivo === "multiplas-casas" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Home size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Casas ilimitadas no Plano Família</p>
              <p className="text-amber-700 text-xs mt-1">
                Para adicionar uma segunda casa (praia, empresa, veraneio etc.), faça upgrade para o Plano Família.
              </p>
            </div>
          </div>
        )}
        {/* Banner de trial */}
        {isTrialing && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-semibold text-blue-800 text-sm">
                Teste grátis — {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Você está aproveitando todos os recursos do Plano Família. Assine antes que acabe!
              </p>
            </div>
          </div>
        )}
        {trialExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="font-semibold text-red-800 text-sm">Seu teste grátis acabou</p>
              <p className="text-red-700 text-xs mt-1">
                Assine agora para continuar com itens ilimitados, convites e todos os recursos.
              </p>
            </div>
          </div>
        )}

        <div className="text-center py-2">
          <p className="text-gray-500 text-sm">
            Plano atual: <span className="font-semibold text-gray-800 capitalize">
              {isTrialing
                ? "Teste grátis (7 dias)"
                : trialExpired
                  ? "Trial expirado"
                  : currentPlan === "free" ? "Grátis" : currentPlan === "monthly" ? "Família Mensal" : "Família Anual"}
            </span>
          </p>
        </div>

        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "bg-white rounded-2xl border shadow-sm overflow-hidden",
              plan.highlight ? "border-green-400 ring-2 ring-green-100" : "border-gray-100"
            )}
          >
            {plan.badge && (
              <div className="bg-green-600 text-white text-center py-1.5 text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1">
                <Star size={12} />
                {plan.badge}
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>
                {currentPlan === plan.id && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Ativo
                  </span>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={16} className="text-green-600 shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-4 text-center shrink-0">—</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={plan.ctaDisabled || currentPlan === plan.id || loadingPlan === plan.id}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                  plan.highlight
                    ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-70"
                    : plan.ctaDisabled || currentPlan === plan.id
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70"
                )}
              >
                {loadingPlan === plan.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Aguarde...
                  </>
                ) : currentPlan === plan.id ? "Plano atual" : plan.cta}
              </button>
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-gray-400 pb-4">
          Cancelamento a qualquer momento. Sem multa.
        </p>
      </div>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin" /></div>}>
      <PlanosContent />
    </Suspense>
  );
}
