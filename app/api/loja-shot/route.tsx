import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// =============================================================
// GERADOR INTERNO — capturas de tela da Play Store (tela de planos).
// Reaproveita o motor do opengraph-image pra produzir PNGs de alta
// resolução com os PREÇOS SEMPRE certos (fonte única = este arquivo).
// Motivo: as capturas antigas da loja tinham preço gravado no pixel
// (R$ 4,99/8,90/59,90) e ficaram defasadas quando baixamos os valores.
// Uso: /api/loja-shot?w=1080 (celular)  ·  /api/loja-shot?w=1600 (tablet).
// Não é linkado em lugar nenhum; serve só pra gerar os arquivos.
// =============================================================
export const runtime = "nodejs";

function file(p: string): Buffer {
  return readFileSync(join(process.cwd(), p));
}
function pngUri(p: string): string {
  return `data:image/png;base64,${file(p).toString("base64")}`;
}
function svgUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="#16A34A"/><path d="M13 22.5l6.2 6.2L31 16.5" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const FEATURES = [
  "Itens ilimitados",
  "Pessoas ilimitadas",
  "Vários locais (casa, praia, empresa...)",
  "Lembrete diário no celular",
  "Compartilhar lista no WhatsApp",
  "Histórico completo",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const W = Math.min(2160, Math.max(720, Number(searchParams.get("w")) || 1080));
  const H = Math.round((W * 1920) / 1080);
  const S = W / 1080;
  const px = (n: number) => Math.round(n * S);

  const logo = pngUri("public/logo-mark.png");
  const mascote = pngUri("public/mascote/sacolino-comemorando.png");
  const check = svgUri(CHECK);
  const poppinsBold = file("public/fonts/Poppins-Bold.ttf");
  const poppinsExtra = file("public/fonts/Poppins-ExtraBold.ttf");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "linear-gradient(180deg,#1BA84E 0%,#0F8C3E 100%)",
          fontFamily: "Poppins",
          position: "relative",
          overflow: "hidden",
          padding: `${px(74)}px ${px(60)}px 0`,
        }}
      >
        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
          <div
            style={{
              display: "flex",
              fontSize: px(74),
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.12,
              letterSpacing: `${-1 * S}px`,
              textAlign: "center",
              maxWidth: px(840),
            }}
          >
            Tudo isso por menos que um cafezinho
          </div>
          <div style={{ display: "flex", fontSize: px(33), fontWeight: 700, color: "rgba(255,255,255,0.92)", marginTop: px(18) }}>
            Plano Família · 14 dias grátis pra testar
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: px(46),
            padding: `${px(50)}px ${px(50)}px`,
            marginTop: px(42),
            width: "100%",
            boxShadow: "0 30px 60px rgba(0,0,0,0.18)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "center",
              background: "#E7F7EC",
              color: "#16A34A",
              fontSize: px(25),
              fontWeight: 800,
              padding: `${px(12)}px ${px(28)}px`,
              borderRadius: px(999),
              letterSpacing: `${1 * S}px`,
            }}
          >
            MAIS POPULAR · PLANO ANUAL
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", marginTop: px(26) }}>
            <div style={{ display: "flex", fontSize: px(130), fontWeight: 800, color: "#157A3C", lineHeight: 1 }}>R$ 3,32</div>
            <div style={{ display: "flex", fontSize: px(44), fontWeight: 700, color: "#6B7280", marginBottom: px(16), marginLeft: px(8) }}>/mês</div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", fontSize: px(40), fontWeight: 700, color: "#16A34A", marginTop: px(10) }}>
            no plano anual (R$ 39,90/ano)
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: px(31), fontWeight: 700, color: "#9CA3AF", marginTop: px(6) }}>
            ou R$ 6,90/mês no plano mensal
          </div>

          <div style={{ display: "flex", height: px(2), background: "#EFEFEF", margin: `${px(30)}px 0` }} />

          {/* Recursos */}
          <div style={{ display: "flex", flexDirection: "column", gap: px(22) }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: px(18) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={check} width={px(44)} height={px(44)} alt="" />
                <div style={{ display: "flex", fontSize: px(40), fontWeight: 700, color: "#1F2937" }}>{f}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#16A34A",
              color: "#ffffff",
              fontSize: px(44),
              fontWeight: 800,
              borderRadius: px(28),
              padding: `${px(30)}px 0`,
              marginTop: px(36),
            }}
          >
            Testar 14 dias grátis
          </div>
          <div style={{ display: "flex", justifyContent: "center", fontSize: px(32), fontWeight: 700, color: "#16A34A", marginTop: px(22) }}>
            💳 Sem precisar de cartão
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: px(44), fontSize: px(28), fontWeight: 700, color: "#9CA3AF", marginTop: px(14) }}>
            <div style={{ display: "flex" }}>🔒 Dados protegidos</div>
            <div style={{ display: "flex" }}>🇧🇷 Feito no Brasil</div>
          </div>
        </div>

        {/* Rodapé: logo (esq.) + mascote comemorando (dir.) */}
        <div style={{ display: "flex", alignItems: "center", position: "absolute", left: px(56), bottom: px(50), zIndex: 3 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={px(60)} height={px(60)} alt="" />
          <div style={{ display: "flex", fontSize: px(46), fontWeight: 800, color: "#ffffff", marginLeft: px(16) }}>Acabou?</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascote} width={px(300)} height={px(300)} style={{ position: "absolute", right: px(16), bottom: px(-12) }} alt="" />
      </div>
    ),
    {
      width: W,
      height: H,
      emoji: "twemoji",
      fonts: [
        { name: "Poppins", data: poppinsBold, weight: 700, style: "normal" },
        { name: "Poppins", data: poppinsExtra, weight: 800, style: "normal" },
      ],
    }
  );
}
