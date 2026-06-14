import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const TABLES = [
  "users", "workspaces", "workspace_members",
  "checklist_templates", "checklist_items", "checklist_responses",
  "positions", "position_legs",
];

export async function GET() {
  const result: Record<string, any> = {};

  for (const table of TABLES) {
    try {
      const cols = await db.execute(sql`
        SELECT
          column_name::text,
          udt_name::text AS type,
          is_nullable::text,
          column_default::text
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `);
      result[table] = (cols as any[]).map((r) => ({
        col: r.column_name,
        type: r.type,
        nullable: r.is_nullable === "YES",
        default: r.column_default,
      }));
    } catch (e: any) {
      result[table] = { error: String(e) };
    }
  }

  return Response.json(result, { headers: { "content-type": "application/json" } });
}
