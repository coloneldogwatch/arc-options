"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import SegmentControl from "@/components/ui/SegmentControl";

type RankMode = "balanced" | "highest_return" | "highest_pop";

const RESULTS = [
  {
    best: true,
    name: "Iron condor · 440/445 — 510/515",
    credit: "0.82",
    maxProfit: 82,
    maxLoss: -418,
    breakevens: [444, 511],
    pop: 73,
  },
  {
    name: "Bull put spread · 445/440",
    credit: "0.61",
    maxProfit: 61,
    maxLoss: -439,
    breakevens: [444],
    pop: 69,
  },
  {
    name: "Short strangle · 440 / 515",
    credit: "1.94",
    maxProfit: 194,
    maxLoss: null,
    breakevens: [],
    pop: 64,
  },
];

export default function OptimizerPage() {
  const [rankMode, setRankMode] = useState<RankMode>("balanced");
  const [ran, setRan] = useState(true);

  return (
    <div className="p-[26px]">
      <Card className="mb-[18px]">
        <div className="grid grid-cols-4 gap-3.5 items-end">
          <div>
            <div className="text-xs text-text-2 mb-1.5">Symbol</div>
            <input defaultValue="MSFT" aria-label="symbol" />
          </div>
          <div>
            <div className="text-xs text-text-2 mb-1.5">Market bias</div>
            <select aria-label="bias">
              <option>Neutral</option>
              <option>Bullish</option>
              <option>Bearish</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-text-2 mb-1.5">Max risk</div>
            <input defaultValue="$500" aria-label="max risk" />
          </div>
          <div>
            <div className="text-xs text-text-2 mb-1.5">Expiry window</div>
            <select aria-label="expiry">
              <option>20–45 DTE</option>
              <option>0–14 DTE</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3.5 mt-4">
          <span className="text-[12.5px] text-text-2 whitespace-nowrap">Rank by</span>
          <SegmentControl
            options={[
              { value: "balanced", label: "Balanced blend" },
              { value: "highest_return", label: "Highest return" },
              { value: "highest_pop", label: "Highest prob. of profit" },
            ]}
            value={rankMode}
            onChange={(v) => setRankMode(v as RankMode)}
            className="flex-1"
          />
          <Button variant="primary" className="px-[18px] py-[9px]" onClick={() => setRan(true)}>
            Optimize
          </Button>
        </div>
      </Card>

      {ran && (
        <>
          <div className="text-[12.5px] text-text-2 mb-3">
            Ranked 52 candidate structures from the live chain
          </div>
          <div className="flex flex-col gap-3">
            {RESULTS.map((r, i) => (
              <Card
                key={i}
                className="grid items-center gap-3.5"
                style={{
                  gridTemplateColumns: "1fr auto",
                  border: r.best ? "2px solid var(--accent)" : undefined,
                }}
              >
                <div>
                  {r.best && (
                    <Tag variant="accent" className="mr-2">
                      Best fit
                    </Tag>
                  )}
                  <span className="font-semibold">{r.name}</span>
                  <div className="font-mono text-[12.5px] text-text-2 mt-2 flex gap-2 flex-wrap">
                    <span>Credit ${r.credit}</span>
                    <span>·</span>
                    <span>
                      Max <span className="text-pos">+${r.maxProfit}</span> /{" "}
                      <span className="text-neg">
                        {r.maxLoss !== null ? `−$${Math.abs(r.maxLoss)}` : "undefined"}
                      </span>
                    </span>
                    {r.breakevens.length > 0 && (
                      <>
                        <span>·</span>
                        <span>BE {r.breakevens.join(" / ")}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>P.o.P. {r.pop}%</span>
                  </div>
                </div>
                <Link href="/builder">
                  <Button>Open{r.best ? " in builder →" : " →"}</Button>
                </Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
