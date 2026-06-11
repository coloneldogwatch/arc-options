"use client";

import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DEFAULT_CHECKLIST } from "@/types";

export default function ChecklistPage() {
  const [required, setRequired] = useState<boolean[]>(
    DEFAULT_CHECKLIST.required.map((_, i) => i < 3)
  );
  const [optional, setOptional] = useState<boolean[]>(
    DEFAULT_CHECKLIST.optional.map(() => false)
  );

  const checkedCount = required.filter(Boolean).length;
  const total = required.length;
  const score = Math.round((checkedCount / total) * 100);

  function toggle(arr: boolean[], i: number) {
    return arr.map((v, j) => (j === i ? !v : v));
  }

  return (
    <div className="p-[26px]">
      <div
        className="grid gap-5 items-start"
        style={{ gridTemplateColumns: "1fr 240px" }}
      >
        {/* Main checklist */}
        <Card>
          <div className="font-display font-medium text-[15px] mb-1">
            SOFI · Bull put spread
          </div>
          <div className="text-[12.5px] text-text-2 mb-4">
            Required items count toward your adherence score. Optional items are informational.
          </div>

          <div className="text-xs font-medium text-text mb-2">Required</div>
          <div>
            {DEFAULT_CHECKLIST.required.map((label, i) => (
              <div
                key={i}
                onClick={() => setRequired(toggle(required, i))}
                className={[
                  "flex items-center gap-3 py-3 border-b border-border/10 last:border-none cursor-pointer",
                  required[i] ? "opacity-100" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center flex-shrink-0 text-white text-[13px] transition-all",
                    required[i]
                      ? "bg-accent border-transparent"
                      : "border-border-strong",
                  ].join(" ")}
                >
                  {required[i] && "✓"}
                </span>
                <span className={required[i] ? "line-through text-text-3" : ""}>{label}</span>
              </div>
            ))}
          </div>

          <div className="text-xs font-medium text-text mt-[18px] mb-2">Optional</div>
          <div>
            {DEFAULT_CHECKLIST.optional.map((label, i) => (
              <div
                key={i}
                onClick={() => setOptional(toggle(optional, i))}
                className="flex items-center gap-3 py-3 border-b border-border/10 last:border-none cursor-pointer"
              >
                <span
                  className={[
                    "w-5 h-5 rounded-[6px] border-[1.5px] flex items-center justify-center flex-shrink-0 text-white text-[13px] transition-all",
                    optional[i]
                      ? "bg-accent border-transparent"
                      : "border-border-strong",
                  ].join(" ")}
                >
                  {optional[i] && "✓"}
                </span>
                <span className={optional[i] ? "line-through text-text-3" : ""}>{label}</span>
                <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-surface-2 text-text-2">
                  Optional
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 mt-5">
            <Link href="/builder" className="flex-1">
              <Button className="w-full py-2.5">Back to builder</Button>
            </Link>
            <Link href="/builder" className="flex-[1]">
              <Button variant="primary" className="w-full py-2.5" disabled={checkedCount === 0}>
                Continue to logging →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Adherence score sidebar */}
        <Card className="text-center sticky top-[90px]">
          <div className="text-xs text-text-2 mb-2">Adherence score</div>
          <div className="font-mono text-[42px] font-medium tracking-tight">{score}%</div>
          <div className="text-xs text-text-2">
            {checkedCount} of {total} required
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
