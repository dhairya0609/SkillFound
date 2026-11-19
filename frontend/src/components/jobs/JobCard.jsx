import { Link } from "react-router-dom";
import { Bookmark, BadgeCheck } from "lucide-react";
import CompanyLogo from "@/components/common/CompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { formatPlace, formatSalary, jobBadge, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MatchBadge } from "./MatchBadge";

export const SaveButton = ({ job, className, withLabel = false }) => {
  const { isSaved, toggle } = useSavedJobs();
  const saved = isSaved(job._id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(job);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
        withLabel ? "h-10 border bg-card px-4 text-sm font-medium text-foreground" : "size-8",
        saved && "text-primary hover:text-primary",
        className
      )}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {withLabel && (saved ? "Saved" : "Save")}
    </button>
  );
};

const BADGE_TONES = {
  brand: "text-primary",
  success: "text-success",
};

export const JobCard = ({ job, match, matchPending, selected, onSelect, className }) => {
  const badge = jobBadge(job);
  return (
    <article
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-4 transition-[border-color,box-shadow,background-color] duration-150 hover:border-foreground/20",
        selected && "border-primary/60 bg-primary/[0.04] hover:border-primary/60",
        className
      )}
    >
      <CompanyLogo company={job.company} className="size-11" />
      <div className="min-w-0 flex-1">
        <h3 className="pr-8 text-[15px] leading-snug font-semibold">
          <Link
            to={`/jobs/${job._id}`}
            onClick={
              onSelect
                ? (e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    onSelect(job);
                  }
                : undefined
            }
            aria-current={selected ? "true" : undefined}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 group-hover:underline group-hover:decoration-foreground/30 group-hover:underline-offset-4"
          >
            {job.title}
          </Link>
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-foreground/80">
          <span className="truncate">{job.company?.name}</span>
          {job.company?.verified && <BadgeCheck className="size-3.5 shrink-0 text-primary" aria-label="Verified employer" />}
        </p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{formatPlace(job)}</p>
        <p className="mt-1.5 text-sm font-medium tabular-nums">{formatSalary(job)}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {(match || matchPending) && <MatchBadge match={match} pending={matchPending} />}
          {badge && <span className={cn("font-medium", BADGE_TONES[badge.tone])}>{badge.label}</span>}
          <span>{timeAgo(job.createdAt)}</span>
          {job.applicantCount > 0 && (
            <span>
              {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>
      <SaveButton job={job} className="absolute top-3 right-3" />
    </article>
  );
};

export const JobCardSkeleton = () => (
  <div className="flex gap-3 rounded-xl border bg-card p-4" aria-hidden="true">
    <Skeleton className="size-11 rounded-[10px]" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  </div>
);
