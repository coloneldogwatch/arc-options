import { db } from "@/lib/db";
import { checklistItems, checklistTemplates, checklistResponses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getChecklistData(workspaceId: string, positionId: string) {
  const [template] = await db
    .select({ id: checklistTemplates.id })
    .from(checklistTemplates)
    .where(
      and(
        eq(checklistTemplates.workspaceId, workspaceId),
        eq(checklistTemplates.isDefault, true)
      )
    )
    .limit(1);

  if (!template) return { items: [], responses: {} as Record<string, boolean> };

  const [items, existing] = await Promise.all([
    db
      .select({
        id: checklistItems.id,
        label: checklistItems.label,
        required: checklistItems.required,
        sortOrder: checklistItems.sortOrder,
      })
      .from(checklistItems)
      .where(eq(checklistItems.templateId, template.id))
      .orderBy(checklistItems.sortOrder),

    db
      .select({ itemId: checklistResponses.itemId, checked: checklistResponses.checked })
      .from(checklistResponses)
      .where(eq(checklistResponses.positionId, positionId)),
  ]);

  const responses: Record<string, boolean> = Object.fromEntries(
    existing.map((r) => [r.itemId, r.checked])
  );

  return { items, responses };
}
