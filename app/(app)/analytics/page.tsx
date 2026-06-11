import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";

const heatData = [1, 2, 0, 3, 1, -1, 0, 2, 1, 1, 0, 2, 3, -2, 0, 1, -1, 2, 1, 0, 1, 2, 3, 1, 0, -1, 2, 1, 1, 0, 2, 1, -2, 3, 0];

const stratReturns = [
  { name: "Iron condor", pnl: 2100, pct: 80 },
  { name: "Bull put", pnl: 1400, pct: 54 },
  { name: "Bear call", pnl: 700, pct: 30 },
  { name: "Strangle", pnl: -600, pct: 24, neg: true },
];

function heatColor(v: number) {
  if (v > 2) return "var(--pos)";
  if (v > 0) return "var(--pos-soft)";
  if (v < -1) return "var(--neg)";
  if (v < 0) return "var(--neg-soft)";
  return "var(--surface-2)";
}

export default function AnalyticsPage() {
  return (
    <div className="p-[26px]">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Expectancy / trade" value="$38" />
        <MetricCard label="Profit factor" value="1.7" />
        <MetricCard label="Avg win / loss" value="2.1×" />
        <MetricCard label="Current streak" value="W4" valueClass="text-pos" />
      </div>

      {/* Cumulative P&L chart */}
      <Card className="mb-[18px]">
        <div className="font-display font-medium text-[15px] mb-3">Cumulative P&L</div>
        <svg
          viewBox="0 0 760 150"
          style={{ width: "100%", height: "auto" }}
          aria-label="Rising cumulative P&L curve"
        >
          <line x1="10" y1="132" x2="752" y2="132" stroke="var(--border)" />
          <polyline
            points="10,124 110,108 210,114 310,84 410,90 510,58 610,46 720,24"
            fill="none"
            stroke="var(--pos)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </Card>

      {/* Calendar + strategy */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="font-display font-medium text-[15px] mb-3.5">P&L calendar</div>
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
            {heatData.map((v, i) => (
              <span
                key={i}
                className="rounded-[4px]"
                style={{ aspectRatio: "1", background: heatColor(v) }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2.5 mt-3 text-[11px] text-text-2">
            <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: "var(--neg)" }} /> loss
            <span className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5" style={{ background: "var(--surface-2)" }} /> flat
            <span className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5" style={{ background: "var(--pos)" }} /> win
          </div>
        </Card>

        <Card>
          <div className="font-display font-medium text-[15px] mb-4">Return by strategy</div>
          <div className="text-[12.5px] flex flex-col gap-3">
            {stratReturns.map((s) => (
              <div key={s.name} className="flex items-center gap-2.5">
                <span style={{ width: "72px" }}>{s.name}</span>
                <span
                  className="h-[9px] rounded-[5px]"
                  style={{
                    width: `${s.pct}%`,
                    background: s.neg ? "var(--neg)" : "var(--pos)",
                    flex: "0 0 auto",
                  }}
                />
                <span className={s.neg ? "font-mono text-neg" : "font-mono text-pos"}>
                  {s.neg ? "−" : "+"}${Math.abs(s.pnl / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
