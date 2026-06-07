"use client";

import { useEffect, useState, useCallback } from "react";

// =============================================================
// Painel de ADMIN (só Anderson) — acompanhamento da base e da blindagem.
// Abra logado com o e-mail de admin: a própria API (/api/admin/trials) faz a
// trava de acesso. Mostra: total de contas, pagantes (com nome/e-mail), trials
// ativos, congelados e — o mais importante — VAZAMENTOS (tem que ser sempre 0).
// =============================================================

type Pagante = { casa: string; plano: string; dono: string; email: string; vence_em: string };
type Resumo = {
  total_contas: number;
  total_casas: number;
  trial_ativos: number;
  pagantes_ativos: number;
  contas_free: number;
  congeladas_inativas: number;
  vazamentos: number;
};
type Relatorio = {
  gerado_em: string;
  resumo: Resumo;
  status: string;
  pagantes_detalhe: Pagante[];
  vazamentos_detalhe: any[];
};

const VERDE = "#1E9839";

function fmtData(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [data, setData] = useState<Relatorio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [acaoMsg, setAcaoMsg] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await fetch("/api/admin/trials", { credentials: "include", cache: "no-store" });
      if (r.status === 403) {
        setErro("Acesso só para admin. Entre no app com o e-mail de administrador e recarregue esta página.");
        setData(null);
        return;
      }
      const j = await r.json();
      setData(j);
    } catch {
      setErro("Não consegui carregar. Verifique a conexão e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function rodarAcao(acao: string, confirmacao: string) {
    if (!confirm(confirmacao)) return;
    setAcaoMsg("Executando...");
    try {
      const r = await fetch(`/api/admin/trials?acao=${acao}`, { credentials: "include", cache: "no-store" });
      const j = await r.json();
      setAcaoMsg(j.message || "Feito.");
      await carregar();
    } catch {
      setAcaoMsg("Falhou. Tente de novo.");
    }
  }

  const semVazamento = data?.resumo?.vazamentos === 0;

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 64px", fontFamily: "system-ui, sans-serif", color: "#1a1a1a" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>🛡️ Painel Acabou?</h1>
        <button
          onClick={carregar}
          style={{ background: VERDE, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}
        >
          🔄 Atualizar
        </button>
      </div>

      {carregando && <p style={{ color: "#666" }}>Carregando...</p>}

      {erro && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B", padding: 16, borderRadius: 12 }}>
          {erro}
        </div>
      )}

      {data && (
        <>
          {/* Status da blindagem */}
          <div
            style={{
              background: semVazamento ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${semVazamento ? "#6EE7B7" : "#FCA5A5"}`,
              color: semVazamento ? "#065F46" : "#991B1B",
              padding: 16,
              borderRadius: 12,
              fontWeight: 700,
              marginBottom: 20,
            }}
          >
            {data.status}
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
            <Card titulo="Contas (perfis)" valor={data.resumo.total_contas} />
            <Card titulo="Casas" valor={data.resumo.total_casas} />
            <Card titulo="💚 Pagantes" valor={data.resumo.pagantes_ativos} destaque />
            <Card titulo="Em teste (trial)" valor={data.resumo.trial_ativos} />
            <Card titulo="Grátis" valor={data.resumo.contas_free} />
            <Card titulo="Congeladas" valor={data.resumo.congeladas_inativas} />
            <Card titulo="Vazamentos" valor={data.resumo.vazamentos} alerta={!semVazamento} />
          </div>

          {/* Pagantes */}
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "8px 0 12px" }}>💚 Assinantes pagantes</h2>
          {data.pagantes_detalhe.length === 0 ? (
            <p style={{ color: "#666" }}>Nenhum pagante ainda. (Os trials viram pagantes quando assinam.)</p>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", textAlign: "left" }}>
                    <th style={th}>Dono</th>
                    <th style={th}>E-mail</th>
                    <th style={th}>Plano</th>
                    <th style={th}>Casa</th>
                    <th style={th}>Vence em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pagantes_detalhe.map((p, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td style={td}>{p.dono}</td>
                      <td style={td}>{p.email}</td>
                      <td style={td}>{p.plano}</td>
                      <td style={td}>{p.casa}</td>
                      <td style={td}>{fmtData(p.vence_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Ações manuais */}
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "28px 0 12px" }}>⚙️ Ações</h2>
          {acaoMsg && <p style={{ color: VERDE, fontWeight: 600 }}>{acaoMsg}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              onClick={() => rodarAcao("congelar_vencidos", "Congelar agora todas as casas vencidas (e bloquear convidados)?")}
              style={btnSec}
            >
              ❄️ Congelar vencidos agora
            </button>
          </div>

          <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 24 }}>
            Gerado em {new Date(data.gerado_em).toLocaleString("pt-BR")}. A faxina automática também roda todo dia às 6h.
          </p>
        </>
      )}
    </main>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 700, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };
const btnSec: React.CSSProperties = {
  background: "#fff",
  color: "#1a1a1a",
  border: "1px solid #D1D5DB",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

function Card({ titulo, valor, destaque, alerta }: { titulo: string; valor: number; destaque?: boolean; alerta?: boolean }) {
  return (
    <div
      style={{
        background: alerta && valor > 0 ? "#FEF2F2" : destaque ? "#ECFDF5" : "#fff",
        border: `1px solid ${alerta && valor > 0 ? "#FCA5A5" : destaque ? "#6EE7B7" : "#E5E7EB"}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>{titulo}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: alerta && valor > 0 ? "#DC2626" : destaque ? VERDE : "#111827" }}>
        {valor}
      </div>
    </div>
  );
}
