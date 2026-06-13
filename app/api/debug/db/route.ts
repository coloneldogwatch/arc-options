import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

function serializeError(e: any) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(e, function (_, v) {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
      if (v instanceof Error || typeof v.message === "string") {
        const out: Record<string, unknown> = {};
        for (const k of Object.getOwnPropertyNames(v)) out[k] = (v as any)[k];
        return out;
      }
    }
    return v;
  }));
}

export async function GET() {
  // Who's logged in?
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = user?.id ?? null;

  // Test 1: basic connectivity
  let selectOk = false, selectError = "";
  try { await db.execute(sql`SELECT 1`); selectOk = true; }
  catch (e: any) { selectError = String(e); }

  // Test 2: workspaces table accessible?
  let tableExists = false, tableError = "";
  try { await db.execute(sql`SELECT 1 FROM workspaces LIMIT 1`); tableExists = true; }
  catch (e: any) { tableError = String(e); }

  // Test 3: what columns does public.users have?
  let publicUsersColumns: string[] = [], publicUsersError = "";
  try {
    const rows = await db.execute(sql`
      SELECT column_name::text FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    publicUsersColumns = (rows as any[]).map((r: any) => r.column_name);
  } catch (e: any) { publicUsersError = String(e); }

  // Test 4: does the authenticated user exist in public.users?
  let authUserInPublic = false, authUserInPublicError = "";
  if (authUserId) {
    try {
      const rows = await db.execute(sql`SELECT id FROM users WHERE id = ${authUserId}::uuid LIMIT 1`);
      authUserInPublic = (rows as any[]).length > 0;
    } catch (e: any) { authUserInPublicError = String(e); }
  }

  // Test 5: INSERT into workspaces
  let wsInsertOk = false, wsInsertError: any = "", wsInsertedId = "";
  try {
    const [row] = await db
      .insert(workspaces)
      .values({ name: "__debug_test__", slug: "__debug_test__" })
      .returning({ id: workspaces.id });
    wsInsertedId = row.id;
    wsInsertOk = true;
  } catch (e: any) { wsInsertError = serializeError(e); }

  // Test 6: INSERT into workspace_members — use real auth user if logged in
  let memberInsertOk = false, memberInsertError: any = "";
  const testUserId = authUserId ?? "00000000-0000-0000-0000-000000000001";
  if (wsInsertedId) {
    try {
      await db.insert(workspaceMembers).values({
        workspaceId: wsInsertedId,
        userId: testUserId,
        role: "OWNER",
      });
      memberInsertOk = true;
    } catch (e: any) { memberInsertError = serializeError(e); }
  }

  // Cleanup
  if (wsInsertedId) {
    try { await db.delete(workspaces).where(eq(workspaces.id, wsInsertedId)); } catch {}
  }

  // Test 7: workspace_role enum values
  let workspaceRoleValues: string[] = [], workspaceRoleError = "";
  try {
    const rows = await db.execute(sql`
      SELECT enumlabel::text FROM pg_enum
      WHERE enumtypid = 'workspace_role'::regtype
      ORDER BY enumsortorder
    `);
    workspaceRoleValues = (rows as any[]).map((r: any) => r.enumlabel);
  } catch (e: any) { workspaceRoleError = String(e); }

  const dbUrl = (process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "").replace(/:([^@]+)@/, ":***@");

  return Response.json({
    dbUrl, authUserId, testUserId,
    selectOk, selectError,
    tableExists, tableError,
    publicUsersColumns, publicUsersError,
    authUserInPublic, authUserInPublicError,
    wsInsertOk, wsInsertError, wsInsertedId,
    memberInsertOk, memberInsertError,
    workspaceRoleValues, workspaceRoleError,
  });
}
