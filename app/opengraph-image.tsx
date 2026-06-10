import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Imagem de preview (Open Graph) — aparece ao compartilhar o link no WhatsApp /
// Facebook / Instagram. Gerada no build (1200x630), no MESMO padrão do banner da
// Play Store: logo oficial + "Acabou?" em Poppins ExtraBold + frase + pílula CTA
// + Sacolino, no verde da marca (#1E9839).
export const runtime = "nodejs";
export const alt = "Acabou? — Nunca mais falta nada em casa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function file(relPath: string): Buffer {
  return readFileSync(join(process.cwd(), relPath));
}
function dataUri(relPath: string): string {
  return `data:image/png;base64,${file(relPath).toString("base64")}`;
}

export default async function OpengraphImage() {
  // Logo OFICIAL versionada (marketing/Logos é gitignorada → daria ENOENT).
  const logo = dataUri("public/logo-oficial.png");
  const mascote = dataUri("public/mascote/sacolino-feliz.png");
  const poppinsExtra = file("public/fonts/Poppins-ExtraBold.ttf");
  const poppinsBold = file("public/fonts/Poppins-Bold.ttf");

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#1E9839",
          padding: "60px 68px",
          fontFamily: "Poppins",
          overflow: "hidden",
        }}
      >
        {/* Bloco de texto (à esquerda) */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 660, zIndex: 2 }}>
          {/* Brandrow: logo oficial + "Acabou?" */}
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img
              src={logo}
              width={104}
              height={104}
              style={{ borderRadius: 24, border: "3px solid rgba(255,255,255,0.55)" }}
              alt=""
            />
            <div style={{ fontSize: 112, fontWeight: 800, color: "#ffffff", letterSpacing: "-3px" }}>
              Acabou?
            </div>
          </div>

          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "#ffffff",
              marginTop: 26,
              lineHeight: 1.08,
              maxWidth: 540,
            }}
          >
            Nunca mais falta nada em casa
          </div>

          <div style={{ display: "flex", marginTop: 34 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.16)",
                border: "2px solid rgba(255,255,255,0.5)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 31,
                padding: "13px 34px",
                borderRadius: 999,
              }}
            >
              14 dias grátis · sem cartão
            </div>
          </div>
        </div>

        {/* Sacolino (joinha) à direita, encostado embaixo — igual o banner */}
        <img
          src={mascote}
          width={500}
          height={500}
          style={{ position: "absolute", right: 16, bottom: -6 }}
          alt=""
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: poppinsBold, weight: 700, style: "normal" },
        { name: "Poppins", data: poppinsExtra, weight: 800, style: "normal" },
      ],
    }
  );
}
