"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/builder": "Strategy builder",
  "/checklist": "Pre-trade checklist",
  "/library": "Strategy library",
  "/optimizer": "Trade optimizer",
  "/flow": "Unusual flow scanner",
  "/analytics": "Analytics",
  "/review": "Post-trade review",
  "/weekly": "Weekly review",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = titles[pathname] ?? "Arc Options";

  return (
    <div
      className="grid min-h-screen max-w-[1180px] mx-auto bg-surface"
      style={{ gridTemplateColumns: "212px 1fr", borderLeft: "0.5px solid var(--border)", borderRight: "0.5px solid var(--border)" }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={[
          "fixed lg:relative z-40 h-screen transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        style={{ width: "212px" }}
      >
        <Sidebar isPro={true} />
      </div>

      {/* Main content */}
      <div className="min-w-0">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
