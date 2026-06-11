"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  tradeReviews,
  reviewMistakes,
  mistakes,
  weeklyReviews,
  positions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireWorkspace } from "./workspace";
import { isoWeekKey } from "@/lib/utils";

export type SaveReviewInput = {
  positionId: string;
  thesisAccuracy: number;
  entryQuality: number;
  exitQuality: number;
  positionSizing: number;
  lessonLearned: string;
  mistakeLabels: string[];
};

export async function saveReview(input: SaveReviewInput) {
  const { workspaceId, userId } = await requireWorkspace();

  const position = await db.query.positions.findFirst({
    where: and(eq(positions.id, input.positionId), eq(positions.workspaceId, workspaceId)),
  });
  if (!position) throw new Error("Position not found");

  await db.transaction(async (tx) => {
    // Upsert mistake labels for this workspace
    const mistakeIds: string[] = [];
    for (const label of input.mistakeLabels) {
      const existing = await tx.query.mistakes.findFirst({
        where: and(eq(mistakes.workspaceId, workspaceId), eq(mistakes.label, label)),
      });
      if (existing) {
        mistakeIds.push(existing.id);
      } else {
        const [m] = await tx
          .insert(mistakes)
          .values({ workspaceId, label })
          .returning();
        mistakeIds.push(m.id);
      }
    }

    // Check if review exists
    const existing = await tx.query.tradeReviews.findFirst({
      where: eq(tradeReviews.positionId, input.positionId),
    });

    let reviewId: string;
    if (existing) {
      await tx
        .update(tradeReviews)
        .set({
          thesisAccuracy: input.thesisAccuracy,
          entryQuality: input.entryQuality,
          exitQuality: input.exitQuality,
          positionSizing: input.positionSizing,
          lessonLearned: input.lessonLearned,
          updatedAt: new Date(),
        })
        .where(eq(tradeReviews.id, existing.id));
      reviewId = existing.id;
    } else {
      const [review] = await tx
        .insert(tradeReviews)
        .values({
          positionId: input.positionId,
          workspaceId,
          userId,
          thesisAccuracy: input.thesisAccuracy,
          entryQuality: input.entryQuality,
          exitQuality: input.exitQuality,
          positionSizing: input.positionSizing,
          lessonLearned: input.lessonLearned,
        })
        .returning();
      reviewId = review.id;
    }

    // Replace mistake links
    await tx.delete(reviewMistakes).where(eq(reviewMistakes.reviewId, reviewId));
    if (mistakeIds.length > 0) {
      await tx.insert(reviewMistakes).values(
        mistakeIds.map((mid) => ({ reviewId, mistakeId: mid }))
      );
    }
  });

  revalidatePath("/review");
  revalidatePath("/dashboard");
}

export type CompleteWeeklyReviewInput = {
  whatWentWell: string;
  processSlips: string;
  oneChange: string;
};

export async function completeWeeklyReview(input: CompleteWeeklyReviewInput) {
  const { workspaceId, userId } = await requireWorkspace();

  const now = new Date();
  const weekKey = isoWeekKey(now);
  const weekStart = getMonday(now);

  await db
    .insert(weeklyReviews)
    .values({
      workspaceId,
      userId,
      weekKey,
      weekStart,
      whatWentWell: input.whatWentWell,
      processSlips: input.processSlips,
      oneChange: input.oneChange,
    })
    .onConflictDoUpdate({
      target: [weeklyReviews.userId, weeklyReviews.weekKey],
      set: {
        whatWentWell: input.whatWentWell,
        processSlips: input.processSlips,
        oneChange: input.oneChange,
        completedAt: now,
      },
    });

  revalidatePath("/weekly");
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
