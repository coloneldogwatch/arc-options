"use client";

import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SegmentControl from "@/components/ui/SegmentControl";
import { saveReview } from "@/lib/actions/reviews";

const MISTAKE_TAGS = [
  "Exited too early",
  "Chased entry",
  "Oversized",
  "Abandoned thesis",
  "No clean trigger",
  "Held through earnings",
];

const RATINGS = ["1", "2", "3", "4", "5"] as const;

function RatingRow({
  label,
  note,
  value,
  onChange,
}: {
  label: string;
  note?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-xs text-text-2 mb-1.5">
        {label} {note && <span className="text-text-3">{note}</span>}
      </div>
      <SegmentControl
        options={RATINGS.map((r) => ({ value: r, label: r }))}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

type Props = {
  positionId: string | null;
  positionLabel?: string;
  realizedPnl?: number | null;
  entryThesis?: string | null;
  initialLesson?: string;
};

export default function ReviewForm({
  positionId,
  positionLabel,
  realizedPnl,
  entryThesis,
  initialLesson,
}: Props) {
  const [selectedTags, setSelectedTags] = useState(new Set<string>());
  const [lesson, setLesson] = useState(initialLesson ?? "");
  const [thesisAccuracy, setThesisAccuracy] = useState("3");
  const [entryQuality, setEntryQuality] = useState("3");
  const [exitQuality, setExitQuality] = useState("3");
  const [positionSizing, setPositionSizing] = useState("3");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleTag(t: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  function handleSave() {
    if (!lesson.trim() || !positionId) return;
    startTransition(async () => {
      await saveReview({
        positionId,
        thesisAccuracy: Number(thesisAccuracy),
        entryQuality: Number(entryQuality),
        exitQuality: Number(exitQuality),
        positionSizing: Number(positionSizing),
        lessonLearned: lesson,
        mistakeLabels: Array.from(selectedTags),
      });
      setSaved(true);
    });
  }

  const pnlNum = realizedPnl ?? 0;

  return (
    <div className="p-[26px]">
      {/* Trade header */}
      <Card className="mb-4 flex items-center">
        <div>
          <div className="font-semibold text-[15px]">
            {positionLabel ?? "Trade review"}
          </div>
          {!positionId && (
            <div className="text-[12.5px] text-text-2 mt-1">No position selected</div>
          )}
        </div>
        {realizedPnl !== undefined && realizedPnl !== null && (
          <div className="ml-auto text-right">
            <div
              className={[
                "font-mono text-[22px] font-medium",
                pnlNum >= 0 ? "text-pos" : "text-neg",
              ].join(" ")}
            >
              {pnlNum >= 0
                ? `+$${Math.round(pnlNum)}`
                : `−$${Math.abs(Math.round(pnlNum))}`}
            </div>
            <div className="text-xs text-text-2">realized P&L</div>
          </div>
        )}
      </Card>

      {/* Entry thesis */}
      {entryThesis && (
        <div className="bg-accent-soft rounded p-3 px-3.5 mb-4">
          <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-accent mb-1.5">
            Your entry thesis
          </div>
          <div className="text-[13px]">{entryThesis}</div>
        </div>
      )}

      {/* Process ratings */}
      <Card className="mb-4">
        <div className="font-display font-medium text-[15px] mb-[18px]">Rate your process</div>
        <div className="grid gap-4">
          <RatingRow
            label="Thesis accuracy"
            note="(vs. what actually happened)"
            value={thesisAccuracy}
            onChange={setThesisAccuracy}
          />
          <RatingRow label="Entry quality" value={entryQuality} onChange={setEntryQuality} />
          <RatingRow
            label="Exit & management"
            value={exitQuality}
            onChange={setExitQuality}
          />
          <RatingRow
            label="Position sizing"
            value={positionSizing}
            onChange={setPositionSizing}
          />
        </div>
      </Card>

      {/* Lesson + mistakes */}
      <Card>
        <div className="font-display font-medium text-[15px] mb-3.5">Lesson learned</div>
        <textarea
          rows={3}
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="The one thing this trade taught you…"
        />

        <div className="text-xs text-text-2 mt-4 mb-2.5">Tag mistakes</div>
        <div className="flex flex-wrap gap-2">
          {MISTAKE_TAGS.map((t) => (
            <span
              key={t}
              onClick={() => toggleTag(t)}
              className={[
                "text-[12.5px] px-3 py-1.5 border border-border-strong rounded-[16px] cursor-pointer text-text-2 transition-all select-none",
                selectedTags.has(t)
                  ? "bg-accent-soft border-transparent text-accent font-medium"
                  : "hover:border-accent",
              ].join(" ")}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="flex justify-end mt-[18px]">
          <Button
            variant="primary"
            className="px-5 py-2.5"
            disabled={!lesson.trim() || !positionId || isPending || saved}
            onClick={handleSave}
          >
            {saved ? "Saved ✓" : isPending ? "Saving…" : "Save review"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
