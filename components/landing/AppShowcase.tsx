"use client";

import { useState } from "react";
import Link from "next/link";
import { RevealOnScroll } from "./RevealOnScroll";

const tabs = [
  {
    id: "inicio",
    icon: "🏠",
    label: "Início",
    title: "Tudo que aconteceu na sua casa",
    desc: "Veja os contadores de itens, ações rápidas (Acabou, Acabando, Comprar, Comprei) e a lista de compras pronta em 1 toque.",
    features: ["Visão geral dos itens da casa", "4 ações em 1 toque", "Acesso rápido à lista de compras", "Troca fácil entre locais"],
  },
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
    desc: "Convide membros pelo WhatsApp. Todo mundo vê a lista, marca itens e acompanha em tempo real. Gerencie múltiplos locais.",
    features: ["Convite por link no WhatsApp", "Membros ilimitados no Plano Família", "Múltiplos locais (casa, praia, empresa)", "Foto de perfil personalizável"],
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

/* ── Mockup: Início ── */
function InicioScreen() {
  return (
    <>
      <div className="bg-green-600 px-3 py-2.5 flex items-center justify-between">
        <div>
          <p className="text-green-100 text-[8px] font-medium">🏠 Casa da Silva</p>
          <p className="text-white font-bold text-[10px]">O que mudou hoje?</p>
        </div>
        <div className="relative">
          <span className="text-sm">🔔</span>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[6px] font-bold rounded-full flex items-center justify-center">4</span>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="bg-green-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-sm font-black text-green-600">3</p>
            <p className="text-[7px] text-gray-500 font-medium">Para comprar</p>
          </div>
          <div className="bg-red-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-sm font-black text-red-500">2</p>
            <p className="text-[7px] text-gray-500 font-medium">Acabou</p>
          </div>
        </div>
        <p className="text-[7px] font-bold text-gray-400 uppercase mb-1 px-0.5">O que aconteceu?</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            { icon: "📦", label: "Acabou!", bg: "bg-red-50", border: "border-red-100", text: "text-red-700" },
            { icon: "⏰", label: "Acabando!", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
            { icon: "🛒", label: "Comprar!", bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700" },
            { icon: "✅", label: "Comprei!", bg: "bg-green-50", border: "border-green-100", text: "text-green-700" },
          ].map((a) => (
            <div key={a.label} className={`${a.bg} ${a.border} border rounded-lg px-1.5 py-1.5 text-center`}>
              <p className="text-sm">{a.icon}</p>
              <p className={`text-[8px] font-bold ${a.text}`}>{a.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-green-600 text-white rounded-lg px-2.5 py-2 flex items-center justify-between mt-2">
          <div>
            <p className="text-[9px] font-bold">Ver lista de compras</p>
            <p className="text-[7px] text-green-100">3 itens para comprar</p>
          </div>
          <span className="text-sm">🛒</span>
        </div>
      </div>
    </>
  );
}

/* ── Mockup: Despensa ── */
function DespensaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-[10px]">Despensa</p>
          <p className="text-[8px] text-gray-400">28 itens</p>
        </div>
        <span className="bg-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">+ Adicionar</span>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="bg-gray-50 rounded-md px-2 py-1 text-[8px] text-gray-400 mb-1.5">🔍 Buscar item...</div>
        <div className="flex gap-0.5 mb-1.5">
          {["Todos", "Tem", "Acabando", "Acabou", "Comprar"].map((f, i) => (
            <span key={f} className={`text-[6px] font-bold px-1.5 py-0.5 rounded-full ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>{f}</span>
          ))}
        </div>
        <p className="text-[6px] font-bold text-gray-400 uppercase mb-0.5">🛒 Alimentos</p>
        {[
          { name: "Açúcar", badge: "Tem em casa", bg: "bg-green-50", text: "text-green-700" },
          { name: "Arroz 5kg", badge: "Tem em casa", bg: "bg-green-50", text: "text-green-700" },
          { name: "Café 500g", badge: "Acabando", bg: "bg-amber-50", text: "text-amber-700" },
          { name: "Detergente", badge: "Acabou", bg: "bg-red-50", text: "text-red-600" },
          { name: "Leite 1L", badge: "Comprar", bg: "bg-blue-50", text: "text-blue-700" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
            <p className="text-[9px] font-semibold text-gray-900">{item.name}</p>
            <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded-full ${item.bg} ${item.text}`}>{item.badge}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Mockup: Lista ── */
function ListaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-[10px]">Lista de Compras</p>
        <p className="text-[8px] text-gray-400">5 itens</p>
      </div>
      <div className="px-2.5 py-1.5">
        <div className="bg-[#25D366] text-white rounded-lg px-2 py-1.5 flex items-center justify-center gap-1 mb-2">
          <span className="text-xs">📲</span>
          <span className="text-[8px] font-bold">Compartilhar no WhatsApp</span>
        </div>
        <p className="text-[6px] font-bold text-gray-400 uppercase mb-1">🛒 Alimentos</p>
        {[
          { name: "Café 500g", done: true },
          { name: "Arroz 5kg", done: false },
          { name: "Feijão 1kg", done: false },
        ].map((item) => (
          <div key={item.name} className={`flex items-center gap-1.5 py-1 border-b border-gray-50 ${item.done ? "opacity-40" : ""}`}>
            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${item.done ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
              {item.done && <span className="text-white text-[6px]">✓</span>}
            </div>
            <p className={`text-[9px] font-medium ${item.done ? "line-through text-gray-400" : "text-gray-900"}`}>{item.name}</p>
          </div>
        ))}
        <p className="text-[6px] font-bold text-gray-400 uppercase mt-2 mb-1">🧹 Limpeza</p>
        {[
          { name: "Detergente", done: true },
          { name: "Esponja", done: false },
        ].map((item) => (
          <div key={item.name} className={`flex items-center gap-1.5 py-1 border-b border-gray-50 ${item.done ? "opacity-40" : ""}`}>
            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${item.done ? "bg-green-600 border-green-600" : "border-gray-300"}`}>
              {item.done && <span className="text-white text-[6px]">✓</span>}
            </div>
            <p className={`text-[9px] font-medium ${item.done ? "line-through text-gray-400" : "text-gray-900"}`}>{item.name}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Mockup: Casa (completo) ── */
function CasaScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2 border-b border-gray-100">
        <p className="font-bold text-gray-900 text-[10px]">Casa da Família</p>
        <p className="text-[8px] text-gray-400">Configurações da casa</p>
      </div>
      <div className="px-2.5 py-1.5 space-y-1.5">
        {/* Perfil com câmera */}
        <div className="bg-gray-50 rounded-xl p-2 flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-[9px] font-bold">A</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center border border-white">
              <span className="text-[5px] text-white">📷</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-900">Ana Silva ✏️</p>
            <p className="text-[7px] text-gray-500">🛒 Dono da conta</p>
          </div>
        </div>

        {/* Locais (múltiplos) */}
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-[7px] font-bold text-gray-500 mb-1">📍 Meus locais</p>
          {[
            { icon: "🏠", name: "Casa da Família", type: "Casa" },
            { icon: "🏖️", name: "Casa de Maresias", type: "Praia" },
            { icon: "💼", name: "Escritório Centro", type: "Empresa" },
          ].map((loc) => (
            <div key={loc.name} className="flex items-center gap-1.5 py-0.5">
              <span className="text-xs">{loc.icon}</span>
              <div>
                <p className="text-[8px] font-semibold text-gray-900">{loc.name}</p>
                <p className="text-[6px] text-gray-400">{loc.type}</p>
              </div>
            </div>
          ))}
          <div className="mt-1 text-center">
            <span className="text-[7px] text-green-600 font-bold">+ Criar novo local</span>
          </div>
        </div>

        {/* Membros */}
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-[7px] font-bold text-gray-500 mb-1">👥 Membros (3)</p>
          {[
            { name: "Ana Silva", role: "Dono", you: true, color: "bg-green-600" },
            { name: "João Silva", role: "Cônjuge", color: "bg-blue-500" },
            { name: "Maria Silva", role: "Familiar", color: "bg-pink-500" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-1.5 py-0.5">
              <div className="relative">
                <div className={`w-4.5 h-4.5 ${m.color} rounded-full text-white text-[6px] font-bold flex items-center justify-center`} style={{ width: "18px", height: "18px" }}>{m.name[0]}</div>
              </div>
              <div>
                <p className="text-[8px] font-semibold text-gray-900">{m.name} {m.you && <span className="text-[6px] text-gray-400">(você)</span>}</p>
                <p className="text-[6px] text-gray-400">👤 {m.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Convidar */}
        <div className="bg-green-600 rounded-xl p-2 text-center">
          <p className="text-[8px] font-bold text-white">🔗 Gerar link de convite</p>
          <p className="text-[6px] text-green-100 mt-0.5">Compartilhe pelo WhatsApp</p>
        </div>
      </div>
    </>
  );
}

/* ── Mockup: Novo Item ── */
function NovoItemScreen() {
  return (
    <>
      <div className="bg-white px-3 py-2 border-b border-gray-100 opacity-40">
        <p className="font-bold text-gray-900 text-[10px]">Despensa</p>
      </div>
      <div className="relative min-h-[280px]">
        <div className="px-2.5 py-1.5 opacity-15 blur-[1px]">
          <div className="bg-gray-50 rounded-md px-2 py-1 text-[8px] text-gray-400">🔍 Buscar...</div>
        </div>
        <div className="absolute inset-0 bg-black/30 flex items-start justify-center pt-3">
          <div className="bg-white rounded-xl w-[88%] shadow-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-gray-900">Novo item</p>
              <span className="text-gray-400 text-[10px]">✕</span>
            </div>
            <p className="text-[7px] text-gray-500">Marcando como: <strong className="text-green-700">Tem em casa</strong></p>
            <div>
              <p className="text-[6px] font-bold text-gray-500 mb-0.5">Nome do item *</p>
              <div className="bg-gray-50 rounded-md px-2 py-1 text-[7px] text-gray-400 border border-gray-200">Ex: Café, Detergente...</div>
            </div>
            <div>
              <p className="text-[6px] font-bold text-gray-500 mb-0.5">Categoria *</p>
              <div className="bg-gray-50 rounded-md px-2 py-1 text-[7px] text-gray-700 flex items-center justify-between border border-gray-200">🛒 Alimentos <span className="text-gray-400 text-[8px]">▾</span></div>
            </div>
            <div>
              <p className="text-[6px] font-bold text-gray-500 mb-0.5">Status</p>
              <div className="flex gap-0.5">
                {["Tem em casa", "Acabando", "Acabou", "Comprar"].map((s, i) => (
                  <span key={s} className={`text-[5px] font-bold px-1 py-0.5 rounded-full ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[6px] font-bold text-gray-500 mb-0.5">Observação <span className="font-normal text-gray-400">(opcional)</span></p>
              <div className="bg-gray-50 rounded-md px-2 py-1 text-[7px] text-gray-400 border border-gray-200">Ex: 2 pacotes, marca X...</div>
            </div>
            <div className="flex gap-1.5 pt-0.5">
              <span className="flex-1 text-center bg-gray-100 text-gray-600 text-[7px] font-bold py-1.5 rounded-lg">Voltar</span>
              <span className="flex-1 text-center bg-green-600 text-white text-[7px] font-bold py-1.5 rounded-lg">Adicionar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const screens: Record<string, React.FC> = {
  inicio: InicioScreen,
  despensa: DespensaScreen,
  lista: ListaScreen,
  casa: CasaScreen,
  novo: NovoItemScreen,
};

const activeNavMap: Record<string, string> = {
  inicio: "Início",
  despensa: "Despensa",
  lista: "Lista",
  casa: "Casa",
  novo: "Despensa",
};

export function AppShowcase() {
  const [activeTab, setActiveTab] = useState("inicio");
  const tab = tabs.find((t) => t.id === activeTab)!;
  const Screen = screens[activeTab];

  return (
    <section className="px-6 py-16 bg-[#f5faf7]" id="app">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="text-center mb-8">
            <span className="inline-flex items-center bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4">Veja por dentro</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Conheça cada tela do Acabou?</h2>
            <p className="text-gray-500 text-base">Não é conceito. É um produto real, usado por famílias de verdade.</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="flex justify-center gap-1.5 sm:gap-2 mb-8 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === t.id
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-3">{tab.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">{tab.desc}</p>
            <div className="space-y-2.5">
              {tab.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </span>
                  <span className="text-gray-700 font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center order-first md:order-last">
            <div className="relative w-[240px]">
              <div className="bg-gray-900 rounded-[2rem] p-2.5 shadow-2xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-10" />
                <div className="bg-white rounded-[1.5rem] overflow-hidden min-h-[380px] flex flex-col">
                  <div className="flex-1">
                    <Screen />
                  </div>
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
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-200 rounded-full opacity-25 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-green-300 rounded-full opacity-15 blur-2xl pointer-events-none" />
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
