"use client";

import { useMemo } from "react";
import { expiryPnl, pnlAt, strategyStats } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";

export default function PnlChart() {
  const { state } = useBuilder();
  const { legs, spot, ivPct, dte } = state;
  const iv = ivPct / 100;

  const svg = useMemo(() => {
    const stats = strategyStats(legs, spot, iv, dte);
    const strikes = legs.map((l) => l.strike);
    const lo = Math.min(...strikes) - 15;
    const hi = Math.max(...strikes) + 15;
    const W = 620, H = 210, L = 30, R = 600, T = 18, B = 180;
    const pad = (stats.maxProfit - stats.maxLoss) * 0.12 || 10;
    const maxY = stats.maxProfit + pad;
    const minY = stats.maxLoss - pad;

    const X = (p: number) => L + ((p - lo) / (hi - lo)) * (R - L);
    const Y = (v: number) => T + ((maxY - v) / (maxY - minY)) * (B - T);
    const zeroY = Y(0);

    const N = 160;
    const expiryPts = Array.from({ length: N + 1 }, (_, i) => {
      const p = lo + (hi - lo) * i / N;
      return `${X(p).toFixed(1)},${Y(expiryPnl(legs, p, spot, iv, dte)).toFixed(1)}`;
    });
    const todayPts = Array.from({ length: N + 1 }, (_, i) => {
      const p = lo + (hi - lo) * i / N;
      return `${X(p).toFixed(1)},${Y(pnlAt(legs, p, 0, spot, iv, dte)).toFixed(1)}`;
    });
    const beCircles = stats.breakevens
      .map((be) => `<circle cx="${X(be).toFixed(1)}" cy="${zeroY.toFixed(1)}" r="3.5" fill="var(--warn)"/>`)
      .join("");

    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} aria-label="Payoff at expiration">
        <line x1={L} y1={zeroY} x2={R} y2={zeroY} stroke="var(--border-strong)" />
        <line x1={X(spot)} y1={T} x2={X(spot)} y2={B} stroke="var(--text-3)" strokeDasharray="3 4" />
        <polyline points={todayPts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
        <polyline points={expiryPts.join(" ")} fill="none" stroke="var(--pos)" strokeWidth="2.5" strokeLinejoin="round" />
        <g dangerouslySetInnerHTML={{ __html: beCircles }} />
        <text x={X(spot)} y={198} textAnchor="middle" fontSize="11" fill="var(--text-2)" fontFamily="IBM Plex Mono">spot {spot}</text>
        <text x={R - 2} y={T + 10} textAnchor="end" fontSize="10" fill="var(--text-3)">solid = expiry · dashed = today</text>
      </svg>
    );
  }, [legs, spot, iv, dte]);

  return <div className="p-4">{svg}</div>;
}
