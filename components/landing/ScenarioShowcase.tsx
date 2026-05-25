"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const scenarios = [
  {
    id: "casa",
    tab: "🏠 Minha casa",
    tabShort: "🏠 Casa",
    badge: "PARA A FAMÍLIA",
    badgeBg: "bg-green-600",
    headline: "Acabou o arroz? Em segundos, toda a família já sabe.",
    desc: "Todo mundo da casa abre o app e marca o que acabou. Quem vai ao mercado já tem a lista atualizada — sem ligação, sem mensagem, sem esquecimento.",
    bullets: [
      "Cozinha, banheiro, limpeza — tudo separado",
      "Marido, esposa, filhos — mesma lista",
      "Funciona offline e sincroniza depois",
    ],
    mockTitle: "Casa da família",
    mockTag: "FAMÍLIA",
    mockTagColor: "text-green-700",
    mockItems: [
      { name: "Arroz (5kg)",    who: "Ana marcou",    status: "Acabou",    statusColor: "bg-red-100 text-red-700" },
      { name: "Sabao em po",   who: "Joao marcou",   status: "Acabando",  statusColor: "bg-amber-100 text-amber-700" },
      { name: "Cafe (500g)",   who: "Ana marcou",    status: "Acabou",    statusColor: "bg-red-100 text-red-700" },
      { name: "Leite (1L)",    who: "Maria marcou",  status: "Acabando",  statusColor: "bg-amber-100 text-amber-700" },
    ],
  },
  {
    id: "ape",
    tab: "🏢 Apartamento",
    tabShort: "🏢 Apê",
    badge: "PARA O APÊ",
    badgeBg: "bg-blue-600",
    headline: "Apê dividido? Cada um marca o que usou por último.",
    desc: "Mora com colegas, com o parceiro ou cuida do apê dos seus pais? Cada um marca o que acabou e o responsável da semana já sabe exatamente o que comprar.",
    bullets: [
      "Divida a lista com quem mora junto",
      "Veja quem marcou o quê — e quando",
      "Ideal pra apê de estudante e casal",
    ],
    mockTitle: "Apê do centro",
    mockTag: "APÊ",
    mockTagColor: "text-blue-700",
    mockItems: [
      { name: "Cafe em po (500g)", who: "Lucas marcou",   status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Cerveja (lata)",    who: "Bruna marcou", status: "Acabando", statusColor: "bg-amber-100 text-amber-700" },
      { name: "Detergente",        who: "Lucas marcou",   status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Pao de forma",      who: "Bruna marcou",   status: "Acabando", statusColor: "bg-amber-100 text-amber-700" },
    ],
  },
  {
    id: "praia",
    tab: "🏖️ Praia / Veraneio",
    tabShort: "🏖️ Praia",
    badge: "PARA A CASA DE PRAIA",
    badgeBg: "bg-amber-500",
    headline: "Vai pra praia? A lista de compras já vai pronta.",
    desc: "A casa de praia vive cheia e ninguém lembra o que faltou. Quem foi no último fim de semana marca o que acabou — o próximo já chega com tudo abastecido.",
    bullets: [
      "Avise a turma do próximo fim de semana",
      "Lista de churrasco, café e limpeza",
      "Funciona mesmo sem sinal na praia",
    ],
    mockTitle: "Casa de Maresias",
    mockTag: "PRAIA",
    mockTagColor: "text-amber-700",
    mockItems: [
      { name: "Carvao (3kg)",      who: "Rafa marcou",  status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Cafe em po (500g)", who: "Camila marcou",  status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Protetor solar",    who: "Rafa marcou",   status: "Acabando", statusColor: "bg-amber-100 text-amber-700" },
      { name: "Gelo",              who: "Camila marcou",  status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
    ],
  },
  {
    id: "empresa",
    tab: "💼 Sua empresa",
    tabShort: "💼 Empresa",
    badge: "PARA SUA EMPRESA",
    badgeBg: "bg-violet-600",
    headline: "Funcionários avisam o que falta. Você só compra.",
    desc: "Da copa ao banheiro, do escritório à área de lazer — estoque sempre abastecido sem precisar verificar pessoalmente o que está acabando.",
    bullets: [
      "Equipe avisa o que está acabando",
      "Controle copa, banheiro e escritório",
      "Histórico completo de compras",
    ],
    mockTitle: "Escritório Central",
    mockTag: "EMPRESA",
    mockTagColor: "text-violet-700",
    mockItems: [
      { name: "Capsula de cafe",    who: "Fernanda marcou",       status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Papel higienico",    who: "Carlos marcou",     status: "Acabando", statusColor: "bg-amber-100 text-amber-700" },
      { name: "Copo descartavel",   who: "Fernanda marcou",       status: "Acabou",   statusColor: "bg-red-100 text-red-700" },
      { name: "Folha A4",           who: "Carlos marcou",   status: "Acabando", statusColor: "bg-amber-100 text-amber-700" },
    ],
  },
];

export function ScenarioShowcase() {
  const [active, setActive] = useState(0);
  const s = scenarios[active];

  return (
    <section className="px-4 py-16 bg-[#f8faf8]">
      <div className="max-w-5xl mx-auto">

        {/* Título da seção */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-3">
            Tem casa, apê, praia, chácara<br className="hidden md:block" /> e ainda cuida da empresa?
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            Cada lugar com sua própria lista, sua própria equipe — tudo em um app só.
          </p>
        </div>

        {/* Tabs — scroll horizontal no mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide justify-start md:justify-center">
          {scenarios.map((sc, i) => (
            <button
              key={sc.id}
              onClick={() => setActive(i)}
              className={cn(
                "flex flex-col items-start gap-0.5 px-4 py-3 rounded-2xl border-2 transition-all shrink-0 text-left",
                active === i
                  ? "border-green-500 bg-white shadow-md"
                  : "border-gray-200 bg-white hover:border-green-200"
              )}
            >
              <span className={cn("font-bold text-sm", active === i ? "text-gray-900" : "text-gray-600")}>
                <span className="hidden sm:inline">{sc.tab}</span>
                <span className="sm:hidden">{sc.tabShort}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mb-8">Toque em um cartão para ver o exemplo</p>

        {/* Painel do cenário */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2">

            {/* Lado esquerdo — copy */}
            <div className="p-7 md:p-10 flex flex-col justify-center">
              <span className={`inline-block ${s.badgeBg} text-white text-xs font-black px-3 py-1.5 rounded-full mb-5 tracking-wide w-fit`}>
                {s.badge}
              </span>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4">
                {s.headline}
              </h3>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6">
                {s.desc}
              </p>
              <ul className="space-y-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lado direito — mock do app */}
            <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-6 md:p-8 flex items-center justify-center">
              <div className="w-full max-w-xs bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header mock */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{s.mockTitle}</p>
                  <span className={`text-xs font-black ${s.mockTagColor} bg-gray-100 px-2 py-0.5 rounded-full`}>
                    {s.mockTag}
                  </span>
                </div>
                {/* Items mock */}
                <div className="divide-y divide-gray-50">
                  {s.mockItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.who}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Footer mock */}
                <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                  <p className="text-xs text-green-700 font-semibold text-center">
                    {s.mockItems.length} itens na lista de compras
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
