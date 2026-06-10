import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Imagem de preview (Open Graph) — aparece quando o link é compartilhado no
// WhatsApp / Facebook / Instagram. Gerada no build (1200x630), seguindo o MESMO
// estilo do banner premium da Play Store: logo oficial + "Acabou?" + tagline +
// pílula + Sacolino, no verde da marca (#1E9839).
export const runtime = "nodejs";
export const alt = "Acabou? — Sua casa sempre sabe o que precisa comprar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function dataUri(relPath: string): string {
  const buf = readFileSync(join(process.cwd(), relPath));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export default async function OpengraphImage() {
  // Logo OFICIAL (cópia versionada de marketing/Logos/Logo.png, que é gitignorada
  // → daria ENOENT na Vercel). Mesma logo do banner da Play Store = padrão único.
  const logo = dataUri("public/logo-oficial.png");
  const mascote = dataUri("public/mascote/sacolino-acenando.png");

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1E9839",
          padding: "60px 70px",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Bloco de texto (à esquerda) */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 690, zIndex: 2 }}>
          {/* Brandrow: logo oficial + "Acabou?" */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <img
              src={logo}
              width={104}
              height={104}
              style={{ borderRadius: 24, border: "3px solid rgba(255,255,255,0.55)" }}
              alt=""
            />
            <div style={{ fontSize: 94, fontWeight: 800, color: "#ffffff", letterSpacing: "-2px" }}>
              Acabou?
            </div>
          </div>

          <div
            style={{
              fontSize: 42,
              color: "#eafff1",
              fontWeight: 700,
              marginTop: 26,
              lineHeight: 1.2,
            }}
          >
            Sua casa sempre sabe o que precisa comprar.
          </div>

          <div style={{ display: "flex", marginTop: 32 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.16)",
                border: "2px solid rgba(255,255,255,0.45)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 27,
                padding: "11px 28px",
                borderRadius: 999,
              }}
            >
              acabouapp.com.br
            </div>
          </div>
        </div>

        {/* Sacolino (à direita, encostado embaixo — igual o banner) */}
        <img
          src={mascote}
          width={460}
          height={460}
          style={{ position: "absolute", right: 20, bottom: 0 }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
