"use client";

import { useAppStore } from "@/store/appStore";
import { useSubscription } from "@/hooks/useSubscription";
import { Header } from "@/components/layout/Header";
import { CheckoutTransition } from "@/components/shared/CheckoutTransition";
import { PaymentTrust } from "@/components/shared/PaymentTrust";
import { PlayStoreTrust } from "@/components/shared/PlayStoreTrust";
import { isPlayBillingAvailable, purchaseSubscription } from "@/lib/play-billing";
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
      "Até 10 itens",
      "Lista de compras automática",
    ],
    notIncluded: [
      "Compartilhar lista no WhatsApp",
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
    price: "R$ 6,90",
    period: "por mês",
    highlight: false,
    badge: "🚀 Preço de lançamento",
    features: [
      "Pessoas ilimitadas",
      "Itens ilimitados",
      "Casas ilimitadas",
      "Compartilhar lista no WhatsApp",
      "Lembrete diário no celular",
      "Lembretes recorrentes",
      "Histórico completo",
      "Suporte prioritário",
    ],
    notIncluded: [],
    cta: "Assinar por R$ 6,90/mês",
    ctaDisabled: false,
    priceId: "price_monthly",
  },
  {
    id: "yearly",
    name: "Família Anual",
    price: "R$ 39,90",
    period: "por ano",
    highlight: true,
    badge: "🚀 Lançamento — R$ 3,32/mês",
    features: [
      "Tudo do Mensal",
      "Economize R$ 42,90 por ano",
      "Prioridade em novidades",
      "Suporte prioritário",
    ],
    notIncluded: [],
    cta: "Garantir preço de lançamento",
    ctaDisabled: false,
    priceId: "price_yearly",
  },
];

function formatDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function PlanosContent() {
  const { currentHouse } = useAppStore();
  const { isTrialing, trialDaysLeft, trialExpired, isPaid, isFrozen, rawPlan } = useSubscription();
  const currentPlan = currentHouse?.plan ?? "free";
  const planStatus = currentHouse?.plan_status ?? "active";
  const planExpiresAt = currentHouse?.plan_expires_at ?? null;
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");
  const status = searchParams.get("status");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  // Tela-ponte de confiança do Mercado Pago — só aparece no fluxo WEB/PWA.
  // No app Android (Google Play Billing) NÃO mostramos (o sheet nativo do Google
  // aparece por cima; mostrar a marca do MP ali seria errado).
  const [mpCheckout, setMpCheckout] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Está rodando DENTRO do app da Play Store (TWA com Play Billing)?
  // Se sim, NÃO mostramos nada do Mercado Pago (exigência do Google: app da Loja
  // só pode usar/mostrar o pagamento do Google). Web/PWA continua com Mercado Pago.
  const [isTwa, setIsTwa] = useState(false);
  // twaChecked = a detecção de TWA já resolveu? Enquanto não resolve, NÃO
  // mostramos nenhum selo de pagamento — assim o Mercado Pago nunca pisca dentro
  // do app da Play Store antes de virar o selo do Google (compliance).
  const [twaChecked, setTwaChecked] = useState(false);
  useEffect(() => {
    isPlayBillingAvailable()
      .then(setIsTwa)
      .catch(() => setIsTwa(false))
      .finally(() => setTwaChecked(true));
  }, []);

  // Assinatura recorrente paga e ativa (não trial) → pode cancelar
  const hasActiveSubscription = isPaid && !isTrialing && (rawPlan === "monthly" || rawPlan === "yearly");
  const isCancelledButActive = hasActiveSubscription && planStatus === "cancelled";
  // Plano pago de verdade e ATIVO (não trial, não cancelado) → é o "Plano atual"
  // que trava o botão. Em teste grátis o plano fica monthly/trialing, mas o
  // usuário PRECISA poder assinar pra converter — então não travamos.
  const isActivePaidPlan = isPaid && !isTrialing && planStatus === "active";

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await fetch("/api/cancelar-assinatura", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cancelar.");

      const store = useAppStore.getState();
      if (store.currentHouse) {
        store.setCurrentHouse({ ...store.currentHouse, plan_status: "cancelled" });
      }
      setCancelOpen(false);
    } catch (err: any) {
      alert(err.message ?? "Erro ao cancelar. Tente novamente.");
    } finally {
      setCancelling(false);
    }
  }

  // Pré-carrega as imagens da tela-ponte de checkout (Sacolino + logo MP)
  // para evitar o "flash"/travada no PRIMEIRO clique em assinar.
  useEffect(() => {
    ["/mascote/sacolino-feliz.png", "/mercadopago/mp-horizontal.png"].forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

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

    // ─────────────────────────────────────────────────────────────
    // 1) APP ANDROID (TWA com Play Billing) → Google Play (exigência do Google)
    // ─────────────────────────────────────────────────────────────
    try {
      if (await isPlayBillingAvailable()) {
        let purchase;
        try {
          purchase = await purchaseSubscription(plan.id as "monthly" | "yearly");
        } catch (err: any) {
          // Usuário fechou o sheet do Google sem comprar → não é erro.
          if (err?.name === "AbortError") { setLoadingPlan(null); return; }
          throw err;
        }
        // null = compra cancelada / sem token → reseta sem alarde (pode tentar de novo).
        if (!purchase) { setLoadingPlan(null); return; }

        // O BACKEND valida com o Google e libera o premium (anti-burla — nunca
        // confiamos no cliente). plan_expires_at = data REAL devolvida pelo Google.
        const res = await fetch("/api/play-billing/verificar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(purchase),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.active) {
          throw new Error(
            data.error ??
              "Não conseguimos confirmar sua assinatura agora. Se você foi cobrado, abra o app novamente em instantes — vamos liberar automaticamente."
          );
        }

        // Sucesso → recarrega já premium. Reusa o fluxo de sucesso existente
        // (confirmar-pagamento dá curto-circuito em 'plano já ativo' e NEM toca
        // no Mercado Pago, então é seguro pro Google).
        window.location.href = "/planos?status=sucesso";
        return;
      }
    } catch (err: any) {
      alert(err.message ?? "Erro ao processar a assinatura. Tente novamente.");
      setLoadingPlan(null);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // 2) WEB / PWA (navegador) → Mercado Pago (fluxo atual)
    // ─────────────────────────────────────────────────────────────
    setMpCheckout(true);
    const startedAt = Date.now();

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
          value: plan.id === "yearly" ? 39.90 : 6.90,
        });
      }

      // Mantém a tela-ponte de confiança visível por ~1,5s para o usuário
      // registrar os selos de segurança antes de ir ao Mercado Pago.
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, 1500 - elapsed);
      setTimeout(() => { window.location.href = data.url; }, wait);
    } catch (err: any) {
      alert(err.message ?? "Erro ao iniciar pagamento. Tente novamente.");
      setLoadingPlan(null);
      setMpCheckout(false);
    }
  }

  const checkoutPlan = plans.find((p) => p.id === loadingPlan);

  return (
    <div>
      {mpCheckout && checkoutPlan && <CheckoutTransition planName={checkoutPlan.name} price={checkoutPlan.price} />}

      {/* Modal de confirmação de cancelamento */}
      {cancelOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => !cancelling && setCancelOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-2">🤔</div>
              <h3 className="font-bold text-gray-900 text-lg">Cancelar assinatura?</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                Você não será mais cobrado. Mas{" "}
                <strong>continua com acesso completo até {formatDate(planExpiresAt)}</strong> —
                depois sua casa volta ao plano grátis.
              </p>
            </div>
            <div className="mt-5 space-y-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Cancelando...
                  </>
                ) : "Sim, cancelar assinatura"}
              </button>
              <button
                onClick={() => setCancelOpen(false)}
                disabled={cancelling}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Manter minha assinatura
              </button>
            </div>
          </div>
        </div>
      )}

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

        {motivo === "multiplas-casas" && !trialExpired && !isFrozen && (
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
            Plano atual: <span className="font-semibold text-gray-800">
              {isTrialing
                ? "Teste grátis (14 dias)"
                : trialExpired
                  ? "Trial expirado"
                  : isFrozen
                    ? "Grátis (plano expirou)"
                    : currentPlan === "free" ? "Grátis" : currentPlan === "monthly" ? "Família Mensal" : "Família Anual"}
            </span>
          </p>
        </div>

        {/* Plano pago congelado (expirou). NÃO mostra junto do banner de trial
            expirado — seria redundante (os dois dizem "acabou, assine"). */}
        {isFrozen && !trialExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold text-red-800 text-sm">Seu plano expirou</p>
              <p className="text-red-700 text-xs mt-1">
                Seus dados estão guardados. Assine de novo para desbloquear itens ilimitados e os convidados.
              </p>
            </div>
          </div>
        )}

        {/* Gerenciar assinatura recorrente */}
        {hasActiveSubscription && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {isCancelledButActive ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🗓️</span>
                  <h3 className="font-bold text-gray-900 text-sm">Assinatura cancelada</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Você continua com acesso completo até <strong>{formatDate(planExpiresAt)}</strong>.
                  Depois dessa data, sua casa volta para o plano grátis (seus dados ficam guardados).
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Mudou de ideia? É só assinar de novo abaixo — a cobrança só começa no fim do período atual.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🔄</span>
                  <h3 className="font-bold text-gray-900 text-sm">Assinatura ativa</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Renova automaticamente em <strong>{formatDate(planExpiresAt)}</strong>. Pode cancelar quando quiser, sem multa.
                </p>
                <button
                  onClick={() => {
                    if (isTwa) {
                      // App da Play Store: o cancelamento é gerenciado pelo Google.
                      window.open(
                        "https://play.google.com/store/account/subscriptions?package=br.com.acabouapp.www.twa",
                        "_blank"
                      );
                    } else {
                      setCancelOpen(true);
                    }
                  }}
                  className="mt-3 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
                >
                  Cancelar assinatura
                </button>
              </>
            )}
          </div>
        )}

        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "bg-white rounded-2xl border overflow-hidden",
              plan.highlight ? "border-green-500 pulse-glow relative z-10" : "border-gray-200 shadow-sm"
            )}
          >
            {plan.badge && (
              <div className="planos-launch-badge bg-green-600 text-white text-center py-1.5 text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1">
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
                {currentPlan === plan.id && (isActivePaidPlan || isCancelledButActive) && (
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full",
                    isCancelledButActive ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                  )}>
                    {isCancelledButActive ? "Cancelada" : "Ativo"}
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

              {(() => {
                const isCurrent = currentPlan === plan.id;
                // Plano cancelado mas ainda no período pago → permite reativar
                const showReactivate = isCancelledButActive && isCurrent;
                // Só trava como "Plano atual" se for plano pago ATIVO de verdade.
                // Em teste grátis (monthly/trialing) o botão fica liberado p/ assinar.
                const lockedAsCurrent = isCurrent && isActivePaidPlan && !showReactivate;
                // O card "Grátis" só diz "Plano atual" quando o usuário REALMENTE
                // está no grátis. Se ele é pagante/trial, vira só "Plano grátis"
                // (não pode aparecer "Plano atual" em dois cards ao mesmo tempo).
                const ctaText =
                  plan.id === "free"
                    ? currentPlan === "free" && !isTrialing
                      ? "Plano atual"
                      : "Plano grátis"
                    : plan.cta;
                return (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={plan.ctaDisabled || lockedAsCurrent || loadingPlan === plan.id}
                    className={cn(
                      "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
                      showReactivate
                        ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-70"
                        : plan.highlight
                        ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-70"
                        : plan.ctaDisabled || lockedAsCurrent
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : "planos-cta-secondary bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-70"
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Aguarde...
                      </>
                    ) : showReactivate ? "Reativar assinatura" : lockedAsCurrent ? "Plano atual" : ctaText}
                  </button>
                );
              })()}
            </div>
          </div>
        ))}

        {/* Selo de pagamento: no app da Play Store mostra "Google Play" (confiança
            + exigência do Google); na web/PWA mostra o Mercado Pago.
            Só renderiza DEPOIS de resolver se é TWA (twaChecked) → o Mercado Pago
            nunca pisca dentro do app da Loja. Na web resolve num microtask. */}
        {twaChecked &&
          (isTwa ? (
            <PlayStoreTrust className="pt-2 pb-2" />
          ) : (
            <PaymentTrust className="pt-2 pb-2" />
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
    <Suspense fallback={null}>
      <PlanosContent />
    </Suspense>
  );
}
