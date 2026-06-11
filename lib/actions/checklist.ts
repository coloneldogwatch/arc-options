"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  checklistResponses,
  checklistItems,
  checklistTemplates,
  positions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspace } from "./workspace";

export type SaveChecklistInput = {
  positionId: string;
  responses: { itemId: string; checked: boolean }[];
};

export async function saveChecklistResponses(input: SaveChecklistInput) {
  const { workspaceId } = await requireWorkspace();

  // Verify ownership
  const position = await db.query.positions.findFirst({
    where: and(eq(positions.id, input.positionId), eq(positions.workspaceId, workspaceId)),
  });
  if (!position) throw new Error("Position not found");

  // Get the default template for this workspace
  const [template] = await db
    .select({ id: checklistTemplates.id })
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.workspaceId, workspaceId), eq(checklistTemplates.isDefault, true)))
    .limit(1);

  // Compute adherence score from required items
  let score = 100;
  if (template) {
    const allItems = await db
      .select({ id: checklistItems.id, required: checklistItems.required })
      .from(checklistItems)
      .where(eq(checklistItems.templateId, template.id));

    const requiredItems = allItems.filter((i) => i.required);
    if (requiredItems.length > 0) {
      const checkedRequired = input.responses.filter(
        (r) => r.checked && requiredItems.some((i) => i.id === r.itemId)
      ).length;
      score = Math.round((checkedRequired / requiredItems.length) * 100);
    }
  }

  await db.transaction(async (tx) => {
    for (const r of input.responses) {
      await tx
        .insert(checklistResponses)
        .values({ positionId: input.positionId, itemId: r.itemId, checked: r.checked })
        .onConflictDoUpdate({
          target: [checklistResponses.positionId, checklistResponses.itemId],
          set: { checked: r.checked },
        });
    }

    await tx
      .update(positions)
      .set({ checklistScore: score, updatedAt: new Date() })
      .where(eq(positions.id, input.positionId));
  });

  revalidatePath("/checklist");
  return { score };
}
