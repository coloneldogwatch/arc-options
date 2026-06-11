"use client";

import { useMemo } from "react";
import { strategyStats, netCredit } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";

export default function StatsRow() {
  const { state } = useBuilder();
  const { legs, spot, ivPct, dte } = state;
  const iv = ivPct / 100;

  const stats = useMemo(() => strategyStats(legs, spot, iv, dte), [legs, spot, iv, dte]);
  const credit = netCredit(legs, spot, iv, dte);
  const margin = Math.abs(stats.maxLoss) + Math.max(credit, 0);

  const items = [
    ["Net credit", (credit >= 0 ? "$" : "−$") + Math.abs(credit).toFixed(0), "var(--text)"],
    ["Est. margin", "$" + margin.toFixed(0), "var(--text)"],
    ["Max loss", "−$" + Math.abs(stats.maxLoss).toFixed(0), "var(--neg)"],
    ["Max profit", "$" + stats.maxProfit.toFixed(0), "var(--pos)"],
    ["Chance of profit", Math.round(stats.probabilityOfProfit) + "%", "var(--text)"],
    [
      "Breakeven",
      stats.breakevens.length ? "$" + stats.breakevens[0].toFixed(2) : "—",
      "var(--text)",
    ],
  ];

  return (
    <div className="flex flex-wrap gap-2 my-2 mb-[18px]">
      {items.map(([label, value, color]) => (
        <div key={label} className="flex-1 min-w-[130px] bg-surface-2 rounded p-[10px_13px]">
          <div className="text-[10.5px] uppercase tracking-[0.04em] text-text-2">{label}</div>
          <div
            className="font-mono font-medium text-[17px] mt-0.5"
            style={{ color: color as string }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}
