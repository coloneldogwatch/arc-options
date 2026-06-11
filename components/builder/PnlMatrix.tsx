"use client";

import { useMemo } from "react";
import { pnlAt, expiryPnl, strategyStats } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";

const ROWS = 15;
const COLS = 6;
const COL_LABELS = ["Jun 10", "Jun 10", "Jun 11", "Jun 11", "Jun 12", "Exp"];
const COL_SUB = ["now", "", "", "", "", "expiry"];

export default function PnlMatrix() {
  const { state } = useBuilder();
  const { legs, spot, ivPct, dte, rangePct, mode } = state;
  const iv = ivPct / 100;

  const { rows, stats } = useMemo(() => {
    const stats = strategyStats(legs, spot, iv, dte);
    const span = spot * rangePct / 100;
    const colDays = Array.from({ length: COLS }, (_, i) => dte * i / (COLS - 1));

    const rows = Array.from({ length: ROWS }, (_, ri) => {
      const P = spot + span - (2 * span) * ri / (ROWS - 1);
      const pct = (P - spot) / spot * 100;
      const cells = colDays.map((elapsed, ci) => {
        const v = ci === COLS - 1
          ? expiryPnl(legs, P, spot, iv, dte)
          : pnlAt(legs, P, elapsed, spot, iv, dte);
        return v;
      });
      const expiryV = cells[COLS - 1];
      return { P, pct, cells, isProfit: expiryV >= 0 };
    });

    return { rows, stats };
  }, [legs, spot, iv, dte, rangePct]);

  function cellBg(v: number): string {
    const mp = stats.maxProfit, ml = stats.maxLoss;
    if (v >= 0) {
      const a = Math.min(1, v / Math.max(mp, 1)) * 0.92 * 0.85;
      return `rgba(29,158,117,${a.toFixed(3)})`;
    } else {
      const a = Math.min(1, Math.abs(v) / Math.max(Math.abs(ml), 1)) * 0.92 * 0.85;
      return `rgba(226,75,74,${a.toFixed(3)})`;
    }
  }

  function fmtCell(v: number): string {
    if (mode === "usd") {
      return (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(0);
    }
    const ml = stats.maxLoss;
    const pct = ml !== 0 ? (v / Math.abs(ml)) * 100 : 0;
    return (pct >= 0 ? "+" : "−") + Math.abs(pct).toFixed(0) + "%";
  }

  // Find breakeven row transitions
  let prevIsProfit: boolean | null = null;

  return (
    <div className="overflow-x-auto border border-border/10 rounded-lg bg-white">
      <table className="border-collapse w-full" style={{ tableLayout: "auto" }}>
        <thead>
          <tr>
            <th
              className="sticky left-0 text-[10.5px] font-medium text-[#5F5F66] px-3 py-2 text-left"
              style={{ background: "#F6F6F4", borderBottom: "1px solid #E6E6E2", minWidth: "92px" }}
            >
              Price
            </th>
            {COL_LABELS.map((lbl, ci) => (
              <th
                key={ci}
                className="text-[10.5px] font-medium text-[#5F5F66] px-2 py-2 text-center"
                style={{ background: "#F6F6F4", borderBottom: "1px solid #E6E6E2" }}
              >
                {lbl}
                {COL_SUB[ci] && (
                  <span className="block font-normal text-[#9A9AA3]">{COL_SUB[ci]}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const transition = prevIsProfit !== null && prevIsProfit !== row.isProfit;
            prevIsProfit = row.isProfit;
            return (
              <tr
                key={ri}
                style={transition ? { borderTop: "1.5px dashed #B9B9B2" } : undefined}
              >
                <td
                  className="sticky left-0 font-mono text-[12px] px-3 py-1.5 font-medium text-[#16161A]"
                  style={{ background: "#F6F6F4", borderRight: "1px solid #E6E6E2" }}
                >
                  ${row.P.toFixed(row.P < 200 ? 2 : 0)}
                  <small className="text-[#9A9AA3] font-normal ml-1.5">
                    {row.pct >= 0 ? "+" : ""}{row.pct.toFixed(1)}%
                  </small>
                </td>
                {row.cells.map((v, ci) => (
                  <td
                    key={ci}
                    className="font-mono text-[12px] px-2 py-1.5 text-center text-[#16161A] whitespace-nowrap"
                    style={{ background: cellBg(v) }}
                  >
                    {fmtCell(v)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
