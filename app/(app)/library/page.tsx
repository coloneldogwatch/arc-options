"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type Tier = "All" | "Novice" | "Intermediate" | "Advanced" | "Expert";
type Outlook = "Bullish" | "Bearish" | "Neutral" | "Volatility" | "Income";

const OUTLOOK_COLORS: Record<string, [string, string]> = {
  Bullish: ["#16886B", "#E4F3EC"],
  Bearish: ["#C0392B", "#FBE9E7"],
  Neutral: ["#5F5E5A", "#F1EFE8"],
  Volatility: ["#534AB7", "#ECECFB"],
  Income: ["#185FA5", "#E6F1FB"],
  Hedge: ["#9A6300", "#FBF0DC"],
};

const STRATEGIES: [string, Tier, string, string][] = [
  ["Long Call", "Novice", "Basic", "Bullish"],
  ["Long Put", "Novice", "Basic", "Bearish"],
  ["Covered Call", "Novice", "Income", "Income"],
  ["Cash-Secured Put", "Novice", "Income", "Income"],
  ["Protective Put", "Novice", "Other", "Hedge"],
  ["Bull Put Spread", "Intermediate", "Credit spreads", "Bullish"],
  ["Bear Call Spread", "Intermediate", "Credit spreads", "Bearish"],
  ["Iron Butterfly", "Intermediate", "Neutral", "Neutral"],
  ["Iron Condor", "Intermediate", "Neutral", "Neutral"],
  ["Straddle", "Intermediate", "Directional", "Volatility"],
  ["Strangle", "Intermediate", "Directional", "Volatility"],
  ["Bull Call Spread", "Intermediate", "Debit spreads", "Bullish"],
  ["Bear Put Spread", "Intermediate", "Debit spreads", "Bearish"],
  ["Collar", "Intermediate", "Other", "Bullish"],
  ["Short Put", "Advanced", "Naked", "Bullish"],
  ["Short Call", "Advanced", "Naked", "Bearish"],
  ["Short Straddle", "Advanced", "Neutral", "Neutral"],
  ["Short Strangle", "Advanced", "Neutral", "Neutral"],
  ["Jade Lizard", "Advanced", "Other", "Bullish"],
  ["Call Ratio Spread", "Expert", "Ratio spreads", "Bullish"],
  ["Put Ratio Spread", "Expert", "Ratio spreads", "Bearish"],
  ["Long Synthetic Future", "Expert", "Synthetic", "Bullish"],
  ["Double Diagonal", "Expert", "Other", "Neutral"],
];

const DESC: Record<string, string> = {
  "Bull Put Spread":
    "A defined-risk bullish credit spread. Sell a put and buy a further out-of-the-money put for protection. You keep the credit if the stock stays above the short strike; loss is capped at the spread width minus the credit.",
  "Iron Condor":
    "A neutral, defined-risk strategy that profits when the stock stays in a range. Sell an OTM put spread and call spread; you keep the credit if price stays between the short strikes.",
  "Long Call":
    "A simple bullish strategy. Buying a call gives you the right to buy the stock at strike A, so you profit as the stock rises well above A. Your loss is capped at the premium paid.",
  "Long Put":
    "A simple bearish strategy. A put gives you the right to sell the stock at strike A; your maximum loss is capped at the premium paid.",
  "Covered Call":
    "An income strategy: you own 100 shares and sell a call against them to collect premium. Upside is capped above the call strike, while you keep the premium if the stock stays flat or rises modestly.",
  "Iron Butterfly":
    "A neutral, defined-risk strategy with a tighter profit zone than the condor. Sell an ATM straddle and buy protective wings; max profit is at the centre strike.",
  "Straddle":
    "A volatility strategy: buy a call and a put at the same strike. You profit from a large move in either direction; loss is limited to the combined premium if the stock sits still.",
};

function getDesc(name: string, outlook: string, cat: string) {
  if (DESC[name]) return DESC[name];
  const ow = {
    Bullish: "bullish",
    Bearish: "bearish",
    Neutral: "neutral",
    Volatility: "volatility",
    Income: "income",
    Hedge: "hedging",
  }[outlook] ?? "directional";
  return `A ${ow} strategy in the ${cat.toLowerCase()} family. The payoff at expiration is shown above; open it in the builder to model it on a live chain.`;
}

const TIERS: Tier[] = ["All", "Novice", "Intermediate", "Advanced", "Expert"];
const OUTLOOKS: Outlook[] = ["Bullish", "Bearish", "Neutral", "Volatility", "Income"];

function SimplePnlDiagram({ outlook }: { outlook: string }) {
  const isPos = ["Bullish", "Income"].includes(outlook);
  const pts = isPos
    ? "10,90 120,90 200,30 290,30"
    : "10,30 90,30 170,90 290,90";
  return (
    <svg viewBox="0 0 300 110" style={{ width: "100%", height: "auto" }} aria-label="Payoff diagram">
      <line x1="10" y1="60" x2="290" y2="60" stroke="var(--border-strong)" strokeWidth="1" />
      <polyline
        points={pts}
        fill="none"
        stroke="var(--text)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx={isPos ? "120" : "90"} cy="60" r="4" fill="var(--warn)" />
    </svg>
  );
}

export default function LibraryPage() {
  const [tier, setTier] = useState<Tier>("All");
  const [outlook, setOutlook] = useState<Outlook | null>(null);
  const [selected, setSelected] = useState("Long Put");

  const visible = STRATEGIES.filter(
    (s) =>
      (tier === "All" || s[1] === tier) &&
      (!outlook || s[3] === outlook)
  );

  // Group by tier
  const grouped = TIERS.filter((t) => t !== "All").reduce<Record<string, [string, Tier, string, string][]>>(
    (acc, t) => {
      const rows = visible.filter((s) => s[1] === t);
      if (rows.length) acc[t] = rows;
      return acc;
    },
    {}
  );

  const sel = STRATEGIES.find((s) => s[0] === selected);
  const [name, selTier, selCat, selOutlook] = sel ?? ["", "Novice", "", "Neutral"];
  const oc = OUTLOOK_COLORS[selOutlook] ?? OUTLOOK_COLORS["Neutral"];

  return (
    <div className="p-[26px]">
      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 items-center mb-4">
        <span className="text-xs text-text-2 mr-1">Skill</span>
        {TIERS.map((t) => (
          <span
            key={t}
            onClick={() => setTier(t)}
            className={[
              "text-[12.5px] px-3 py-1.5 border border-border-strong rounded-[16px] cursor-pointer text-text-2 transition-all select-none",
              tier === t ? "bg-accent-soft border-transparent text-accent font-medium" : "hover:border-accent",
            ].join(" ")}
          >
            {t}
          </span>
        ))}
        <span className="w-px h-5 bg-border mx-1" />
        <span className="text-xs text-text-2 mr-1">Outlook</span>
        {OUTLOOKS.map((o) => (
          <span
            key={o}
            onClick={() => setOutlook(outlook === o ? null : o)}
            className={[
              "text-[12.5px] px-3 py-1.5 border border-border-strong rounded-[16px] cursor-pointer text-text-2 transition-all select-none",
              outlook === o ? "bg-accent-soft border-transparent text-accent font-medium" : "hover:border-accent",
            ].join(" ")}
          >
            {o}
          </span>
        ))}
      </div>

      <div className="grid gap-[18px]" style={{ gridTemplateColumns: "300px 1fr" }}>
        {/* Strategy list */}
        <Card flush className="max-h-[600px] overflow-auto">
          {Object.entries(grouped).map(([t, rows]) => {
            let lastCat = "";
            return (
              <div key={t}>
                <div className="font-display font-semibold text-[13px] px-3.5 py-3 pt-3 border-t border-border/10 first:border-none">
                  {t}
                </div>
                {rows.map((s) => {
                  const catHeader = s[2] !== lastCat;
                  lastCat = s[2];
                  const oc2 = OUTLOOK_COLORS[s[3]] ?? OUTLOOK_COLORS["Neutral"];
                  return (
                    <div key={s[0]}>
                      {catHeader && (
                        <div className="text-[10px] uppercase tracking-[0.06em] text-text-3 px-3.5 py-1.5 font-semibold">
                          {s[2]}
                        </div>
                      )}
                      <div
                        onClick={() => setSelected(s[0])}
                        className={[
                          "flex items-center gap-2.5 px-3.5 py-[7px] cursor-pointer text-[13px] hover:bg-surface-2",
                          selected === s[0] ? "bg-accent-soft text-accent font-medium" : "",
                        ].join(" ")}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: oc2[0] }}
                        />
                        {s[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Card>

        {/* Strategy detail */}
        <Card>
          <div className="flex items-center flex-wrap gap-2.5 mb-3.5">
            <span className="font-display font-medium text-[18px]">{name}</span>
            <span
              className="text-[11.5px] font-medium px-2.5 py-1 rounded-[14px] flex items-center gap-1"
              style={{ background: oc[1], color: oc[0] }}
            >
              {selOutlook}
            </span>
            <span className="text-[11.5px] font-medium px-2.5 py-1 rounded-[14px] bg-pos-soft text-pos">
              Limited profit
            </span>
            <span className="text-[11.5px] font-medium px-2.5 py-1 rounded-[14px] bg-neg-soft text-neg">
              Limited loss
            </span>
            <span className="ml-auto text-[11.5px] text-text-3">
              {selTier} · {selCat}
            </span>
          </div>

          <SimplePnlDiagram outlook={selOutlook} />

          <p className="text-[13.5px] my-3.5 leading-relaxed">
            {getDesc(name, selOutlook, selCat)}
          </p>

          <div className="text-xs font-medium text-text mb-1.5">Construction (reference strikes)</div>
          <div className="text-[13px] text-text-2">
            · Buy 1 lower put
            <br />· Sell 1 higher put
          </div>

          <div className="mt-4">
            <Link href="/builder">
              <Button variant="primary">
                📊 Open in builder
              </Button>
            </Link>
          </div>
          <div className="text-[11px] text-text-3 mt-3">
            Payoff shapes use representative strikes for illustration. Build with live strikes and
            premiums in the strategy builder.
          </div>
        </Card>
      </div>
    </div>
  );
}
