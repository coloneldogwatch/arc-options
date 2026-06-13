import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces, checklistTemplates, checklistItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_CHECKLIST } from "@/types";

function rootErr(e: any) {
  let c = e;
  while (c?.cause) c = c.cause;
  return c;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not logged in — visit /login first" }, { status: 401 });

  const steps: Record<string, string> = {};

  // Check existing workspace
  const [existing] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, user.id))
    .limit(1);

  if (existing) {
    return Response.json({ ok: true, message: "Workspace already exists — you can log in now", workspaceId: existing.workspaceId });
  }

  const userId = user.id;
  const email = user.email ?? userId;
  const workspaceName = email.split("@")[0] || userId.slice(0, 8);
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || userId.slice(0, 8);

  // Step 1a: get public.users columns
  try {
    const cols = await db.execute(sql`
      SELECT column_name::text, is_nullable::text, column_default::text
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    steps["users_columns"] = JSON.stringify((cols as any[]).map(r => ({ col: r.column_name, nullable: r.is_nullable, default: r.column_default })));
  } catch (e: any) { steps["users_columns_err"] = String(e); }

  // Step 1b: insert into public.users
  try {
    await db.execute(sql`INSERT INTO users (id, email) VALUES (${userId}::uuid, ${email}) ON CONFLICT (id) DO NOTHING`);
    steps["users_insert"] = "ok (id, email)";
  } catch (e: any) {
    const r = rootErr(e);
    steps["users_insert_email_err"] = `${r?.code}: ${r?.message}`;
    try {
      await db.execute(sql`INSERT INTO users (id) VALUES (${userId}::uuid) ON CONFLICT (id) DO NOTHING`);
      steps["users_insert"] = "ok (id only)";
    } catch (e2: any) {
      const r2 = rootErr(e2);
      steps["users_insert_id_err"] = `${r2?.code}: ${r2?.message}`;
    }
  }

  // Step 2: check if user now in public.users
  try {
    const rows = await db.execute(sql`SELECT id FROM users WHERE id = ${userId}::uuid`);
    steps["users_exists"] = (rows as any[]).length > 0 ? "yes" : "NO — still missing";
  } catch (e: any) { steps["users_exists_err"] = String(e); }

  // Step 3: workspace + members + checklist in one transaction
  let workspaceId = "";
  try {
    await db.transaction(async (tx) => {
      const [workspace] = await tx.insert(workspaces).values({ name: workspaceName, slug }).returning();
      workspaceId = workspace.id;
      steps["workspace"] = workspaceId;

      await tx.insert(workspaceMembers).values({ workspaceId: workspace.id, userId, role: "OWNER" });
      steps["workspace_members"] = "ok";

      const [template] = await tx.insert(checklistTemplates).values({ workspaceId: workspace.id, name: "Default", isDefault: true }).returning();
      steps["checklist_template"] = template.id;

      await tx.insert(checklistItems).values([
        ...DEFAULT_CHECKLIST.required.map((label, i) => ({ templateId: template.id, label, required: true, sortOrder: i })),
        ...DEFAULT_CHECKLIST.optional.map((label, i) => ({ templateId: template.id, label, required: false, sortOrder: DEFAULT_CHECKLIST.required.length + i })),
      ]);
      steps["checklist_items"] = "ok";
    });
  } catch (e: any) {
    const r = rootErr(e);
    steps["transaction_err"] = `${r?.code ?? "?"}: ${r?.message} | detail: ${r?.detail ?? ""}`;
    return Response.json({ ok: false, userId, email, steps }, { status: 500 });
  }

  return Response.json({ ok: true, message: "Workspace created — go to /dashboard", userId, workspaceId, steps });
}
