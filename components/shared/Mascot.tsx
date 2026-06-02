/**
 * Mascote do Acabou? — uma sacola de compras simpática.
 * Desenhada em SVG inline (sem imagem externa): leve, nítida em qualquer
 * tela e fácil de variar de "humor". Dá personalidade às telas vazias,
 * onboarding e notificações — como recomendam os melhores apps.
 *
 * mood:
 *  - "happy"  → sorrindo (tela vazia acolhedora)
 *  - "search" → procurando, com lupa (busca sem resultado)
 *  - "done"   → comemorando, olhos felizes (tudo em dia)
 */
export function Mascot({
  mood = "happy",
  size = 120,
  className = "",
}: {
  mood?: "happy" | "search" | "done";
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={`animate-bob ${className}`}
      aria-hidden="true"
    >
      {/* Sombra suave */}
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#16a34a" fillOpacity="0.12" />

      {/* Alças da sacola */}
      <path
        d="M44 44V34a16 16 0 0132 0v10"
        stroke="#15803d"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Corpo da sacola */}
      <path
        d="M30 44h60l-4 56a6 6 0 01-6 5.5H40a6 6 0 01-6-5.5L30 44z"
        fill="#22c55e"
      />
      {/* Brilho lateral */}
      <path d="M36 50l3 50a4 4 0 004 4" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* Bochechas */}
      <circle cx="46" cy="76" r="5" fill="#fb7185" fillOpacity="0.55" />
      <circle cx="74" cy="76" r="5" fill="#fb7185" fillOpacity="0.55" />

      {/* Olhos */}
      {mood === "done" ? (
        <>
          {/* olhos felizes (^ ^) */}
          <path d="M44 70q4-5 8 0" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M68 70q4-5 8 0" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="48" cy="70" r="4.5" fill="#fff" />
          <circle cx="72" cy="70" r="4.5" fill="#fff" />
          <circle cx={mood === "search" ? "49.5" : "48"} cy="70" r="2.2" fill="#14532d" />
          <circle cx={mood === "search" ? "73.5" : "72"} cy="70" r="2.2" fill="#14532d" />
        </>
      )}

      {/* Boca */}
      {mood === "search" ? (
        <circle cx="60" cy="84" r="3.5" fill="#14532d" fillOpacity="0.85" />
      ) : (
        <path d="M52 82q8 8 16 0" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}

      {/* Lupa (modo busca) */}
      {mood === "search" && (
        <g>
          <circle cx="90" cy="86" r="9" stroke="#15803d" strokeWidth="4" fill="#fff" fillOpacity="0.9" />
          <line x1="97" y1="93" x2="104" y2="100" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
