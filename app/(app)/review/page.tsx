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

// Demo position ID — in production this comes from the URL / props
const DEMO_POSITION_ID = "00000000-0000-0000-0000-000000000000";

export default function ReviewPage() {
  const [selectedTags, setSelectedTags] = useState(new Set(["Exited too early"]));
  const [lesson, setLesson] = useState(
    "Took profit at 50% but the thesis had room — exited too early out of fear of giving back gains. Next time hold to my planned target."
  );
  const [thesisAccuracy, setThesisAccuracy] = useState("4");
  const [entryQuality, setEntryQuality] = useState("4");
  const [exitQuality, setExitQuality] = useState("4");
  const [positionSizing, setPositionSizing] = useState("4");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleTag(t: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { next.delete(t); } else { next.add(t); }
      return next;
    });
  }

  function handleSave() {
    if (!lesson.trim()) return;
    startTransition(async () => {
      await saveReview({
        positionId: DEMO_POSITION_ID,
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

  return (
    <div className="p-[26px]">
      {/* Trade header */}
      <Card className="mb-4 flex items-center">
        <div>
          <div className="font-semibold text-[15px]">TSLA · Bull put spread</div>
          <div className="text-[12.5px] text-text-2 mt-1">Closed Jun 6 · held 9 days · 250/245</div>
        </div>
        <div className="ml-auto text-right">
          <div className="font-mono text-pos text-[22px] font-medium">+$320</div>
          <div className="text-xs text-text-2">+64% on risk · auto-calculated</div>
        </div>
      </Card>

      {/* Entry thesis */}
      <div className="bg-accent-soft rounded p-3 px-3.5 mb-4">
        <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-accent mb-1.5">
          Your entry thesis · written Jun 6
        </div>
        <div className="text-[13px]">
          TSLA holding above 250 support after earnings; selling the 250/245 put spread to collect
          premium into expected consolidation. Defined risk, 35 DTE.
        </div>
      </div>

      {/* Process ratings */}
      <Card className="mb-4">
        <div className="font-display font-medium text-[15px] mb-[18px]">Rate your process</div>
        <div className="grid gap-4">
          <RatingRow label="Thesis accuracy" note="(vs. what actually happened)" value={thesisAccuracy} onChange={setThesisAccuracy} />
          <RatingRow label="Entry quality" value={entryQuality} onChange={setEntryQuality} />
          <RatingRow label="Exit & management" value={exitQuality} onChange={setExitQuality} />
          <RatingRow label="Position sizing" value={positionSizing} onChange={setPositionSizing} />
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
            disabled={!lesson.trim() || isPending || saved}
            onClick={handleSave}
          >
            {saved ? "Saved ✓" : isPending ? "Saving…" : "Save review"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
