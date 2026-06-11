import Link from "next/link";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import ClosePositionModal from "@/components/dashboard/ClosePositionModal";

const openPositions = [
  { id: "spy-ic", symbol: "SPY", strategy: "Iron condor", dte: 12, pnl: 210, status: "on_track" as const },
  { id: "nvda-bps", symbol: "NVDA", strategy: "Bull put spread", dte: 5, pnl: -140, status: "watch" as const },
  { id: "qqq-ss", symbol: "QQQ", strategy: "Short strangle", dte: 21, pnl: 95, status: "on_track" as const },
  { id: "aapl-bcs", symbol: "AAPL", strategy: "Bear call spread", dte: 3, pnl: -60, status: "alert" as const },
];

const statusConfig = {
  on_track: { label: "On track", variant: "green" as const },
  watch: { label: "Watch", variant: "warn" as const },
  alert: { label: "Testing short", variant: "red" as const },
};

const heatData = [1, 2, 0, 3, 1, -1, 0, 2, 1, 1, 0, 2, 3, -2, 0, 1, -1, 2, 1, 0, 1, 2, 3, 1, 0, -1, 2, 1, 1, 0, 2, 1, -2, 3, 0];

function heatColor(v: number) {
  if (v > 2) return "var(--pos)";
  if (v > 0) return "var(--pos-soft)";
  if (v < -1) return "var(--neg)";
  if (v < 0) return "var(--neg-soft)";
  return "var(--surface-2)";
}

export default function DashboardPage() {
  return (
    <div className="p-[26px]">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Net P&L (month)" value="+$4,820" valueClass="text-pos" />
        <MetricCard label="Win rate" value="68%" />
        <MetricCard label="Open positions" value="7" />
        <MetricCard label="Checklist adherence" value="82%" />
      </div>

      {/* Open positions table */}
      <Card flush className="mb-[18px]">
        <div className="flex items-center px-5 pt-4 pb-3">
          <span className="font-display font-medium text-[15px]">Open positions</span>
          <Link href="/builder" className="ml-auto text-[12.5px] text-accent hover:underline">
            Open builder →
          </Link>
        </div>
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead>
            <tr>
              {["Symbol", "Strategy", "DTE", "Open P&L", "Status", ""].map((h) => (
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
            {openPositions.map((p) => {
              const s = statusConfig[p.status];
              return (
                <tr key={p.id}>
                  <td className="py-[13px] px-4 border-b border-border/10 font-semibold text-[13.5px]">
                    {p.symbol}
                  </td>
                  <td className="py-[13px] px-4 border-b border-border/10 text-[13.5px]">
                    {p.strategy}
                  </td>
                  <td className="py-[13px] px-4 border-b border-border/10 font-mono text-[13.5px]">
                    {p.dte}
                  </td>
                  <td
                    className={[
                      "py-[13px] px-4 border-b border-border/10 font-mono text-[13.5px]",
                      p.pnl >= 0 ? "text-pos" : "text-neg",
                    ].join(" ")}
                  >
                    {p.pnl >= 0 ? `+$${p.pnl}` : `−$${Math.abs(p.pnl)}`}
                  </td>
                  <td className="py-[13px] px-4 border-b border-border/10">
                    <Tag variant={s.variant}>{s.label}</Tag>
                  </td>
                  <td className="py-[13px] px-4 border-b border-border/10">
                    <ClosePositionModal
                      positionLabel={`${p.symbol} · ${p.strategy}`}
                      entryCredit={0.76}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Bottom two-col row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Needs review */}
        <Card>
          <div className="font-display font-medium text-[15px] mb-3.5">Needs review</div>
          <div className="flex justify-between py-[9px] border-b border-border/10 text-[13.5px]">
            <span>TSLA · Bull put spread</span>
            <span className="font-mono text-pos">+$320</span>
          </div>
          <div className="flex justify-between py-[9px] text-[13.5px]">
            <span>IWM · Iron condor</span>
            <span className="font-mono text-neg">−$180</span>
          </div>
          <Link href="/review">
            <Button className="w-full mt-3.5">Review 2 closed trades</Button>
          </Link>
        </Card>

        {/* Weekly review */}
        <Card>
          <div className="font-display font-medium text-[15px]">Weekly review</div>
          <div className="text-[12.5px] text-text-2 mt-1 mb-3.5">
            4-week streak · due Sunday
          </div>
          <div className="flex gap-[5px]">
            {heatData.slice(0, 5).map((v, i) => (
              <span
                key={i}
                className="flex-1 h-8 rounded-[6px]"
                style={{
                  background: i < 4 ? "var(--pos-soft)" : "transparent",
                  border: i >= 4 ? "1px dashed var(--border-strong)" : undefined,
                }}
              />
            ))}
          </div>
          <Link href="/weekly">
            <Button className="w-full mt-3.5">Start week 5 →</Button>
          </Link>
        </Card>
      </div>

      {/* P&L calendar heatmap */}
      <Card className="mt-4">
        <div className="font-display font-medium text-[15px] mb-3">P&L calendar</div>
        <div className="grid gap-[5px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {heatData.map((v, i) => (
            <span
              key={i}
              className="rounded-[4px]"
              style={{
                aspectRatio: "1",
                background: heatColor(v),
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5 mt-3 text-[11px] text-text-2">
          <span className="w-2.5 h-2.5 rounded-[3px] inline-block" style={{ background: "var(--neg)" }} /> loss
          <span className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5" style={{ background: "var(--surface-2)" }} /> flat
          <span className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5" style={{ background: "var(--pos)" }} /> win
        </div>
      </Card>
    </div>
  );
}
