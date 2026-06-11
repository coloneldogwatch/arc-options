import Link from "next/link";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import ClosePositionModal from "@/components/dashboard/ClosePositionModal";
import { requireWorkspace } from "@/lib/actions/workspace";
import { getDashboardData } from "@/lib/queries/dashboard";

const statusConfig = {
  on_track: { label: "On track", variant: "green" as const },
  watch: { label: "Watch", variant: "warn" as const },
  alert: { label: "Alert", variant: "red" as const },
};

function computeStatus(score: number | null): "on_track" | "watch" | "alert" {
  if (score === null || score === undefined) return "watch";
  if (score >= 80) return "on_track";
  if (score >= 50) return "watch";
  return "alert";
}

function computeDte(legs: { expiration: Date }[]): number | null {
  if (legs.length === 0) return null;
  const now = Date.now();
  const nearest = Math.min(...legs.map((l) => new Date(l.expiration).getTime()));
  return Math.max(0, Math.round((nearest - now) / 86400000));
}

const heatData = [1, 2, 0, 3, 1, -1, 0, 2, 1, 1, 0, 2, 3, -2, 0, 1, -1, 2, 1, 0, 1, 2, 3, 1, 0, -1, 2, 1, 1, 0, 2, 1, -2, 3, 0];

function heatColor(v: number) {
  if (v > 2) return "var(--pos)";
  if (v > 0) return "var(--pos-soft)";
  if (v < -1) return "var(--neg)";
  if (v < 0) return "var(--neg-soft)";
  return "var(--surface-2)";
}

export default async function DashboardPage() {
  const { workspaceId } = await requireWorkspace();
  const { openPositions, needsReview, netPnlMonth, winRate, avgAdherence } =
    await getDashboardData(workspaceId);

  const pnlAbs = Math.abs(Math.round(netPnlMonth));
  const pnlDisplay =
    netPnlMonth >= 0 ? `+$${pnlAbs.toLocaleString()}` : `−$${pnlAbs.toLocaleString()}`;

  return (
    <div className="p-[26px]">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard
          label="Net P&L (month)"
          value={pnlDisplay}
          valueClass={netPnlMonth >= 0 ? "text-pos" : "text-neg"}
        />
        <MetricCard label="Win rate" value={`${winRate}%`} />
        <MetricCard label="Open positions" value={String(openPositions.length)} />
        <MetricCard label="Checklist adherence" value={`${avgAdherence}%`} />
      </div>

      {/* Open positions table */}
      <Card flush className="mb-[18px]">
        <div className="flex items-center px-5 pt-4 pb-3">
          <span className="font-display font-medium text-[15px]">Open positions</span>
          <Link href="/builder" className="ml-auto text-[12.5px] text-accent hover:underline">
            Open builder →
          </Link>
        </div>
        {openPositions.length === 0 ? (
          <div className="px-5 pb-5 text-[13.5px] text-text-2">
            No open positions yet.{" "}
            <Link href="/builder" className="text-accent hover:underline">
              Open the builder →
            </Link>
          </div>
        ) : (
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
                const statusKey = computeStatus(p.checklistScore);
                const s = statusConfig[statusKey];
                const dte = computeDte(p.legs);
                const entryCredit = parseFloat(String(p.entryCredit ?? "0"));
                return (
                  <tr key={p.id}>
                    <td className="py-[13px] px-4 border-b border-border/10 font-semibold text-[13.5px]">
                      {p.symbol}
                    </td>
                    <td className="py-[13px] px-4 border-b border-border/10 text-[13.5px]">
                      {p.strategyName}
                    </td>
                    <td className="py-[13px] px-4 border-b border-border/10 font-mono text-[13.5px]">
                      {dte !== null ? dte : "—"}
                    </td>
                    <td className="py-[13px] px-4 border-b border-border/10 font-mono text-[13.5px] text-text-2">
                      —
                    </td>
                    <td className="py-[13px] px-4 border-b border-border/10">
                      <Tag variant={s.variant}>{s.label}</Tag>
                    </td>
                    <td className="py-[13px] px-4 border-b border-border/10">
                      <ClosePositionModal
                        positionId={p.id}
                        positionLabel={`${p.symbol} · ${p.strategyName}`}
                        entryCredit={entryCredit}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Bottom two-col row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Needs review */}
        <Card>
          <div className="font-display font-medium text-[15px] mb-3.5">Needs review</div>
          {needsReview.length === 0 ? (
            <div className="text-[13.5px] text-text-2 py-2">All caught up!</div>
          ) : (
            <>
              {needsReview.map((p, i) => {
                const pnl = parseFloat(String(p.realizedPnl ?? "0"));
                return (
                  <div
                    key={p.id}
                    className={[
                      "flex justify-between py-[9px] text-[13.5px]",
                      i < needsReview.length - 1 ? "border-b border-border/10" : "",
                    ].join(" ")}
                  >
                    <span>
                      {p.symbol} · {p.strategyName}
                    </span>
                    <span className={`font-mono ${pnl >= 0 ? "text-pos" : "text-neg"}`}>
                      {pnl >= 0 ? `+$${Math.round(pnl)}` : `−$${Math.abs(Math.round(pnl))}`}
                    </span>
                  </div>
                );
              })}
              <Link href="/review">
                <Button className="w-full mt-3.5">
                  Review {needsReview.length} closed trade
                  {needsReview.length !== 1 ? "s" : ""}
                </Button>
              </Link>
            </>
          )}
        </Card>

        {/* Weekly review */}
        <Card>
          <div className="font-display font-medium text-[15px]">Weekly review</div>
          <div className="text-[12.5px] text-text-2 mt-1 mb-3.5">Due Sunday</div>
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
            <Button className="w-full mt-3.5">Start weekly review →</Button>
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
              style={{ aspectRatio: "1", background: heatColor(v) }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5 mt-3 text-[11px] text-text-2">
          <span
            className="w-2.5 h-2.5 rounded-[3px] inline-block"
            style={{ background: "var(--neg)" }}
          />{" "}
          loss
          <span
            className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5"
            style={{ background: "var(--surface-2)" }}
          />{" "}
          flat
          <span
            className="w-2.5 h-2.5 rounded-[3px] inline-block ml-1.5"
            style={{ background: "var(--pos)" }}
          />{" "}
          win
        </div>
      </Card>
    </div>
  );
}
