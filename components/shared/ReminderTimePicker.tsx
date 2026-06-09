"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Seletor de horário do lembrete — 100% nosso (não usa o relógio nativo do
 * sistema, que cortava o botão e ficava diferente em cada aparelho).
 *
 * - Atalhos de 1 toque (Manhã / Meio-dia / Tardinha / Noite) — intuitivo.
 * - "Outro horário" → seletores de Hora:Minuto (minutos em passos de 15,
 *   alinhados ao cron que roda a cada 15 min).
 */

const PRESETS = [
  { label: "Manhã", time: "08:00", emoji: "🌄" },
  { label: "Meio-dia", time: "12:00", emoji: "☀️" },
  { label: "Tardinha", time: "18:00", emoji: "🌇" },
  { label: "Noite", time: "20:00", emoji: "🌙" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function fmt(label: string) {
  return label.replace(":", "h");
}

export function ReminderTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const matchesPreset = PRESETS.some((p) => p.time === value);
  const [custom, setCustom] = useState(!matchesPreset);

  const [h, m] = (value || "08:00").split(":");
  const hour = HOURS.includes(h) ? h : "08";
  const minute = MINUTES.includes(m) ? m : "00";

  return (
    <div className="space-y-2.5">
      {/* Atalhos de 1 toque */}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => {
          const active = !custom && value === p.time;
          return (
            <button
              key={p.time}
              type="button"
              disabled={disabled}
              onClick={() => {
                setCustom(false);
                onChange(p.time);
              }}
              className={cn(
                // "afundadinho" (scale-95) suave SÓ no botão tocado; sem opacity no
                // disabled → os outros não piscam/balançam ao escolher um horário.
                "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-100 active:scale-95 disabled:cursor-not-allowed",
                active
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
              <span className="text-xs text-gray-400">{fmt(p.time)}</span>
            </button>
          );
        })}
      </div>

      {/* Outro horário */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setCustom(true)}
        className={cn(
          "w-full rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-100 active:scale-[0.98] disabled:cursor-not-allowed",
          custom
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        )}
      >
        🕐 Outro horário
      </button>

      {custom && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <select
            aria-label="Hora"
            disabled={disabled}
            value={hour}
            onChange={(e) => onChange(`${e.target.value}:${minute}`)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-semibold text-gray-800 disabled:opacity-50"
          >
            {HOURS.map((hh) => (
              <option key={hh} value={hh}>
                {hh}
              </option>
            ))}
          </select>
          <span className="text-xl font-bold text-gray-400">:</span>
          <select
            aria-label="Minuto"
            disabled={disabled}
            value={minute}
            onChange={(e) => onChange(`${hour}:${e.target.value}`)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-base font-semibold text-gray-800 disabled:opacity-50"
          >
            {MINUTES.map((mm) => (
              <option key={mm} value={mm}>
                {mm}
              </option>
            ))}
          </select>
          <span className="ml-1 text-sm text-gray-500">horas</span>
        </div>
      )}
    </div>
  );
}
