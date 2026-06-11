"use client";

import { useEffect, useRef } from "react";
import { legGreeks } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";

type Props = {
  legIndex: number;
  onClose: () => void;
};

export default function LegPopover({ legIndex, onClose }: Props) {
  const { state, dispatch } = useBuilder();
  const ref = useRef<HTMLDivElement>(null);
  const { legs, spot, ivPct, dte } = state;
  const leg = legs[legIndex];
  const iv = ivPct / 100;
  const t0 = dte / 365;

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [onClose]);

  if (!leg) return null;

  const g = legGreeks(leg, spot, t0, iv);
  const bid = Math.max(0, g.price - 0.05);
  const ask = g.price + 0.05;
  const vol = 300 + Math.round((leg.strike * 7) % 500);
  const oi = 200 + Math.round((leg.strike * 13) % 420);

  function cell(label: string, val: string) {
    return (
      <div className="flex justify-between text-[12.5px] py-0.5">
        <span className="text-text-2">{label}</span>
        <span className="font-mono font-medium">{val}</span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="fixed z-[60] w-[300px] bg-surface border border-border/10 rounded-xl shadow-2xl overflow-hidden text-[13px]"
      style={{ top: "30%", left: "50%", transform: "translateX(-50%)" }}
    >
      <div className="px-4 py-[11px] font-semibold bg-surface-2 border-b border-border/10 font-display">
        NOW {leg.strike}{leg.type === "call" ? "C" : "P"} · {dte}d
      </div>

      <div className="grid grid-cols-2 border-b border-border/10">
        <div className="px-4 py-3 text-center border-r border-border/10">
          <div className="text-xs text-text-2 mb-1.5">Quantity</div>
          <div className="flex items-center justify-center gap-2.5">
            <button
              className="w-[26px] h-[26px] rounded-full border border-border-strong flex items-center justify-center text-[15px] hover:bg-surface-2"
              onClick={() => {
                const sgn = (leg.side === "short" ? -1 : 1) * leg.qty - 1 || -2;
                dispatch({ type: "UPDATE_LEG", index: legIndex, leg: { side: sgn < 0 ? "short" : "long", qty: Math.abs(sgn) } });
              }}
            >
              ‹
            </button>
            <span className="font-semibold text-[16px] min-w-[30px] text-center">
              {(leg.side === "short" ? -1 : 1) * leg.qty}
            </span>
            <button
              className="w-[26px] h-[26px] rounded-full border border-border-strong flex items-center justify-center text-[15px] hover:bg-surface-2"
              onClick={() => {
                const sgn = (leg.side === "short" ? -1 : 1) * leg.qty + 1 || 2;
                dispatch({ type: "UPDATE_LEG", index: legIndex, leg: { side: sgn < 0 ? "short" : "long", qty: Math.abs(sgn) } });
              }}
            >
              ›
            </button>
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-xs text-text-2 mb-1.5">Price</div>
          <div className="font-semibold text-[18px] font-mono">${g.price.toFixed(2)}</div>
        </div>
      </div>

      <div className="px-4 py-2.5 grid grid-cols-2 gap-x-4 border-b border-border/10">
        {cell("Bid", "$" + bid.toFixed(2))}
        {cell("Ask", "$" + ask.toFixed(2))}
        {cell("Volume", vol.toString())}
        {cell("OI", oi.toString())}
        {cell("IV", ivPct.toFixed(1) + "%")}
        {cell("Delta", (g.delta >= 0 ? "" : "−") + Math.abs(g.delta).toFixed(2))}
        {cell("Theta", (g.theta >= 0 ? "" : "−") + Math.abs(g.theta).toFixed(2))}
        {cell("Gamma", (g.gamma >= 0 ? "" : "−") + Math.abs(g.gamma).toFixed(4))}
        {cell("Vega", (g.vega >= 0 ? "" : "−") + Math.abs(g.vega).toFixed(4))}
        {cell("Rho", (g.rho >= 0 ? "" : "−") + Math.abs(g.rho).toFixed(4))}
      </div>

      {[
        { action: "switch", icon: "↔", label: `Switch to ${leg.type === "call" ? "Put" : "Call"}` },
        { action: "flip", icon: "✓", label: leg.side === "short" ? "Buy to close" : "Sell to close" },
        { action: "excl", icon: "○", label: leg.excluded ? "Include" : "Exclude" },
        { action: "rm", icon: "×", label: "Remove", danger: true },
      ].map((item) => (
        <div
          key={item.action}
          className={[
            "flex items-center gap-2.5 px-4 py-[11px] cursor-pointer border-b border-border/10 last:border-none",
            item.danger ? "text-neg" : "hover:bg-surface-2",
          ].join(" ")}
          onClick={() => {
            if (item.action === "switch") {
              dispatch({ type: "UPDATE_LEG", index: legIndex, leg: { type: leg.type === "call" ? "put" : "call" } });
            } else if (item.action === "flip") {
              dispatch({ type: "UPDATE_LEG", index: legIndex, leg: { side: leg.side === "short" ? "long" : "short" } });
            } else if (item.action === "excl") {
              dispatch({ type: "UPDATE_LEG", index: legIndex, leg: { excluded: !leg.excluded } });
            } else if (item.action === "rm") {
              if (legs.length > 1) dispatch({ type: "REMOVE_LEG", index: legIndex });
              onClose();
            }
          }}
        >
          <span className="text-[17px] text-text-2 w-4">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
}
