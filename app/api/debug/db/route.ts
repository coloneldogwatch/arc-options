import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  // Test 1: basic connectivity
  let selectOk = false;
  let selectError = "";
  try {
    await db.execute(sql`SELECT 1`);
    selectOk = true;
  } catch (e: any) {
    selectError = String(e);
  }

  // Test 2: can we query the workspaces table?
  let tableExists = false;
  let tableError = "";
  try {
    await db.execute(sql`SELECT 1 FROM workspaces LIMIT 1`);
    tableExists = true;
  } catch (e: any) {
    tableError = String(e);
  }

  // Test 3: can we INSERT into workspaces?
  let insertOk = false;
  let insertError = "";
  let insertedId = "";
  try {
    const [row] = await db
      .insert(workspaces)
      .values({ name: "__debug_test__" })
      .returning({ id: workspaces.id });
    insertedId = row.id;
    await db.delete(workspaces).where(eq(workspaces.id, row.id));
    insertOk = true;
  } catch (e: any) {
    insertError = JSON.stringify(e, Object.getOwnPropertyNames(e));
  }

  return Response.json({ selectOk, selectError, tableExists, tableError, insertOk, insertError, insertedId });
}
