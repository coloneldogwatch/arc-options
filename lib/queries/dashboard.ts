import { db } from "@/lib/db";
import { positions, tradeReviews } from "@/lib/db/schema";
import { eq, and, gte, isNull } from "drizzle-orm";

export async function getDashboardData(workspaceId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [openPositions, closedThisMonth, needsReview] = await Promise.all([
    db.query.positions.findMany({
      where: and(eq(positions.workspaceId, workspaceId), eq(positions.status, "open")),
      orderBy: (p, { desc }) => [desc(p.openedAt)],
      with: { legs: true },
    }),

    db.query.positions.findMany({
      where: and(
        eq(positions.workspaceId, workspaceId),
        eq(positions.status, "closed"),
        gte(positions.closedAt!, monthStart)
      ),
    }),

    db
      .select({
        id: positions.id,
        symbol: positions.symbol,
        strategyName: positions.strategyName,
        realizedPnl: positions.realizedPnl,
      })
      .from(positions)
      .leftJoin(tradeReviews, eq(tradeReviews.positionId, positions.id))
      .where(
        and(
          eq(positions.workspaceId, workspaceId),
          eq(positions.status, "closed"),
          isNull(tradeReviews.id)
        )
      )
      .limit(5),
  ]);

  const netPnlMonth = closedThisMonth.reduce(
    (acc, p) => acc + parseFloat(String(p.realizedPnl ?? "0")),
    0
  );
  const wins = closedThisMonth.filter(
    (p) => parseFloat(String(p.realizedPnl ?? "0")) > 0
  ).length;
  const winRate =
    closedThisMonth.length > 0
      ? Math.round((wins / closedThisMonth.length) * 100)
      : 0;
  const avgAdherence =
    openPositions.length > 0
      ? Math.round(
          openPositions.reduce((a, p) => a + (p.checklistScore ?? 0), 0) /
            openPositions.length
        )
      : 0;

  return { openPositions, needsReview, netPnlMonth, winRate, avgAdherence };
}
