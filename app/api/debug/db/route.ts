import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    return Response.json({ connected: true, result });
  } catch (e) {
    return Response.json({
      connected: false,
      error: String(e),
    });
  }
}
