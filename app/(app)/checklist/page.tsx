import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/actions/workspace";
import { getChecklistData } from "@/lib/queries/checklist";
import ChecklistForm from "@/components/checklist/ChecklistForm";
import { db } from "@/lib/db";
import { positions } from "@/lib/db/schema";

type Props = {
  searchParams: { positionId?: string };
};

export default async function ChecklistPage({ searchParams }: Props) {
  const { positionId } = searchParams;
  if (!positionId) redirect("/builder");

  const { workspaceId } = await requireWorkspace();

  const position = await db.query.positions.findFirst({
    where: and(eq(positions.id, positionId), eq(positions.workspaceId, workspaceId)),
  });
  if (!position) redirect("/dashboard");

  const { items, responses } = await getChecklistData(workspaceId, positionId);

  return (
    <ChecklistForm
      positionId={positionId}
      positionLabel={`${position.symbol} · ${position.strategyName}`}
      items={items}
      initialResponses={responses}
    />
  );
}
