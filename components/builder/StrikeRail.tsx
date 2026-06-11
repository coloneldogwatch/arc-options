"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { strategyStats } from "@/lib/math/blackScholes";
import { useBuilder } from "./BuilderContext";

const AXLO = 60, AXHI = 150;

function priceToPct(p: number) { return (p - AXLO) / (AXHI - AXLO) * 100; }
function pctToPrice(pc: number) { return AXLO + pc / 100 * (AXHI - AXLO); }

export default function StrikeRail() {
  const { state, dispatch } = useBuilder();
  const { legs, spot, ivPct, dte } = state;
  const iv = ivPct / 100;
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ idx: number; startX: number; moved: boolean } | null>(null);

  const stats = useMemo(() => strategyStats(legs, spot, iv, dte), [legs, spot, iv, dte]);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging || !railRef.current) return;
    if (Math.abs(e.clientX - dragging.startX) > 4) {
      const b = railRef.current.getBoundingClientRect();
      const pc = Math.max(0, Math.min(100, (e.clientX - b.left) / b.width * 100));
      const newStrike = Math.round(pctToPrice(pc) * 2) / 2;
      dispatch({ type: "SET_STRIKE", index: dragging.idx, strike: newStrike });
      setDragging(d => d ? { ...d, moved: true } : d);
    }
  }, [dragging, dispatch]);

  const onPointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // Volume bars (decorative — would come from real chain)
  const bars = Array.from({ length: 70 }, (_, i) => {
    const up = (i * 7 + 13) % 17 > 7;
    const h = 6 + ((i * 13 + 7) % 30);
    return { up, h };
  });

  return (
    <div
      ref={railRef}
      className="relative mx-1.5 mb-2"
      style={{ height: "96px", marginTop: "30px" }}
    >
      {/* Volume bars */}
      {bars.map((bar, i) => (
        <div
          key={i}
          className="absolute w-[3px] rounded-[2px]"
          style={{
            left: `${(i / 70) * 100}%`,
            height: `${bar.h}px`,
            ...(bar.up
              ? { bottom: "52px", background: "rgba(29,158,117,.30)" }
              : { top: "52px", background: "rgba(226,75,74,.26)" }),
          }}
        />
      ))}

      {/* Axis line */}
      <div className="absolute left-0 right-0 top-12 h-px border-t border-border-strong" />

      {/* Price ticks */}
      {[70, 80, 90, 100, 110, 120, 130, 140].map((p) => (
        <div
          key={p}
          className="absolute font-mono text-[10px] text-text-3"
          style={{ left: `${priceToPct(p)}%`, top: "54px", transform: "translateX(-50%)" }}
        >
          {p}
        </div>
      ))}

      {/* Spot marker */}
      <div
        className="absolute text-[11px] font-medium text-text-2 text-center"
        style={{ left: `${priceToPct(spot)}%`, top: "30px", transform: "translateX(-50%)" }}
      >
        NOW
        <div className="text-[10px] text-center">▼</div>
      </div>

      {/* Breakeven dashes */}
      {stats.breakevens.map((be, i) => (
        <div
          key={i}
          className="absolute top-11 border-l-[1.5px] border-dashed border-warn"
          style={{ left: `${priceToPct(be)}%`, height: "10px" }}
        />
      ))}

      {/* Leg pills */}
      {legs.map((leg, i) => (
        <div
          key={i}
          className={[
            "absolute px-2 py-[3px] rounded-[7px] text-white font-mono font-medium text-[11px] cursor-grab select-none",
            leg.excluded ? "opacity-40 line-through" : "",
          ].join(" ")}
          style={{
            left: `${priceToPct(leg.strike)}%`,
            top: "60px",
            transform: "translateX(-50%)",
            background: leg.side === "short" ? "var(--neg)" : "var(--accent)",
            touchAction: "none",
          }}
          onPointerDown={(e) => {
            setDragging({ idx: i, startX: e.clientX, moved: false });
            e.preventDefault();
          }}
        >
          {leg.qty > 1 ? `${leg.qty}×` : ""}{leg.strike}{leg.type === "call" ? "C" : "P"}
        </div>
      ))}
    </div>
  );
}
