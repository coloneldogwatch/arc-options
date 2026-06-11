"use client";

import { useState, useTransition } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
import { completeWeeklyReview } from "@/lib/actions/reviews";

export default function WeeklyPage() {
  const [went, setWent] = useState("");
  const [slipped, setSlipped] = useState("");
  const [change, setChange] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filled = went.trim() && slipped.trim() && change.trim();

  function handleSubmit() {
    if (!filled) return;
    startTransition(async () => {
      await completeWeeklyReview({ whatWentWell: went, processSlips: slipped, oneChange: change });
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="p-[26px] flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-[32px] mb-2">✓</div>
          <div className="font-display font-medium text-[17px]">Week complete</div>
          <div className="text-[13px] text-text-2 mt-1">Streak extended. See you next week.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[26px]">
      <div className="grid grid-cols-4 gap-3 mb-5">
        <MetricCard label="Streak" value="4 wks" />
        <MetricCard label="Week P&L" value="+$1,240" valueClass="text-pos" />
        <MetricCard label="Trades closed" value="11" />
        <MetricCard label="Adherence" value="85%" />
      </div>

      <Card>
        <div className="font-display font-medium text-[15px]">Weekly reflection</div>
        <div className="text-[12.5px] text-text-2 mt-1 mb-[18px]">
          Three prompts. Keep it honest, keep it short.
        </div>
        <div className="grid gap-4">
          <div>
            <div className="text-xs text-text-2 mb-1.5">What went well this week?</div>
            <textarea
              rows={2}
              value={went}
              onChange={(e) => setWent(e.target.value)}
              placeholder="Your win…"
            />
          </div>
          <div>
            <div className="text-xs text-text-2 mb-1.5">Where did your process slip?</div>
            <textarea
              rows={2}
              value={slipped}
              onChange={(e) => setSlipped(e.target.value)}
              placeholder="Where you broke your own rules…"
            />
          </div>
          <div>
            <div className="text-xs text-text-2 mb-1.5">One change for next week</div>
            <textarea
              rows={2}
              value={change}
              onChange={(e) => setChange(e.target.value)}
              placeholder="The one thing you'll do differently…"
            />
          </div>
        </div>
        <Button
          variant="primary"
          className="w-full mt-[18px] py-3"
          disabled={!filled || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Saving…" : "Complete week · extend streak →"}
        </Button>
      </Card>
    </div>
  );
}
