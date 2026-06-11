"use client";

import { cn } from "@/lib/utils";
import { useBuilder } from "./BuilderContext";

const EXPIRATIONS = [
  { label: "Jun", day: "12", dte: 2.5 },
  { label: "Jun", day: "18", dte: 8 },
  { label: "Jun", day: "26", dte: 16 },
  { label: "Jul", day: "2", dte: 22 },
  { label: "Jul", day: "10", dte: 30 },
  { label: "Jul", day: "17", dte: 37 },
  { label: "Aug", day: "21", dte: 72 },
  { label: "Sep", day: "18", dte: 100 },
  { label: "Oct", day: "16", dte: 128 },
  { label: "Jan", day: "27", dte: 231 },
];

export default function ExpiryTabs() {
  const { state, dispatch } = useBuilder();

  return (
    <div className="flex gap-1 overflow-x-auto pb-1.5 mb-4">
      {EXPIRATIONS.map((exp, i) => (
        <button
          key={i}
          onClick={() => dispatch({ type: "SET_DTE", dte: exp.dte })}
          className={cn(
            "flex-none text-center text-xs px-3 py-[7px] border rounded cursor-pointer transition-all min-w-[54px]",
            state.dte === exp.dte
              ? "bg-accent text-white border-transparent font-medium"
              : "border-border-strong text-text-2 hover:bg-surface-2"
          )}
        >
          <small className="block text-[10px] opacity-70">{exp.label}</small>
          {exp.day}
        </button>
      ))}
    </div>
  );
}
