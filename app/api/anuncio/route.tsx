import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// =============================================================
// GERADOR INTERNO — criativos para anúncio (Google Ads App Campaign).
// Formatos exigidos pelo Google Ads:
//   • QUADRADA  1200x1200 → /api/anuncio?fmt=quadrada
//   • PAISAGEM  1200x628  → /api/anuncio?fmt=paisagem
// Marca consistente (logo, Sacolino, Poppins, verde). Não linkado.
// =============================================================
export const runtime = "nodejs";

function file(p: string): Buffer {
  return readFileSync(join(process.cwd(), p));
}
function pngUri(p: string): string {
  return `data:image/png;base64,${file(p).toString("base64")}`;
}

export async function GET(request: Request) {
  const fmt = new URL(request.url).searchParams.get("fmt") === "paisagem" ? "paisagem" : "quadrada";
  const W = fmt === "paisagem" ? 1200 : 1200;
  const H = fmt === "paisagem" ? 628 : 1200;

  const logo = pngUri("public/logo-mark.png");
  const mascote = pngUri("public/mascote/sacolino-comemorando.png");
  const poppinsBold = file("public/fonts/Poppins-Bold.ttf");
  const poppinsExtra = file("public/fonts/Poppins-ExtraBold.ttf");
  const fonts = [
    { name: "Poppins", data: poppinsBold, weight: 700 as const, style: "normal" as const },
    { name: "Poppins", data: poppinsExtra, weight: 800 as const, style: "normal" as const },
  ];

  const pill = (fontSize: number, pad: string, radius: number) => (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.16)",
        border: "2px solid rgba(255,255,255,0.5)",
        color: "#ffffff",
        fontWeight: 700,
        fontSize,
        padding: pad,
        borderRadius: radius,
      }}
    >
      🎁 14 dias grátis · sem cartão
    </div>
  );

  const brand = (logoSize: number, textSize: number, gap: number) => (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} width={logoSize} height={logoSize} alt="" />
      <div style={{ display: "flex", fontSize: textSize, fontWeight: 800, color: "#ffffff" }}>Acabou?</div>
    </div>
  );

  // ─────────────────────── PAISAGEM 1200x628 ───────────────────────
  if (fmt === "paisagem") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            background: "linear-gradient(135deg,#1BA84E 0%,#0F8C3E 100%)",
            fontFamily: "Poppins",
            padding: "56px 60px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: 720, height: "100%", gap: 22 }}>
            {brand(56, 44, 16)}
            <div style={{ display: "flex", fontSize: 62, fontWeight: 800, color: "#ffffff", lineHeight: 1.08, letterSpacing: "-1px", maxWidth: 690 }}>
              Nunca mais falta nada em casa
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)", maxWidth: 620 }}>
              A lista de compras da família, em tempo real.
            </div>
            <div style={{ display: "flex", marginTop: 6 }}>{pill(27, "12px 28px", 999)}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mascote} width={430} height={430} style={{ position: "absolute", right: 8, bottom: -18 }} alt="" />
        </div>
      ),
      { width: W, height: H, emoji: "twemoji", fonts }
    );
  }

  // ─────────────────────── QUADRADA 1200x1200 ──────────────────────
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
          padding: "84px 70px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {brand(64, 50, 18)}
        <div style={{ display: "flex", fontSize: 92, fontWeight: 800, color: "#ffffff", lineHeight: 1.06, letterSpacing: "-2px", textAlign: "center", maxWidth: 920, marginTop: 44 }}>
          Nunca mais falta nada em casa
        </div>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "rgba(255,255,255,0.92)", textAlign: "center", maxWidth: 820, marginTop: 26 }}>
          A lista de compras da família, em tempo real.
        </div>
        <div style={{ display: "flex", marginTop: 34 }}>{pill(34, "16px 40px", 999)}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascote} width={430} height={430} style={{ position: "absolute", bottom: -24 }} alt="" />
      </div>
    ),
    { width: W, height: H, emoji: "twemoji", fonts }
  );
}
