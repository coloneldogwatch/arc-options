import Link from "next/link";
import { IconChartArcs } from "@tabler/icons-react";

export default function LoginPage() {
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

          <div className="grid gap-4">
            <div>
              <div className="text-xs text-text-2 mb-1.5">Email</div>
              <input type="email" placeholder="you@example.com" />
            </div>
            <div>
              <div className="text-xs text-text-2 mb-1.5">Password</div>
              <input type="password" placeholder="••••••••" />
            </div>
          </div>

          <button className="w-full mt-5 bg-accent text-white border-transparent rounded py-[9px] text-[13px] font-medium hover:brightness-110 transition-all">
            Sign in
          </button>

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
