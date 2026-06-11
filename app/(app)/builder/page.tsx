"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SegmentControl from "@/components/ui/SegmentControl";
import { BuilderProvider, useBuilder } from "@/components/builder/BuilderContext";
import ExpiryTabs from "@/components/builder/ExpiryTabs";
import StrikeRail from "@/components/builder/StrikeRail";
import StatsRow from "@/components/builder/StatsRow";
import PnlMatrix from "@/components/builder/PnlMatrix";
import PnlChart from "@/components/builder/PnlChart";
import LegsList from "@/components/builder/LegsList";
import { strategyStats } from "@/lib/math/blackScholes";
import { createPosition } from "@/lib/actions/positions";

function BuilderInner() {
  const { state, dispatch } = useBuilder();
  const [thesis, setThesis] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="p-[26px]">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-4 flex-wrap">
        <div>
          <div className="font-display font-medium text-[17px]">Bull put spread</div>
        </div>
        <div className="flex items-center gap-2 ml-3.5 text-[13px]">
          <span className="text-text-2">{state.symbol}</span>
          <span className="font-mono font-medium text-[16px]">${state.spot}</span>
          <span className="text-[10px] font-semibold text-pos bg-pos-soft px-1.5 py-0.5 rounded-[5px] tracking-[0.03em]">
            REAL-TIME
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/library">
            <Button>📚 Strategies</Button>
          </Link>
          <Link href="/optimizer">
            <Button>🎯 Optimize</Button>
          </Link>
          <Link href="/checklist">
            <Button>Run checklist</Button>
          </Link>
          <Button
              variant="primary"
              disabled={isPending}
              onClick={() => {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + Math.round(state.dte));
                const expirationDate = expiry.toISOString().split("T")[0];
                const stats = strategyStats(state.legs, state.spot, state.ivPct / 100, state.dte);
                startTransition(async () => {
                  const { positionId } = await createPosition({
                    symbol: state.symbol,
                    strategyName: "Bull put spread",
                    legs: state.legs,
                    entryThesis: thesis.trim() || undefined,
                    entryCredit: Math.max(0, stats.netCredit / 100),
                    expirationDate,
                  });
                  router.push(`/checklist?positionId=${positionId}`);
                });
              }}
            >
              {isPending ? "Saving…" : "Save & log →"}
            </Button>
        </div>
      </div>

      {/* Expiry tabs */}
      <div className="text-xs text-text-2 mb-1.5">
        Expiration · <span>{state.dte}d</span>
      </div>
      <ExpiryTabs />

      {/* Strike rail */}
      <Card className="py-3.5 px-[18px] mb-4">
        <div className="text-xs text-text-2 flex mb-1">
          <span>Strikes</span>
          <span className="ml-auto text-text-3">drag the pills · or step below</span>
        </div>
        <StrikeRail />
      </Card>

      {/* Stats */}
      <StatsRow />

      {/* View toggle */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <SegmentControl
          options={[
            { value: "table", label: "📋 Table" },
            { value: "graph", label: "📈 Graph" },
          ]}
          value={state.view}
          onChange={(v) => dispatch({ type: "SET_VIEW", view: v })}
          className="max-w-[200px]"
        />
        <SegmentControl
          options={[
            { value: "usd", label: "P/L $" },
            { value: "pct", label: "P/L % of risk" },
          ]}
          value={state.mode}
          onChange={(v) => dispatch({ type: "SET_MODE", mode: v })}
          className="max-w-[320px] ml-auto"
        />
      </div>

      {/* P&L view */}
      {state.view === "table" ? (
        <div className="mb-[18px]">
          <PnlMatrix />
        </div>
      ) : (
        <Card className="mb-[18px]">
          <PnlChart />
        </Card>
      )}

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-4 mb-[18px]">
        <div className="flex items-center gap-3 text-[12.5px] text-text-2">
          <span className="whitespace-nowrap">Price range</span>
          <input
            type="range"
            min={3}
            max={15}
            step={0.1}
            value={state.rangePct}
            onChange={(e) => dispatch({ type: "SET_RANGE", rangePct: parseFloat(e.target.value) })}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="font-mono font-medium text-text min-w-[48px] text-right">
            ±{state.rangePct.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12.5px] text-text-2">
          <span className="whitespace-nowrap">Implied vol</span>
          <input
            type="range"
            min={20}
            max={150}
            step={1}
            value={state.ivPct}
            onChange={(e) => dispatch({ type: "SET_IV", ivPct: parseInt(e.target.value) })}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="font-mono font-medium text-text min-w-[48px] text-right">
            {state.ivPct}%
          </span>
        </div>
      </div>

      {/* Legs + Thesis */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <LegsList />
        <div>
          <div className="text-xs text-text-2 mb-1.5">Why this trade? (thesis, saved at entry)</div>
          <textarea
            rows={4}
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="e.g. SOFI holding the 105 area; selling the 107/102 put spread to collect premium into a quiet 2-day window. Defined risk."
          />
          <Button
            variant="primary"
            className="w-full mt-3"
            disabled={thesis.trim().length === 0 || isPending}
            onClick={() => {
              const expiry = new Date();
              expiry.setDate(expiry.getDate() + Math.round(state.dte));
              const expirationDate = expiry.toISOString().split("T")[0];
              const stats = strategyStats(state.legs, state.spot, state.ivPct / 100, state.dte);
              startTransition(async () => {
                const { positionId } = await createPosition({
                  symbol: state.symbol,
                  strategyName: "Bull put spread",
                  legs: state.legs,
                  entryThesis: thesis.trim(),
                  entryCredit: Math.max(0, stats.netCredit / 100),
                  expirationDate,
                });
                router.push(`/checklist?positionId=${positionId}`);
              });
            }}
          >
            {isPending ? "Saving…" : "Log position with thesis →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <BuilderProvider>
      <BuilderInner />
    </BuilderProvider>
  );
}
