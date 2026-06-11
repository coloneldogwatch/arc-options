"use client";

import { useState } from "react";
import { optionValue } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";
import LegPopover from "./LegPopover";

export default function LegsList() {
  const { state, dispatch } = useBuilder();
  const { legs, spot, ivPct, dte } = state;
  const iv = ivPct / 100;
  const t0 = dte / 365;

  const [popLeg, setPopLeg] = useState<number | null>(null);

  return (
    <div>
      <div className="text-xs text-text-2 mb-1.5 flex items-center">
        <span>Legs</span>
        <span className="ml-auto text-text-3 text-[11px]">step strikes → live recalc</span>
      </div>
      <div className="bg-surface border border-border/10 rounded-lg px-4 py-1.5">
        {legs.map((leg, i) => {
          const price = optionValue(leg, spot, t0, iv);
          return (
            <div
              key={i}
              className={[
                "flex items-center gap-2 py-[7px] text-[12.5px] border-b border-border/10 last:border-none",
                leg.excluded ? "opacity-45" : "",
              ].join(" ")}
            >
              <span
                className="font-semibold w-3.5 text-center"
                style={{ color: leg.side === "short" ? "var(--neg)" : "var(--accent)" }}
              >
                {leg.side === "short" ? "−" : "+"}
              </span>
              <span
                className="font-mono cursor-pointer hover:text-accent"
                onClick={() => setPopLeg(i)}
              >
                {leg.qty} {leg.strike}{leg.type === "call" ? "C" : "P"}
                {leg.excluded ? " (excl)" : ""}
                &nbsp;·&nbsp;${price.toFixed(2)}
              </span>
              <div className="ml-auto flex items-center gap-0">
                <button
                  className="w-[26px] h-[26px] flex items-center justify-center text-[15px] rounded-[6px] border border-border-strong hover:bg-surface-2"
                  onClick={() => dispatch({ type: "SET_STRIKE", index: i, strike: leg.strike - 0.5 })}
                >
                  −
                </button>
                <span className="font-mono font-medium text-[13px] min-w-[54px] text-center">{leg.strike}</span>
                <button
                  className="w-[26px] h-[26px] flex items-center justify-center text-[15px] rounded-[6px] border border-border-strong hover:bg-surface-2"
                  onClick={() => dispatch({ type: "SET_STRIKE", index: i, strike: leg.strike + 0.5 })}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {popLeg !== null && (
        <LegPopover
          legIndex={popLeg}
          onClose={() => setPopLeg(null)}
        />
      )}
    </div>
  );
}
