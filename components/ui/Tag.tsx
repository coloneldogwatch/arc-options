import { cn } from "@/lib/utils";

type TagVariant = "green" | "red" | "warn" | "neutral" | "accent";

const styles: Record<TagVariant, string> = {
  green: "bg-pos-soft text-pos",
  red: "bg-neg-soft text-neg",
  warn: "bg-warn-soft text-warn",
  neutral: "bg-surface-2 text-text-2",
  accent: "bg-accent-soft text-accent",
};

export default function Tag({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: TagVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-[6px] inline-block",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
