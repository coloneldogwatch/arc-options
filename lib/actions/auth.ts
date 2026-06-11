"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { workspaces, workspaceMembers, checklistTemplates, checklistItems } from "@/lib/db/schema";
import { DEFAULT_CHECKLIST } from "@/types";

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
  const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || userId.slice(0, 8);

  try {
    const [workspace] = await db
      .insert(workspaces)
      .values({ name: workspaceName, slug })
      .returning();

    await db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
    });

    const [template] = await db
      .insert(checklistTemplates)
      .values({ workspaceId: workspace.id, name: "Default", isDefault: true })
      .returning();

    await db.insert(checklistItems).values([
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
  } catch (e: any) {
    const errInfo = JSON.stringify(e, Object.getOwnPropertyNames(e));
    console.error("[signup] workspace creation failed:", errInfo);
    return { error: `${e?.code ?? "?"}: ${e?.message ?? String(e)}` };
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
