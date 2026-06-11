"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconChartCandle,
  IconChecklist,
  IconBooks,
  IconTargetArrow,
  IconRadar2,
  IconChartBar,
  IconClipboardCheck,
  IconCalendarEvent,
  IconChartArcs,
  IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import ProBadge from "@/components/ui/ProBadge";

const navItems = [
  {
    group: "Workflow",
    items: [
      { id: "dashboard", href: "/dashboard", icon: IconLayoutDashboard, label: "Dashboard" },
      { id: "builder", href: "/builder", icon: IconChartCandle, label: "Strategy builder" },
      { id: "checklist", href: "/checklist", icon: IconChecklist, label: "Pre-trade checklist" },
      { id: "library", href: "/library", icon: IconBooks, label: "Strategy library" },
      { id: "optimizer", href: "/optimizer", icon: IconTargetArrow, label: "Optimizer", pro: true },
      { id: "flow", href: "/flow", icon: IconRadar2, label: "Flow scanner", pro: true },
    ],
  },
  {
    group: "Improve",
    items: [
      { id: "analytics", href: "/analytics", icon: IconChartBar, label: "Analytics" },
      { id: "review", href: "/review", icon: IconClipboardCheck, label: "Trade review" },
      { id: "weekly", href: "/weekly", icon: IconCalendarEvent, label: "Weekly review" },
    ],
  },
];

type SidebarProps = {
  userInitials?: string;
  userName?: string;
  isPro?: boolean;
};

export default function Sidebar({ userInitials = "AB", userName = "Abi", isPro = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-2 border-r border-border/10 flex flex-col pt-[18px] pb-0 sticky top-0 h-screen">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-[18px]">
        <div className="w-[30px] h-[30px] rounded-[9px] bg-accent flex items-center justify-center text-white">
          <IconChartArcs size={18} />
        </div>
        <span className="font-display font-semibold text-[17px] tracking-tight">Arc Options</span>
      </div>

      {/* Nav groups */}
      {navItems.map((group) => (
        <div key={group.group}>
          <div className="text-[11px] uppercase tracking-[0.08em] text-text-3 px-[22px] py-1.5">
            {group.group}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-[11px] mx-3 px-3 py-[9px] rounded text-[13.5px] text-text-2 transition-all duration-[120ms]",
                  active
                    ? "bg-surface text-text font-medium [&_svg]:text-accent"
                    : "hover:bg-surface hover:text-text"
                )}
              >
                <Icon size={18} />
                {item.label}
                {item.pro && <ProBadge />}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Account area */}
      <div className="mt-auto mx-3 flex items-center gap-2.5 p-2.5 rounded bg-surface mb-3">
        <div className="w-[30px] h-[30px] rounded-full bg-accent-soft text-accent flex items-center justify-center font-semibold text-xs">
          {userInitials}
        </div>
        <div className="text-[12.5px]">
          <div className="font-medium">{userName}</div>
          <div className={cn("text-[11.5px]", isPro ? "text-pos" : "text-text-3")}>
            {isPro ? "Pro plan" : "Free plan"}
          </div>
        </div>
        <IconSettings size={16} className="ml-auto text-text-3 cursor-pointer hover:text-text-2" />
      </div>
    </aside>
  );
}
