"use client";

import { useState } from "react";
import Link from "next/link";
import { RevealOnScroll } from "./RevealOnScroll";

const tabs = [
  {
    id: "despensa",
    icon: "📋",
    label: "Despensa",
    title: "Sua despensa digital completa",
    desc: "Todos os itens da casa organizados com status visual. Saiba o que tem, o que está acabando e o que precisa comprar — em tempo real.",
    features: ["Busca rápida por item", "Filtros por status (Tem, Acabando, Acabou, Comprar)", "Mude o status em 1 toque", "Categorias organizadas"],
  },
  {
    id: "lista",
    icon: "🛒",
    label: "Lista",
    title: "Lista pronta em 1 toque",
    desc: "Tudo que marcou como \"Acabou\" ou \"Quero comprar\" aparece aqui automaticamente. Envie pelo WhatsApp e vá ao mercado sem esquecer nada.",
    features: ["Lista gerada automaticamente", "Compartilhe no WhatsApp em 1 toque", "Marque como comprado no mercado", "Itens organizados por categoria"],
  },
  {
    id: "casa",
    icon: "👥",
    label: "Casa",
    title: "Toda família conectada",
    desc: "Convide membros pelo WhatsApp. Todo mundo vê a lista, marca itens e acompanha em tempo real.",
    features: ["Convite por link no WhatsApp", "Membros ilimitados no Plano Família", "Múltiplos locais (casa, praia, empresa)", "Papéis: Dono e Membro"],
  },
  {
    id: "novo",
    icon: "➕",
    label: "Adicionar",
    title: "Adicionar item em segundos",
    desc: "Cadastre itens com nome, categoria e status. Sugestões prontas facilitam — sem digitar tudo do zero.",
    features: ["Sugestões automáticas de itens", "Categorias prontas (Alimentos, Limpeza...)", "Escolha o status inicial", "Observação / quantidade opcional"],
  },
];

/* Mockup da Despensa */
function DespensaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2.5 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-xs">Despensa</p>
          <p className="text-[9px] text-gray-400">28 itens</p>
        </div>
        <span className="bg-green-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg">+ Adicionar</span>
      </div>
      <div className="px-3 py-2">
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-[9px] text-gray-400 mb-2">🔍 Buscar item...</div>
        <div className="flex gap-1 mb-2 overflow-x-auto">
          {["Todos", "Tem", "Acabando", "Acabou", "Comprar"].map((f, i) => (
            <span key={f} className={`text-[8px] font-bold px-2 py-1 rounded-full shrink-0 ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>{f}</span>
          ))}
        </div>
        <p className="text-[7px] font-bold text-gray-400 uppercase mb-1 px-0.5">🛒 Alimentos</p>
        {[
          { name: "Açúcar", badge: "Tem em casa", bg: "bg-green-50", text: "text-green-700" },
          { name: "Arroz", badge: "Tem em casa", bg: "bg-green-50", text: "text-green-700" },
          { name: "Café", badge: "Acabando", bg: "bg-amber-50", text: "text-amber-700" },
          { name: "Detergente", badge: "Acabou", bg: "bg-red-50", text: "text-red-700" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-[10px] font-semibold text-gray-900">{item.name}</p>
              <div className="flex gap-1 mt-0.5">
                {["Tem", "Acabando", "Acabou", "Comprar"].map((s) => (
                  <span key={s} className="text-[6px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${item.bg} ${item.text}`}>{item.badge}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* Mockup da Lista */
function ListaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2.5 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-xs">Lista de Compras</p>
        <p className="text-[9px] text-gray-400">5 itens</p>
      </div>
      <div className="px-3 py-2">
        <div className="bg-[#25D366] text-white rounded-lg px-2.5 py-2 flex items-center justify-center gap-1.5 mb-3">
          <span className="text-xs">📲</span>
          <span className="text-[9px] font-bold">Compartilhar no WhatsApp</span>
        </div>
        <p className="text-[7px] font-bold text-gray-400 uppercase mb-1.5 px-0.5">🛒 Alimentos</p>
        {[
          { name: "Café 500g", done: true },
          { name: "Arroz 5kg", done: false },
          { name: "Feijão 1kg", done: false },
        ].map((item) => (
          <div key={item.name} className={`flex items-center gap-2 py-1.5 border-b border-gray-50 ${item.done ? "opacity-50" : ""}`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${item.done ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
              {item.done && <span className="text-white text-[8px]">✓</span>}
            </div>
            <p className={`text-[10px] font-medium ${item.done ? "line-through text-gray-400" : "text-gray-900"}`}>{item.name}</p>
          </div>
        ))}
        <p className="text-[7px] font-bold text-gray-400 uppercase mt-3 mb-1.5 px-0.5">📦 Outros</p>
        {[
          { name: "Detergente", done: true },
          { name: "Esponja", done: false },
        ].map((item) => (
          <div key={item.name} className={`flex items-center gap-2 py-1.5 border-b border-gray-50 ${item.done ? "opacity-50" : ""}`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${item.done ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
              {item.done && <span className="text-white text-[8px]">✓</span>}
            </div>
            <p className={`text-[10px] font-medium ${item.done ? "line-through text-gray-400" : "text-gray-900"}`}>{item.name}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/* Mockup da Casa */
function CasaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2.5 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-xs">Casa da Família</p>
        <p className="text-[9px] text-gray-400">Configurações da casa</p>
      </div>
      <div className="px-3 py-2 space-y-2">
        {/* Perfil */}
        <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">A</div>
          <div>
            <p className="text-[10px] font-bold text-gray-900">Ana Silva</p>
            <p className="text-[8px] text-gray-500">🛒 Dono da conta</p>
          </div>
        </div>
        {/* Casa */}
        <div className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2">
          <span className="text-base">🏠</span>
          <div>
            <p className="text-[10px] font-bold text-gray-900">Casa da Família</p>
            <p className="text-[8px] text-gray-500">Casa · Onde eu moro</p>
          </div>
        </div>
        {/* Membros */}
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[9px] font-bold text-gray-600 mb-2">👥 Membros (2)</p>
          {[
            { name: "Ana Silva", role: "🛒 Dono", you: true, color: "bg-green-600" },
            { name: "João Silva", role: "👤 Membro", you: false, color: "bg-blue-500" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-2 py-1">
              <div className={`w-5 h-5 ${m.color} rounded-full text-white text-[7px] font-bold flex items-center justify-center shrink-0`}>{m.name[0]}</div>
              <div>
                <p className="text-[9px] font-semibold text-gray-900">{m.name} {m.you && <span className="text-gray-400">(você)</span>}</p>
                <p className="text-[7px] text-gray-500">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Convidar */}
        <div className="bg-green-50 rounded-xl p-2.5 text-center">
          <p className="text-[9px] font-bold text-green-700">Gerar link de convite</p>
        </div>
      </div>
    </>
  );
}

/* Mockup Novo Item */
function NovoItemScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2.5 border-b border-gray-100 opacity-50">
        <p className="font-bold text-gray-900 text-xs">Despensa</p>
      </div>
      <div className="relative">
        <div className="px-3 py-2 opacity-20 blur-[1px]">
          <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-[9px] text-gray-400 mb-2">🔍 Buscar...</div>
        </div>
        {/* Modal overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-start justify-center pt-2">
          <div className="bg-white rounded-2xl w-[90%] shadow-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-900">Novo item</p>
              <span className="text-gray-400 text-xs">✕</span>
            </div>
            <p className="text-[8px] text-gray-500">Marcando como: <strong className="text-green-700">Tem em casa</strong></p>
            <div>
              <p className="text-[7px] font-bold text-gray-500 mb-0.5">Nome do item *</p>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-[8px] text-gray-400">Ex: Café, Detergente...</div>
            </div>
            <div>
              <p className="text-[7px] font-bold text-gray-500 mb-0.5">Categoria *</p>
              <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-[8px] text-gray-700 flex items-center justify-between">🛒 Alimentos <span className="text-gray-400">▾</span></div>
            </div>
            <div>
              <p className="text-[7px] font-bold text-gray-500 mb-0.5">Status</p>
              <div className="flex gap-1">
                {["Tem em casa", "Acabando", "Acabou", "Comprar"].map((s, i) => (
                  <span key={s} className={`text-[6px] font-bold px-1.5 py-1 rounded-full ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <span className="flex-1 text-center bg-gray-100 text-gray-600 text-[8px] font-bold py-1.5 rounded-lg">Voltar</span>
              <span className="flex-1 text-center bg-green-600 text-white text-[8px] font-bold py-1.5 rounded-lg">Adicionar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const screens: Record<string, React.FC> = {
  despensa: DespensaScreen,
  lista: ListaScreen,
  casa: CasaScreen,
  novo: NovoItemScreen,
};

const activeNavMap: Record<string, string> = {
  despensa: "Despensa",
  lista: "Lista",
  casa: "Casa",
  novo: "Despensa",
};

export function AppShowcase() {
  const [activeTab, setActiveTab] = useState("despensa");
  const tab = tabs.find((t) => t.id === activeTab)!;
  const Screen = screens[activeTab];

  return (
    <section className="px-6 py-16 bg-white" id="app">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-8">
            <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">Veja por dentro</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Conheça cada tela do Acabou?</h2>
            <p className="text-gray-500 text-base">Não é conceito. É um produto real, usado por famílias de verdade.</p>
          </div>
        </RevealOnScroll>

        {/* Tabs */}
        <RevealOnScroll>
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === t.id
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Layout: description + phone */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Description */}
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{tab.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">{tab.desc}</p>
            <div className="space-y-2.5">
              {tab.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="flex justify-center">
            <div className="relative w-[240px]">
              <div className="bg-gray-900 rounded-[2rem] p-2.5 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-10" />
                <div className="bg-white rounded-[1.5rem] overflow-hidden min-h-[400px] flex flex-col">
                  <div className="flex-1">
                    <Screen />
                  </div>
                  {/* Bottom nav */}
                  <div className="flex items-center justify-around border-t border-gray-100 py-1.5 mt-auto">
                    {[
                      { icon: "🏠", label: "Início" },
                      { icon: "📋", label: "Despensa" },
                      { icon: "✅", label: "Lista" },
                      { icon: "👥", label: "Casa" },
                    ].map((n) => (
                      <div key={n.label} className="text-center">
                        <p className="text-xs">{n.icon}</p>
                        <p className={`text-[7px] font-semibold ${activeNavMap[activeTab] === n.label ? "text-green-600" : "text-gray-400"}`}>{n.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-200 rounded-full opacity-20 blur-2xl pointer-events-none" />
            </div>
          </div>
        </div>

        <RevealOnScroll>
          <div className="text-center mt-10">
            <Link href="/cadastro" className="inline-block bg-green-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95 text-sm shadow-lg shadow-green-200">
              Quero experimentar grátis →
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
