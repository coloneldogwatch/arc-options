import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/actions/workspace";
import ReviewForm from "@/components/review/ReviewForm";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";

type Props = {
  searchParams: { positionId?: string; lesson?: string };
};

export default async function ReviewPage({ searchParams }: Props) {
  const { workspaceId } = await requireWorkspace();
  const { positionId, lesson } = searchParams;

  let position = null;
  if (positionId) {
    position = await db.query.positions.findFirst({
      where: and(
        eq(positions.id, positionId),
        eq(positions.workspaceId, workspaceId),
        eq(positions.status, "CLOSED")
      ),
    });
  }

  return (
    <ReviewForm
      positionId={position?.id ?? null}
      positionLabel={
        position ? `${position.symbol} · ${position.strategyName}` : undefined
      }
      realizedPnl={
        position?.realizedPnl ? parseFloat(String(position.realizedPnl)) : null
      }
      entryThesis={position?.entryThesis}
      initialLesson={lesson ? decodeURIComponent(lesson) : undefined}
    />
  );
}
