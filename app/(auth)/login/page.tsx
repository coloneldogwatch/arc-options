"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconChartArcs } from "@tabler/icons-react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await login(formData);
      if ("error" in result) {
        setError(result.error);
      } else {
        window.location.href = "/dashboard";
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-[9px] bg-accent flex items-center justify-center text-white">
            <IconChartArcs size={18} />
          </div>
          <span className="font-display font-semibold text-[17px] tracking-tight">Arc Options</span>
        </div>

        <div className="bg-surface border border-border/10 rounded-lg p-6">
          <h1 className="text-[20px] font-display font-medium mb-1">Welcome back</h1>
          <p className="text-[13px] text-text-2 mb-6">Sign in to your workspace.</p>

          {error && (
            <div className="text-neg text-[12.5px] mb-4 bg-neg-soft rounded px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <div className="text-xs text-text-2 mb-1.5">Email</div>
              <input name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <div className="text-xs text-text-2 mb-1.5">Password</div>
              <input name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-1 bg-accent text-white border-transparent rounded py-[9px] text-[13px] font-medium hover:brightness-110 transition-all disabled:opacity-60"
            >
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center mt-4 text-[12.5px] text-text-2">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent hover:underline">
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
