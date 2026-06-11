import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number, compact = false): string {
  const abs = Math.abs(n);
  if (compact && abs >= 1000) {
    const k = abs / 1000;
    return (n >= 0 ? "+$" : "−$") + k.toFixed(1) + "k";
  }
  return (n >= 0 ? "+$" : "−$") + Math.abs(Math.round(n)).toLocaleString();
}

export function formatPct(n: number, decimals = 0): string {
  return (n >= 0 ? "+" : "") + n.toFixed(decimals) + "%";
}

export function formatDte(dte: number): string {
  if (dte < 1) return `${(dte * 24).toFixed(0)}h`;
  if (dte < 30) return `${dte.toFixed(1)}d`;
  return `${Math.round(dte / 30)}mo`;
}

export function isoWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
