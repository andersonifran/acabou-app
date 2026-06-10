import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Imagem de preview (Open Graph) — aparece quando o link é compartilhado no
// WhatsApp / Facebook / Instagram / etc. Gerada no build (1200x630), com a marca.
export const runtime = "nodejs";
export const alt = "Acabou? — Sua casa sempre sabe o que precisa comprar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Embute o Sacolino direto do arquivo (sem depender de rede no build).
  const mascote = readFileSync(
    join(process.cwd(), "public/mascote/sacolino-acenando.png")
  );
  const mascoteSrc = `data:image/png;base64,${mascote.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "70px 84px",
          background: "linear-gradient(135deg, #1E9839 0%, #15803d 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-2px",
            }}
          >
            Acabou?
          </div>
          <div
            style={{
              fontSize: 42,
              color: "rgba(255,255,255,0.96)",
              marginTop: 26,
              lineHeight: 1.25,
            }}
          >
            Sua casa sempre sabe o que precisa comprar.
          </div>
          <div style={{ display: "flex", marginTop: 44 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#ffffff",
                background: "rgba(255,255,255,0.18)",
                padding: "12px 26px",
                borderRadius: 999,
              }}
            >
              acabouapp.com.br
            </div>
          </div>
        </div>

        <img
          src={mascoteSrc}
          width={400}
          height={400}
          style={{ objectFit: "contain" }}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
