"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

const FILTERS = ["All", "Bullish", "Bearish", "Sweeps", "Blocks"];

const FLOW = [
  { ticker: "AMD", structure: "Call sweep · 2.1k ct", premium: "$1.8M", signal: "Bullish" as const },
  { ticker: "META", structure: "Put debit spread · block", premium: "$920K", signal: "Bearish" as const },
  { ticker: "SPY", structure: "Straddle · block", premium: "$3.4M", signal: "Neutral" as const },
  { ticker: "COIN", structure: "Call sweep · 880 ct", premium: "$640K", signal: "Bullish" as const },
];

const signalVariant = {
  Bullish: "green" as const,
  Bearish: "red" as const,
  Neutral: "neutral" as const,
};

export default function FlowPage() {
  const [active, setActive] = useState("All");

  return (
    <div className="p-[26px]">
      <div className="flex flex-wrap gap-2 mb-[18px] items-center">
        {FILTERS.map((f) => (
          <span
            key={f}
            onClick={() => setActive(f)}
            className={[
              "text-[12.5px] px-3 py-1.5 border border-border-strong rounded-[16px] cursor-pointer text-text-2 transition-all select-none",
              active === f
                ? "bg-accent-soft border-transparent text-accent font-medium"
                : "hover:border-accent",
            ].join(" ")}
          >
            {f}
          </span>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[12.5px] text-text-2">
          🔔 3 saved alerts
        </div>
      </div>

      <Card flush>
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "28%" }} />
          </colgroup>
          <thead>
            <tr>
              {["Ticker", "Structure", "Premium", "Signal", ""].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-medium uppercase tracking-[0.05em] text-text-3 py-[11px] px-4 border-b border-border/10"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FLOW.map((f, i) => (
              <tr key={i}>
                <td className="py-[13px] px-4 border-b border-border/10 font-semibold text-[13.5px]">
                  {f.ticker}
                </td>
                <td className="py-[13px] px-4 border-b border-border/10 text-[13.5px]">
                  {f.structure}
                </td>
                <td className="py-[13px] px-4 border-b border-border/10 font-mono text-[13.5px]">
                  {f.premium}
                </td>
                <td className="py-[13px] px-4 border-b border-border/10">
                  <Tag variant={signalVariant[f.signal]}>{f.signal}</Tag>
                </td>
                <td className="py-[13px] px-4 border-b border-border/10">
                  <Link href="/builder" className="text-accent font-medium text-[13.5px] hover:underline">
                    Send to builder →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="text-[12.5px] text-text-2 mt-3">
        Each print is classified into the Arc strategy taxonomy — not shown as raw individual
        contracts.
      </div>
    </div>
  );
}
