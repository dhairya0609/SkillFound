import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import CompanyLogo from "@/components/common/CompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { formatExperience, formatSalary, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MatchBadge } from "./MatchBadge";

export const JobCard = ({ job, match, matchPending, className }) => (
  <Link
    to={`/jobs/${job._id}`}
    className={cn(
      "group relative flex h-full flex-col rounded-xl border bg-card p-4 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:p-5",
      className
    )}
  >
    <div className="flex items-start gap-3">
      <CompanyLogo company={job.company} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-muted-foreground">{job.company?.name}</p>
        <h3 className="mt-0.5 line-clamp-2 font-medium leading-snug group-hover:text-foreground">{job.title}</h3>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <MapPin className="size-3.5" />
        {job.workMode === "Remote" ? "Remote" : `${job.location} · ${job.workMode}`}
      </span>
      <span>{job.jobType}</span>
      <span>{formatExperience(job.experienceLevel)}</span>
    </div>

    <div className="mt-3 flex flex-wrap gap-1.5">
      {(job.requirements || []).slice(0, 3).map((skill) => (
        <span key={skill} className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {skill}
        </span>
      ))}
    </div>

    <div className="mt-auto flex items-center justify-between gap-2 pt-4">
      <span className="text-sm font-medium tabular-nums">{formatSalary(job)}</span>
      {match || matchPending ? (
        <MatchBadge match={match} pending={matchPending} />
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {timeAgo(job.createdAt)}
        </span>
      )}
    </div>
  </Link>
);

export const JobCardSkeleton = () => (
  <div className="flex h-full flex-col rounded-xl border bg-card p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <Skeleton className="size-10 rounded-[10px]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
    <Skeleton className="mt-4 h-3 w-3/4" />
    <div className="mt-3 flex gap-1.5">
      <Skeleton className="h-5 w-14" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-12" />
    </div>
    <div className="mt-6 flex justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-14" />
    </div>
  </div>
);
