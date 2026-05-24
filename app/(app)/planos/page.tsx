"use client";

import { useAppStore } from "@/store/appStore";
import { Header } from "@/components/layout/Header";
import { Check, Star, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
      "Até 2 pessoas",
      "Até 40 itens",
      "Lista de compras compartilhada",
      "Categorias básicas",
    ],
    notIncluded: ["Pessoas ilimitadas", "Itens ilimitados", "Lembretes recorrentes", "Histórico completo"],
    cta: "Plano atual",
    ctaDisabled: true,
    priceId: null,
  },
  {
    id: "monthly",
    name: "Família Mensal",
    price: "R$ 9,90",
    period: "por mês",
    highlight: false,
    badge: null,
    features: [
      "Pessoas ilimitadas",
      "Itens ilimitados",
      "Todas as categorias",
      "Lembretes recorrentes",
      "Histórico completo",
      "Suporte prioritário",
    ],
    notIncluded: [],
    cta: "Assinar por R$ 9,90/mês",
    ctaDisabled: false,
    priceId: "price_monthly", // ← substitua pelo seu Price ID do Mercado Pago
  },
  {
    id: "yearly",
    name: "Família Anual",
    price: "R$ 79,90",
    period: "por ano",
    highlight: true,
    badge: "Melhor escolha",
    features: [
      "Tudo do Plano Mensal",
      "Equivale a R$ 6,66/mês",
      "2 meses grátis",
    ],
    notIncluded: [],
    cta: "Assinar por R$ 79,90/ano",
    ctaDisabled: false,
    priceId: "price_yearly", // ← substitua pelo seu Price ID do Mercado Pago
  },
];

function PlanosContent() {
  const { currentHouse } = useAppStore();
  const currentPlan = currentHouse?.plan ?? "free";
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");

  async function handleSubscribe(plan: typeof plans[0]) {
    if (plan.ctaDisabled || !plan.priceId) return;

    // =============================================
    // TODO: Integração com Mercado Pago
    // =============================================
    // 1. Chame sua API: POST /api/pagamento/criar-assinatura
    //    Body: { house_id: currentHouse?.id, plan: plan.id }
    //
    // 2. A API cria uma preferência no Mercado Pago com:
    //    - MERCADOPAGO_ACCESS_TOKEN (variável de ambiente)
    //    - Redirect URLs para /planos?status=sucesso e /planos?status=erro
    //
    // 3. Redirecione o usuário para o link de pagamento retornado
    //
    // Exemplo de código para a API route (app/api/pagamento/route.ts):
    // import MercadoPago from 'mercadopago';
    // const mp = new MercadoPago({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
    // const preference = await mp.preferences.create({ ... });
    // return NextResponse.json({ url: preference.body.init_point });
    // =============================================

    alert(
      `Integração com Mercado Pago em breve!\n\nPara ativar:\n1. Configure MERCADOPAGO_ACCESS_TOKEN no .env.local\n2. Implemente /api/pagamento/route.ts\n3. Substitua este alert pelo redirecionamento`
    );
  }

  return (
    <div>
      <Header title="Planos" subtitle="Escolha o melhor para sua casa" showBack />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
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
        <div className="text-center py-2">
          <p className="text-gray-500 text-sm">
            Plano atual: <span className="font-semibold text-gray-800 capitalize">
              {currentPlan === "free" ? "Grátis" : currentPlan === "monthly" ? "Família Mensal" : "Família Anual"}
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
                disabled={plan.ctaDisabled || currentPlan === plan.id}
                className={cn(
                  "w-full py-3.5 rounded-xl font-semibold text-sm transition-all",
                  plan.highlight
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : plan.ctaDisabled || currentPlan === plan.id
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                )}
              >
                {currentPlan === plan.id ? "Plano atual" : plan.cta}
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
