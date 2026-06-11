"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

type Props = {
  positionLabel: string;
  entryCredit: number;
};

export default function ClosePositionModal({ positionLabel, entryCredit }: Props) {
  const [open, setOpen] = useState(false);
  const [debit, setDebit] = useState("0.20");
  const [lesson, setLesson] = useState("");

  const pnl = (entryCredit - parseFloat(debit || "0")) * 100;
  const canSave = lesson.trim().length > 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-accent cursor-pointer font-medium text-[13.5px] hover:underline"
      >
        Close
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="bg-surface border border-border/10 rounded-lg w-full max-w-[460px] p-6">
        <div className="font-display font-medium text-[15px] mb-1">Close position</div>
        <div className="text-[12.5px] text-text-2 mb-[18px]">
          {positionLabel} &nbsp;·&nbsp; opened for ${entryCredit.toFixed(2)} credit
        </div>

        <div className="flex gap-3.5 mb-4">
          <div className="flex-1">
            <div className="text-xs text-text-2 mb-1.5">Closing debit (per spread)</div>
            <input
              className="font-mono"
              value={debit}
              onChange={(e) => setDebit(e.target.value)}
              type="number"
              step="0.01"
              min="0"
            />
          </div>
          <div className="flex-1">
            <div className="text-xs text-text-2 mb-1.5">Realized P&L (auto)</div>
            <div
              className={[
                "font-mono text-[22px] font-medium pt-1",
                pnl >= 0 ? "text-pos" : "text-neg",
              ].join(" ")}
            >
              {pnl >= 0 ? `+$${Math.round(pnl)}` : `−$${Math.abs(Math.round(pnl))}`}
            </div>
          </div>
        </div>

        <div className="text-xs text-text-2 mb-1.5">
          Lesson learned <span className="text-accent">· required to close</span>
        </div>
        <textarea
          rows={3}
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="What did this trade teach you? (You can't skip this — it's the whole point.)"
        />

        <div className="flex gap-2.5 mt-[18px]">
          <Button className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-[1.4]"
            disabled={!canSave}
            onClick={() => {
              setOpen(false);
              // TODO: call server action
            }}
          >
            Save & review →
          </Button>
        </div>
      </div>
    </div>
  );
}
