"use client";

import Link from "next/link";
import { IconSearch, IconSun, IconMoon, IconPlus, IconMenu2 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type TopBarProps = {
  title: string;
  onMenuClick?: () => void;
};

export default function TopBar({ title, onMenuClick }: TopBarProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("arc-theme");
    if (stored === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      setDark(true);
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("arc-theme", next ? "dark" : "light");
  }

  return (
    <header className="flex items-center gap-3.5 px-[26px] py-4 border-b border-border/10 sticky top-0 bg-surface z-10">
      <button
        onClick={onMenuClick}
        className="w-[34px] h-[34px] flex items-center justify-center rounded border border-border-strong text-text-2 hover:bg-surface-2 lg:hidden"
        aria-label="Open menu"
      >
        <IconMenu2 size={18} />
      </button>
      <h1 className="text-[19px] font-display font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2.5">
        <div className="flex items-center gap-2 border border-border/10 rounded px-2.5 py-[7px] text-text-3 text-[13px] min-w-[160px] cursor-text">
          <IconSearch size={15} />
          Search symbol&hellip;
        </div>
        <button
          onClick={toggleTheme}
          className="w-[34px] h-[34px] flex items-center justify-center rounded border border-border-strong text-text-2 hover:bg-surface-2"
          aria-label="Toggle theme"
        >
          {dark ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>
        <Link href="/builder">
          <Button variant="primary">
            <IconPlus size={14} /> New trade
          </Button>
        </Link>
      </div>
    </header>
  );
}
