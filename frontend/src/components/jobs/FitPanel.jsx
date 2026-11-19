import { Link, useLocation } from "react-router-dom";
import { Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { skillsMatch } from "@/lib/format";
import { MatchRing } from "./MatchBadge";
import { matchTier } from "./match";

const SkillChip = ({ skill, matched }) => (
  <span
    className={
      matched
        ? "inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success"
        : "inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground"
    }
  >
    {matched ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
    <span className="sr-only">{matched ? "You have" : "Missing"}: </span>
    {skill}
  </span>
);

const AiMatch = ({ jobId }) => {
  const ai = useAiStatus();
  const { matches, pending, issue } = useMatches([jobId]);
  if (ai.loading || !ai.enabled) return null;
  const match = matches[jobId];
  if (issue === "PROFILE_EMPTY") return null;
  if (issue) {
    return <p className="text-xs text-muted-foreground">The AI match score isn't available right now. Your skills breakdown above still applies.</p>;
  }
  if (pending || !match) {
    return (
      <div className="flex items-center gap-3" aria-busy="true" aria-label="Scoring your match">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }
  const tier = matchTier(match.score);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <MatchRing score={match.score} size={56} />
        <div>
          <p className={`text-sm font-semibold ${tier.tone}`}>{tier.label}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" /> AI estimate from your profile
          </p>
        </div>
      </div>
      {match.reasons?.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {match.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const FitPanel = ({ job }) => {
  const { user, isCandidate } = useAuth();
  const location = useLocation();
  if (user && !isCandidate) return null;

  if (!user) {
    return (
      <section aria-labelledby="fit" className="rounded-xl border bg-muted/40 p-4">
        <h2 id="fit" className="text-sm font-semibold">
          How well do you fit?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to compare your skills with this job and see what's missing before you apply.
        </p>
        <div className="mt-3 flex gap-2">
          <Button asChild size="sm">
            <Link to="/login" state={{ from: location.pathname + location.search }}>
              Sign in
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/signup">Create profile</Link>
          </Button>
        </div>
      </section>
    );
  }

  const skills = user.profile?.skills || [];
  const { matched, missing, total } = skillsMatch(job.requirements, skills);

  return (
    <section aria-labelledby="fit" className="space-y-4 rounded-xl border bg-muted/40 p-4">
      <div>
        <h2 id="fit" className="text-sm font-semibold">
          Your fit
        </h2>
        {skills.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Add skills to your{" "}
            <Link to="/profile" className="font-medium text-foreground underline underline-offset-4">
              profile
            </Link>{" "}
            to see how you match.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm">
              <span className="font-semibold tabular-nums">
                {matched.length} of {total}
              </span>{" "}
              skills match your profile
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border" aria-hidden="true">
              <div className="h-full rounded-full bg-success" style={{ width: `${total ? (matched.length / total) * 100 : 0}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {matched.map((s) => (
                <SkillChip key={s} skill={s} matched />
              ))}
              {missing.map((s) => (
                <SkillChip key={s} skill={s} />
              ))}
            </div>
          </>
        )}
      </div>
      {skills.length > 0 && <AiMatch jobId={job._id} />}
    </section>
  );
};

export default FitPanel;
