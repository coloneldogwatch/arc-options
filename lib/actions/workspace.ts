"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces, checklistTemplates, checklistItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { WorkspaceContext } from "@/types";
import { DEFAULT_CHECKLIST } from "@/types";

async function getMemberRow(userId: string) {
  const [row] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
      plan: workspaces.plan,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  return row ?? null;
}

// Upsert the user into public.users (FK target for workspace_members).
// Must run OUTSIDE a transaction — a failed statement inside a tx kills the tx.
async function ensurePublicUser(userId: string, email: string) {
  try {
    await db.execute(sql`
      INSERT INTO users (id, email) VALUES (${userId}::uuid, ${email})
      ON CONFLICT (id) DO NOTHING
    `);
  } catch {
    try {
      await db.execute(sql`
        INSERT INTO users (id) VALUES (${userId}::uuid)
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (e) {
      // If both fail, log and continue — FK was dropped so workspace insert will work regardless
      console.error("[ensurePublicUser] could not insert into public.users:", e);
    }
  }
}

export async function provisionWorkspace(userId: string, email: string) {
  const workspaceName = email.split("@")[0] || userId.slice(0, 8);
  const slug =
    workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    userId.slice(0, 8);

  await ensurePublicUser(userId, email);

  // ── Critical ──────────────────────────────────────────────────────────────
  // Workspace + member. If this fails, provisioning fails and the user can't
  // log in. Any schema mismatch here must be fixed before proceeding.
  const [workspace] = await db.transaction(async (tx) => {
    const [ws] = await tx
      .insert(workspaces)
      .values({ name: workspaceName, slug })
      .returning();

    await tx.insert(workspaceMembers).values({
      workspaceId: ws.id,
      userId,
      role: "OWNER",
    });

    return [ws];
  });

  // ── Non-critical ──────────────────────────────────────────────────────────
  // Default checklist template + items. Schema mismatches here must NOT block
  // login — the user lands on the dashboard without a default checklist rather
  // than being stuck in a login loop. Fix schema mismatches separately.
  try {
    await db.transaction(async (tx) => {
      const [template] = await tx
        .insert(checklistTemplates)
        .values({ workspaceId: workspace.id, name: "Default", isDefault: true })
        .returning();

      await tx.insert(checklistItems).values([
        ...DEFAULT_CHECKLIST.required.map((label, i) => ({
          workspaceId: workspace.id,
          templateId: template.id,
          label,
          required: true,
          sortOrder: i,
        })),
        ...DEFAULT_CHECKLIST.optional.map((label, i) => ({
          workspaceId: workspace.id,
          templateId: template.id,
          label,
          required: false,
          sortOrder: DEFAULT_CHECKLIST.required.length + i,
        })),
      ]);
    });
  } catch (e) {
    console.error("[provisionWorkspace] checklist setup failed (non-fatal):", e);
  }
}

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let row = await getMemberRow(user.id);

  if (!row) {
    try {
      await provisionWorkspace(user.id, user.email ?? user.id);
      row = await getMemberRow(user.id);
    } catch (e) {
      console.error("[requireWorkspace] auto-provision failed:", e);
    }
    if (!row) redirect("/login");
  }

  return { workspaceId: row.workspaceId, userId: user.id, plan: row.plan, role: row.role };
}

export async function requirePro(): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  if (ctx.plan !== "pro") throw new Error("Pro plan required");
  return ctx;
}
