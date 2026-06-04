"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ── Notificações que aparecem no mockup do celular ── */
const notifications = [
  {
    icon: "📦",
    title: "Casa da Silva",
    body: 'Ana marcou "Café" como acabou',
    time: "agora",
    delay: 0,
  },
  {
    icon: "📦",
    title: "Casa da Silva",
    body: 'João marcou "Arroz" como está acabando',
    time: "30 seg",
    delay: 2000,
  },
  {
    icon: "🛒",
    title: "Hora de ir às compras!",
    body: 'Você tem 6 itens para comprar na "Casa da Silva"',
    time: "18:00",
    delay: 4000,
    isPremium: true,
  },
];

function PhoneNotification({
  notif,
  visible,
  isPremium,
}: {
  notif: (typeof notifications)[0];
  visible: boolean;
  isPremium?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/60 p-3.5 transition-all duration-500 relative",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      {isPremium && (
        <div className="absolute -top-2.5 -right-2.5 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
          PLANO FAMÍLIA
        </div>
      )}
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-lg">
          {notif.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
              Acabou?
            </p>
            <p className="text-[10px] text-gray-400">{notif.time}</p>
          </div>
          <p className="text-sm font-bold text-gray-900 mt-0.5 leading-tight">
            {notif.title}
          </p>
          <p className="text-xs text-gray-600 mt-0.5 leading-snug">
            {notif.body}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Seção principal ── */
export function NotificationShowcase() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          notifications.forEach((_, i) => {
            setTimeout(
              () => setVisibleCount((c) => c + 1),
              notifications[i].delay
            );
          });
        }
      },
      { threshold: 0.3 }
    );

    const el = document.getElementById("notification-showcase");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section id="notification-showcase" className="px-6 py-20 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">

        {/* ── Titulo da seção ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-xs font-black px-4 py-2 rounded-full mb-5 uppercase tracking-wide">
            Por que assinar o Plano Família
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            Cansou de perguntar{" "}
            <span className="text-green-600">"tem café?"</span>
            <br className="hidden md:block" />
            O app avisa antes de você perceber.
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            No plano grátis você já resolve o básico. No Família, sua casa funciona no piloto automático.
          </p>
        </div>

        {/* ── Grid: Mockup + Features ── */}
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Lado esquerdo — Mockup de celular */}
          <div className="flex justify-center order-2 md:order-1">
            <div className="relative w-[280px]">
              <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                <div className="bg-gradient-to-b from-green-50 to-white rounded-[2rem] overflow-hidden min-h-[480px] relative">
                  <div className="flex items-center justify-between px-6 pt-8 pb-2">
                    <p className="text-xs font-semibold text-gray-900">18:00</p>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2.5 border border-gray-400 rounded-sm relative">
                        <div className="absolute inset-0.5 bg-green-500 rounded-[1px]" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-4 pb-6">
                    <p className="text-4xl font-black text-gray-900">18:00</p>
                    <p className="text-sm text-gray-500 mt-1">Segunda, 25 de maio</p>
                  </div>
                  <div className="px-3 space-y-2.5">
                    {notifications.map((notif, i) => (
                      <PhoneNotification
                        key={i}
                        notif={notif}
                        visible={i < visibleCount}
                        isPremium={notif.isPremium}
                      />
                    ))}
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 rounded-full" />
                </div>
              </div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-200 rounded-full opacity-30 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-300 rounded-full opacity-20 blur-3xl" />
            </div>
          </div>

          {/* Lado direito — 6 diferenciais reais */}
          <div className="order-1 md:order-2">
            <div className="space-y-5">

              {[
                {
                  emoji: "👨‍👩‍👧‍👦",
                  bg: "bg-blue-50",
                  title: "Convide toda a família",
                  desc: "Esposa, marido, filhos, empregada, funcionários. Sem limite de pessoas. Todos atualizam a mesma lista.",
                  pain: "No grátis: apenas você, sem convidados",
                },
                {
                  emoji: "🏠",
                  bg: "bg-purple-50",
                  title: "Várias casas em um app só",
                  desc: "Casa, apartamento, praia, sitio, empresa. Cada uma com sua lista e sua equipe.",
                  pain: "No grátis: apenas 1 casa",
                },
                {
                  emoji: "🔔",
                  bg: "bg-amber-50",
                  title: "Lembrete diário no celular",
                  desc: 'Escolha o horário. Às 18h você recebe: "Você tem 6 itens para comprar". Nunca mais esqueça.',
                  pain: "Exclusivo do plano Família",
                },
                {
                  emoji: "♾️",
                  bg: "bg-green-50",
                  title: "Itens ilimitados",
                  desc: "Cadastre todos os itens da sua casa. Sem trava, sem limite, sem ter que escolher o que entra.",
                  pain: "No grátis: máximo 10 itens",
                },
                {
                  emoji: "🔄",
                  bg: "bg-cyan-50",
                  title: "Lembretes recorrentes",
                  desc: "Café acaba todo mês? O app lembra automaticamente de adicionar na lista na hora certa.",
                  pain: "Exclusivo do plano Família",
                },
                {
                  emoji: "📊",
                  bg: "bg-rose-50",
                  title: "Histórico completo",
                  desc: "Veja tudo: quem marcou, quem comprou, quando. Controle total da sua casa.",
                  pain: "Exclusivo do plano Família",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl",
                      item.bg
                    )}
                  >
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-[15px]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                    <p className="text-[11px] mt-1.5 font-semibold">
                      {item.pain.includes("Exclusivo") ? (
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{item.pain}</span>
                      ) : (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{item.pain}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ancoragem de preco */}
            <div className="mt-8 bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
              <p className="text-sm text-gray-600 mb-1">Tudo isso por menos que um cafezinho por dia</p>
              <p className="text-3xl font-black text-green-700">
                R$ 4,99<span className="text-base font-bold text-gray-500">/mês</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                No plano anual. Cancele quando quiser.
              </p>
              <p className="text-xs text-amber-600 font-bold mt-2 mb-4">
                🎁 Comece com 7 dias grátis — sem cartão
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-200 text-sm"
              >
                Testar 7 dias grátis
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
