"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { positions, positionLegs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspace } from "./workspace";
import type { BuilderLeg } from "@/types";

export type CreatePositionInput = {
  symbol: string;
  strategyName: string;
  legs: BuilderLeg[];
  entryThesis?: string;
  entryCredit: number;
  checklistScore?: number;
  expirationDate: string; // ISO date string "YYYY-MM-DD"
};

export async function createPosition(input: CreatePositionInput) {
  const { workspaceId, userId } = await requireWorkspace();

  const expiration = new Date(input.expirationDate);

  const [position] = await db
    .insert(positions)
    .values({
      workspaceId,
      userId,
      symbol: input.symbol.toUpperCase(),
      strategyName: input.strategyName,
      entryThesis: input.entryThesis,
      checklistScore: input.checklistScore,
      entryCredit: String(input.entryCredit),
    })
    .returning();

  const activelegs = input.legs.filter((l) => !l.excluded);
  if (activelegs.length > 0) {
    await db.insert(positionLegs).values(
      activelegs.map((l) => ({
        positionId: position.id,
        type: l.type,
        side: l.side,
        strike: String(l.strike),
        expiration,
        qty: l.qty,
      }))
    );
  }

  revalidatePath("/dashboard");
  return { positionId: position.id };
}

export type ClosePositionInput = {
  positionId: string;
  closingDebit: number; // net cost to close in dollars per share (then ×100 for P&L)
};

export async function closePosition(input: ClosePositionInput) {
  const { workspaceId } = await requireWorkspace();

  const position = await db.query.positions.findFirst({
    where: and(eq(positions.id, input.positionId), eq(positions.workspaceId, workspaceId)),
  });

  if (!position) throw new Error("Position not found");
  if (position.status === "CLOSED") throw new Error("Already closed");

  const entryCredit = parseFloat(String(position.entryCredit ?? "0"));
  const realizedPnl = (entryCredit - input.closingDebit) * 100;

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(positions)
      .set({
        status: "CLOSED",
        realizedPnl: realizedPnl.toFixed(2),
        closedAt: now,
        updatedAt: now,
      })
      .where(and(eq(positions.id, input.positionId), eq(positions.workspaceId, workspaceId)));

    // Immutable from this point — stamp closedAt on all legs
    await tx
      .update(positionLegs)
      .set({ closedAt: now })
      .where(eq(positionLegs.positionId, input.positionId));
  });

  revalidatePath("/dashboard");
  return { realizedPnl };
}
