import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          background: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="20,42 50,13 80,42"
            stroke="white"
            strokeWidth="6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 25 42 L 25 75 Q 25 81 31 81 L 60 81"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 75 42 L 75 63 Q 75 81 60 81 Q 50 81 50 90"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="96" r="4" fill="white" />
          <polyline
            points="34,52 38,57 45,47"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="50" y1="52" x2="68" y2="52" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <circle cx="37" cy="63" r="3" fill="white" />
          <line x1="44" y1="63" x2="68" y2="63" stroke="white" strokeWidth="5" strokeLinecap="round" />
          <circle cx="37" cy="73" r="3" fill="white" />
          <line x1="44" y1="73" x2="65" y2="73" stroke="white" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
