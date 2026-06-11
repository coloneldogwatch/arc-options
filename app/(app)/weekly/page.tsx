"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";

export default function WeeklyPage() {
  const [went, setWent] = useState("");
  const [slipped, setSlipped] = useState("");
  const [change, setChange] = useState("");

  const filled = went.trim() && slipped.trim() && change.trim();

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
          disabled={!filled}
        >
          Complete week 5 · extend streak →
        </Button>
      </Card>
    </div>
  );
}
