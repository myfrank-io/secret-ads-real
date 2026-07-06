"use client";

import { useState } from "react";

interface Point {
  date: string; // YYYY-MM-DD
  value: number;
}

interface Props {
  title: string;
  data: Point[];
  color: string;
  formatValue: (v: number) => string;
}

const VB_W = 600;
const VB_H = 220;
const PLOT_TOP = 10;
const PLOT_BOTTOM = 196; // baseline
const LABEL_Y = 214;

function frDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Graphique en barres, une seule série (le titre nomme la série — pas de
 * légende nécessaire). Survol : tooltip par barre. Marques fines, extrémités
 * arrondies ancrées à la ligne de base, grille discrète.
 */
export default function BarChart({ title, data, color, formatValue }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.value));
  const n = Math.max(1, data.length);
  const slot = VB_W / n;
  const barW = Math.min(28, slot * 0.6);
  const plotH = PLOT_BOTTOM - PLOT_TOP;

  const maxIndex = data.reduce(
    (best, d, i) => (d.value > data[best].value ? i : best),
    0
  );

  const gridLines = [0.5, 1].map((f) => ({
    y: PLOT_BOTTOM - plotH * f,
    label: formatValue(max * f),
  }));

  return (
    <div className="card" style={{ position: "relative" }}>
      <div className="card-title">{title}</div>
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label={title}
        >
          {gridLines.map((g) => (
            <g key={g.y}>
              <line
                x1={0}
                x2={VB_W}
                y1={g.y}
                y2={g.y}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={4}
                y={g.y - 4}
                fill="var(--ink-3)"
                fontSize={11}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* ligne de base */}
          <line
            x1={0}
            x2={VB_W}
            y1={PLOT_BOTTOM}
            y2={PLOT_BOTTOM}
            stroke="var(--axis)"
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * plotH);
            const x = i * slot + (slot - barW) / 2;
            const y = PLOT_BOTTOM - h;
            const isHover = hover === i;
            return (
              <g key={d.date}>
                {/* extrémité arrondie en haut, ancrée à la base */}
                <path
                  d={`M ${x} ${PLOT_BOTTOM}
                      L ${x} ${y + 4}
                      Q ${x} ${y} ${x + 4} ${y}
                      L ${x + barW - 4} ${y}
                      Q ${x + barW} ${y} ${x + barW} ${y + 4}
                      L ${x + barW} ${PLOT_BOTTOM} Z`}
                  fill={color}
                  opacity={hover === null || isHover ? 1 : 0.45}
                />
                {/* étiquette directe sélective : le maximum uniquement */}
                {i === maxIndex && (
                  <text
                    x={x + barW / 2}
                    y={y - 7}
                    textAnchor="middle"
                    fill="var(--ink-2)"
                    fontSize={11}
                    fontWeight={600}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatValue(d.value)}
                  </text>
                )}
                {/* cible de survol plus large que la marque */}
                <rect
                  x={i * slot}
                  y={PLOT_TOP}
                  width={slot}
                  height={VB_H - PLOT_TOP}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                />
              </g>
            );
          })}

          {/* étiquettes d'axe : première et dernière date */}
          {data.length > 0 && (
            <>
              <text x={4} y={LABEL_Y} fill="var(--ink-3)" fontSize={11}>
                {frDate(data[0].date)}
              </text>
              <text
                x={VB_W - 4}
                y={LABEL_Y}
                textAnchor="end"
                fill="var(--ink-3)"
                fontSize={11}
              >
                {frDate(data[data.length - 1].date)}
              </text>
            </>
          )}
        </svg>

        {hover !== null && data[hover] && (
          <div
            className="chart-tooltip"
            style={{
              left: `${((hover + 0.5) / n) * 100}%`,
              top: `${((PLOT_BOTTOM - (data[hover].value / max) * plotH) / VB_H) * 100}%`,
            }}
          >
            <span className="t-date">{frDate(data[hover].date)} · </span>
            <span className="t-value">{formatValue(data[hover].value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
