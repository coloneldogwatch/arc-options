"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: React.ReactNode };

type SegmentControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
};

export default function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentControlProps<T>) {
  return (
    <div className={cn("flex gap-[5px]", className)}>
      {options.map((o) => (
        <span
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 text-center text-[12.5px] py-2 border border-border-strong rounded cursor-pointer select-none transition-all duration-[120ms] text-text-2",
            value === o.value
              ? "bg-accent-soft border-transparent text-accent font-medium"
              : "hover:bg-surface-2"
          )}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}
