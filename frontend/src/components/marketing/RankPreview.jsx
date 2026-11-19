import { Sparkles } from "lucide-react";
import { matchTier } from "@/components/jobs/match";
import { cn } from "@/lib/utils";

const ROWS = [
  { initials: "A", score: 91, reason: "Deep React + TypeScript; owned a component library" },
  { initials: "B", score: 78, reason: "Strong React, lighter on testing and accessibility" },
  { initials: "C", score: 64, reason: "Full-stack generalist; little TypeScript" },
  { initials: "D", score: 41, reason: "Promising projects, below the 2-year bar" },
];

const RankPreview = () => (
  <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-6 dark:shadow-black/30">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Frontend Engineer (React)</p>
        <p className="text-xs text-muted-foreground">Applicants ranked by fit</p>
      </div>
      <span className="text-xs text-muted-foreground">Illustration</span>
    </div>
    <ol className="mt-5 space-y-2">
      {ROWS.map((row, i) => {
        const tier = matchTier(row.score);
        return (
          <li key={row.initials} className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
            <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {row.initials}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm">
              <Sparkles className="mr-1.5 inline size-3.5 text-brand" />
              {row.reason}
            </p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", tier.bg, tier.tone)}>{row.score}</span>
          </li>
        );
      })}
    </ol>
  </div>
);

export default RankPreview;
