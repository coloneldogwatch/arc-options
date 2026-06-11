import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll().map((c) => c.name);

  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  let workspaces: unknown[] = [];
  if (user) {
    workspaces = await db
      .select()
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id));
  }

  return Response.json({
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
    cookies: allCookies,
    workspaces,
  });
}
