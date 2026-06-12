"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { provisionWorkspace } from "@/lib/actions/workspace";

function serializeError(e: any): string {
  const seen = new WeakSet();
  return JSON.stringify(
    e,
    function (_, v) {
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
    },
    2
  );
}

function rootCause(e: any): any {
  let curr = e;
  while (curr?.cause) curr = curr.cause;
  return curr;
}

export async function signup(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) return { error: "Email and password required" };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  const userId = data.user!.id;

  // Idempotent: if this user already has a workspace (e.g. retrying after a
  // partial DB failure), skip provisioning.
  const [existing] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (!existing) {
    try {
      const displayName = name || email;
      await provisionWorkspace(userId, displayName);
    } catch (e: any) {
      const root = rootCause(e);
      console.error("[signup] workspace provision failed:", serializeError(e));
      const code = root?.code ?? e?.code ?? "?";
      const msg = root?.message ?? e?.message ?? String(e);
      const detail = root?.detail ? ` (${root.detail})` : "";
      return { error: `${code}: ${msg}${detail}` };
    }
  }

  return { success: true };
}

export async function login(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  return { success: true };
}

export async function signout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
