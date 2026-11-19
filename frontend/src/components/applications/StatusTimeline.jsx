import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "applied", label: "Applied" },
  { id: "viewed", label: "Viewed" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interview" },
  { id: "offered", label: "Offer" },
];

const StatusTimeline = ({ application, compact = false }) => {
  const reached = new Map((application.history || []).map((h) => [h.status, h.at]));
  if (!reached.has("applied")) reached.set("applied", application.createdAt);
  const rejected = application.status === "rejected";
  const currentIndex = STEPS.findIndex((s) => s.id === application.status);
  const lastReachedIndex = rejected
    ? Math.max(...STEPS.map((s, i) => (reached.has(s.id) ? i : -1)))
    : currentIndex;
  const steps = rejected ? [...STEPS.slice(0, lastReachedIndex + 1), { id: "rejected", label: "Not selected" }] : STEPS;

  const current = steps.find((step) => step.id === application.status);
  const currentAt = reached.get(application.status);
  return (
    <div>
    <ol className={cn("flex w-full", compact ? "gap-1" : "gap-1.5")} aria-label="Application progress">
      {steps.map((step, i) => {
        const done = step.id === "rejected" || i <= lastReachedIndex;
        const isCurrent = step.id === application.status;
        const at = reached.get(step.id);
        return (
          <li key={step.id} className="min-w-0 flex-1" aria-current={isCurrent ? "step" : undefined}>
            <div
              className={cn(
                "h-1.5 rounded-full",
                step.id === "rejected" ? "bg-destructive/70" : done ? "bg-primary" : "bg-border"
              )}
            />
            {!compact && (
              <div className="mt-2 min-w-0 max-sm:hidden">
                <p
                  className={cn(
                    "flex items-center gap-1 truncate text-xs",
                    isCurrent ? "font-semibold text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {step.id === "rejected" ? (
                    <X className="size-3 shrink-0 text-destructive" aria-hidden="true" />
                  ) : done ? (
                    <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />
                  ) : null}
                  {step.label}
                </p>
                {at && done && <p className="truncate text-[11px] text-muted-foreground max-sm:hidden">{formatDate(at)}</p>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
    {!compact && current && (
      <p className="mt-2 text-xs sm:hidden">
        <span className="font-semibold">{current.label}</span>
        {currentAt && <span className="text-muted-foreground"> · {formatDate(currentAt)}</span>}
      </p>
    )}
    </div>
  );
};

export default StatusTimeline;
