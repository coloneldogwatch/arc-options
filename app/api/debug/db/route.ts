import { db } from "@/lib/db";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

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
  // Test 1: basic connectivity
  let selectOk = false, selectError = "";
  try {
    await db.execute(sql`SELECT 1`);
    selectOk = true;
  } catch (e: any) { selectError = String(e); }

  // Test 2: workspaces table accessible?
  let tableExists = false, tableError = "";
  try {
    await db.execute(sql`SELECT 1 FROM workspaces LIMIT 1`);
    tableExists = true;
  } catch (e: any) { tableError = String(e); }

  // Test 3: INSERT into workspaces
  let wsInsertOk = false, wsInsertError: any = "", wsInsertedId = "";
  try {
    const [row] = await db
      .insert(workspaces)
      .values({ name: "__debug_test__", slug: "__debug_test__" })
      .returning({ id: workspaces.id });
    wsInsertedId = row.id;
    wsInsertOk = true;
  } catch (e: any) { wsInsertError = serializeError(e); }

  // Test 4: INSERT into workspace_members (requires workspace from test 3)
  let memberInsertOk = false, memberInsertError: any = "";
  if (wsInsertedId) {
    try {
      await db.insert(workspaceMembers).values({
        workspaceId: wsInsertedId,
        userId: "00000000-0000-0000-0000-000000000001",
        role: "owner",
      });
      memberInsertOk = true;
    } catch (e: any) { memberInsertError = serializeError(e); }
  }

  // Cleanup — cascade deletes the member row too
  if (wsInsertedId) {
    try { await db.delete(workspaces).where(eq(workspaces.id, wsInsertedId)); } catch {}
  }

  // Show which DB URL is active (mask password)
  const dbUrl = (process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? "").replace(/:([^@]+)@/, ":***@");

  return Response.json({
    dbUrl,
    selectOk, selectError,
    tableExists, tableError,
    wsInsertOk, wsInsertError, wsInsertedId,
    memberInsertOk, memberInsertError,
  });
}
