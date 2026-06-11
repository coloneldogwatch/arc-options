"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { saveChecklistResponses } from "@/lib/actions/checklist";

type Item = {
  id: string;
  label: string;
  required: boolean;
  sortOrder: number;
};

type Props = {
  positionId: string;
  positionLabel: string;
  items: Item[];
  initialResponses: Record<string, boolean>;
};

export default function ChecklistForm({
  positionId,
  positionLabel,
  items,
  initialResponses,
}: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(initialResponses);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const requiredItems = items.filter((i) => i.required);
  const optionalItems = items.filter((i) => !i.required);

  const checkedRequired = requiredItems.filter((i) => checked[i.id]).length;
  const score =
    requiredItems.length > 0
      ? Math.round((checkedRequired / requiredItems.length) * 100)
      : 100;

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleContinue() {
    startTransition(async () => {
      const responses = items.map((item) => ({
        itemId: item.id,
        checked: !!checked[item.id],
      }));
      await saveChecklistResponses({ positionId, responses });
      router.push("/dashboard");
    });
  }

  function CheckItem({ item, isOptional }: { item: Item; isOptional?: boolean }) {
    return (
      <div
        onClick={() => toggle(item.id)}
        className="flex items-center gap-3 py-3 border-b border-border/10 last:border-none cursor-pointer"
      >
        <span
          className={[
            "w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center flex-shrink-0 text-white text-[13px] transition-all",
            checked[item.id] ? "bg-accent border-transparent" : "border-border-strong",
          ].join(" ")}
        >
          {checked[item.id] && "✓"}
        </span>
        <span className={checked[item.id] ? "line-through text-text-3" : ""}>{item.label}</span>
        {isOptional && (
          <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-surface-2 text-text-2">
            Optional
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-[26px]">
      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1fr 240px" }}>
        <Card>
          <div className="font-display font-medium text-[15px] mb-1">{positionLabel}</div>
          <div className="text-[12.5px] text-text-2 mb-4">
            Required items count toward your adherence score. Optional items are informational.
          </div>

          {requiredItems.length > 0 && (
            <>
              <div className="text-xs font-medium text-text mb-2">Required</div>
              <div>
                {requiredItems.map((item) => (
                  <CheckItem key={item.id} item={item} />
                ))}
              </div>
            </>
          )}

          {optionalItems.length > 0 && (
            <>
              <div className="text-xs font-medium text-text mt-[18px] mb-2">Optional</div>
              <div>
                {optionalItems.map((item) => (
                  <CheckItem key={item.id} item={item} isOptional />
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2.5 mt-5">
            <Link href="/builder" className="flex-1">
              <Button className="w-full py-2.5">Back to builder</Button>
            </Link>
            <Button
              variant="primary"
              className="flex-1 py-2.5"
              disabled={isPending || checkedRequired === 0}
              onClick={handleContinue}
            >
              {isPending ? "Saving…" : "Log position →"}
            </Button>
          </div>
        </Card>

        <Card className="text-center sticky top-[90px]">
          <div className="text-xs text-text-2 mb-2">Adherence score</div>
          <div className="font-mono text-[42px] font-medium tracking-tight">{score}%</div>
          <div className="text-xs text-text-2">
            {checkedRequired} of {requiredItems.length} required
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 mt-3.5 overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="text-[11.5px] text-text-3 mt-3.5 leading-relaxed">
            This score is attached to the trade permanently and feeds your behavior analytics.
          </div>
        </Card>
      </div>
    </div>
  );
}
