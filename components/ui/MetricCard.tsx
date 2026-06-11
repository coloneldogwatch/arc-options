import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  valueClass?: string;
};

export default function MetricCard({ label, value, valueClass }: MetricCardProps) {
  return (
    <div className="bg-surface-2 rounded p-3.5 px-4">
      <div className="text-xs text-text-2">{label}</div>
      <div className={cn("font-mono font-medium text-[23px] mt-0.5 tracking-tight", valueClass)}>
        {value}
      </div>
    </div>
  );
}
