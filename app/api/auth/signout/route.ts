import { NextResponse } from "next/server";
import { signout } from "@/lib/actions/auth";

export async function POST() {
  await signout();
  return NextResponse.redirect("/login");
}
