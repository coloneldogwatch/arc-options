"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, checklistTemplates, checklistItems } from "@/lib/db/schema";
import { DEFAULT_CHECKLIST } from "@/types";

function serializeError(e: any): string {
  const seen = new WeakSet();
  return JSON.stringify(e, function (_, v) {
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
      // Capture non-enumerable own properties (e.g. Error fields)
      if (v instanceof Error || typeof v.message === "string") {
        const out: Record<string, unknown> = {};
        for (const k of Object.getOwnPropertyNames(v)) out[k] = (v as any)[k];
        return out;
      }
    }
    return v;
  }, 2);
}

function rootCause(e: any): any {
  let curr = e;
  while (curr?.cause) curr = curr.cause;
  return curr;
}

export async function signup(formData: FormData): Promise<{ error: string } | { success: true }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !password) return { error: "Email and password required" };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  const userId = data.user!.id;
  const workspaceName = name || email.split("@")[0];
  const slug =
    workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    userId.slice(0, 8);

  try {
    await db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: workspaceName, slug })
        .returning();

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId,
        role: "owner",
      });

      const [template] = await tx
        .insert(checklistTemplates)
        .values({ workspaceId: workspace.id, name: "Default", isDefault: true })
        .returning();

      await tx.insert(checklistItems).values([
        ...DEFAULT_CHECKLIST.required.map((label, i) => ({
          templateId: template.id,
          label,
          required: true,
          sortOrder: i,
        })),
        ...DEFAULT_CHECKLIST.optional.map((label, i) => ({
          templateId: template.id,
          label,
          required: false,
          sortOrder: DEFAULT_CHECKLIST.required.length + i,
        })),
      ]);
    });
  } catch (e: any) {
    const root = rootCause(e);
    console.error("[signup] workspace setup failed:", serializeError(e));
    const code = root?.code ?? e?.code ?? "?";
    const msg = root?.message ?? e?.message ?? String(e);
    const detail = root?.detail ? ` (${root.detail})` : "";
    return { error: `${code}: ${msg}${detail}` };
  }

  return { success: true };
}

export async function login(formData: FormData): Promise<{ error: string } | { success: true }> {
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
