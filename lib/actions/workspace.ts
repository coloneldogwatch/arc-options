"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { WorkspaceContext } from "@/types";

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
      plan: workspaces.plan,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);

  if (!row) redirect("/login");

  return { workspaceId: row.workspaceId, userId: user.id, plan: row.plan, role: row.role };
}

export async function requirePro(): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  if (ctx.plan !== "pro") throw new Error("Pro plan required");
  return ctx;
}
