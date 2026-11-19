import { MatchRing } from "@/components/jobs/MatchBadge";

const SAMPLE = {
  score: 86,
  role: "Frontend Engineer (React)",
  reasons: ["React and TypeScript match the core stack", "Dashboard work lines up with the role", "Experience meets the 1-year bar"],
  have: ["React", "TypeScript", "Next.js", "Jest"],
  missing: ["Redux Toolkit", "Accessibility audits"],
};

const MatchPreview = () => (
  <div className="rounded-2xl border bg-card p-5 shadow-xl shadow-black/[0.04] sm:p-6 dark:shadow-black/30">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium">Your match</p>
      <span className="text-xs text-muted-foreground">Illustration</span>
    </div>
    <div className="mt-5 flex items-center gap-4">
      <MatchRing score={SAMPLE.score} />
      <div>
        <p className="font-medium text-success">Strong match</p>
        <p className="text-sm text-muted-foreground">{SAMPLE.role}</p>
      </div>
    </div>
    <ul className="mt-5 space-y-2.5 text-sm">
      {SAMPLE.reasons.map((r) => (
        <li key={r} className="flex gap-2.5">
          <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-success" />
          {r}
        </li>
      ))}
    </ul>
    <div className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You have</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE.have.map((s) => (
            <span key={s} className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">
              {s}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missing</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SAMPLE.missing.map((s) => (
            <span key={s} className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default MatchPreview;
