import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Building2, CheckCircle2, Clock, ExternalLink, Globe, Loader2, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiLabel, AiUnavailableNote } from "@/components/ai/AiMark";
import CompanyLogo from "@/components/common/CompanyLogo";
import StatusBadge from "@/components/common/StatusBadge";
import JobDescriptionText from "@/components/jobs/JobDescriptionText";
import { MatchRing } from "@/components/jobs/MatchBadge";
import { matchTier } from "@/components/jobs/match";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMatches } from "@/hooks/useMatches";
import { api, errorMessage } from "@/lib/api";
import { classifyLoadError } from "@/lib/loadError";
import LoadError from "@/components/common/LoadError";
import { formatExperience, formatPlace, formatSalary, plural, timeAgo } from "@/lib/format";

const MatchPanel = ({ jobId }) => {
  const ai = useAiStatus();
  const { user, isCandidate } = useAuth();
  const { matches, pending, issue } = useMatches(isCandidate ? [jobId] : []);
  const match = matches[jobId];

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">See a 0–100 fit score for this job, the reasons behind it and the skills you're missing.</p>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/signup">Create profile</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/login" state={{ from: `/jobs/${jobId}` }}>
              Log in
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  if (!isCandidate) return <p className="text-sm text-muted-foreground">Match scores are shown to candidates.</p>;
  if (!ai.loading && !ai.enabled) return <AiUnavailableNote>Match scores need AI, which is switched off right now.</AiUnavailableNote>;
  if (issue === "PROFILE_EMPTY") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Add skills or upload a resume so we can compare you with this job.</p>
        <Button asChild size="sm" variant="outline">
          <Link to="/profile">Complete profile</Link>
        </Button>
      </div>
    );
  }
  if (issue) return <AiUnavailableNote>Couldn't score this job right now. Try again in a minute.</AiUnavailableNote>;
  if (pending || !match) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex items-center gap-4">
          <Skeleton className="size-[76px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    );
  }

  const tier = matchTier(match.score);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center gap-4">
        <MatchRing score={match.score} />
        <div>
          <p className={`font-medium ${tier.tone}`}>{tier.label}</p>
          <p className="text-sm text-muted-foreground">for your current profile</p>
        </div>
      </div>
      {match.reasons?.length > 0 && (
        <ul className="space-y-2.5 text-sm">
          {match.reasons.map((r) => (
            <li key={r} className="flex gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              {r}
            </li>
          ))}
        </ul>
      )}
      {match.missingSkills?.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {match.missingSkills.map((s) => (
              <span key={s} className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

const ApplyBox = ({ job, application, onApplied }) => {
  const { user, isCandidate } = useAuth();
  const [applying, setApplying] = useState(false);

  if (application) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled variant="outline">
          <CheckCircle2 className="text-success" /> Applied
        </Button>
        {application.status !== "applied" && <StatusBadge status={application.status} />}
      </div>
    );
  }
  if (!user) {
    return (
      <Button asChild>
        <Link to="/login" state={{ from: `/jobs/${job._id}` }}>
          Log in to apply
        </Link>
      </Button>
    );
  }
  if (!isCandidate) return <Button disabled variant="outline">Recruiter accounts can't apply</Button>;

  return (
    <Button
      disabled={applying}
      onClick={async () => {
        setApplying(true);
        try {
          const { data } = await api.post(`/application/apply/${job._id}`);
          onApplied(data.application);
          toast.success("Application sent", { description: `${job.title} at ${job.company?.name}` });
        } catch (error) {
          toast.error(errorMessage(error, "Couldn't apply."));
        } finally {
          setApplying(false);
        }
      }}
    >
      {applying && <Loader2 className="animate-spin" />} Apply now
    </Button>
  );
};

const Meta = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5">
    <Icon className="size-4 text-muted-foreground" />
    {children}
  </span>
);

const JobDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ id: null, job: null, application: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useDocumentTitle(state.job?.title);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/job/get/${id}`)
      .then(({ data }) => !cancelled && setState({ id, job: data.job, application: data.viewerApplication, error: null }))
      .catch((error) => !cancelled && setState({ id, job: null, application: null, error: classifyLoadError(error, { subject: "this job" }) }));
    return () => {
      cancelled = true;
    };
  }, [id, user?._id, attempt]);

  const { job, application, error } = state;
  const loading = state.id !== id;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LoadError
          error={error}
          onRetry={() => {
            setState({ id: null, job: null, application: null, error: null });
            setAttempt((a) => a + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All jobs
      </Link>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-72 max-w-[60vw]" />
            </div>
          </div>
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-6 pt-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <header className="mt-6 flex flex-col gap-5 border-b pb-8 md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <CompanyLogo company={job.company} className="size-14 rounded-xl text-sm" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{job.company?.name}</p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{job.title}</h1>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  <Meta icon={MapPin}>{job.workMode === "Remote" ? job.location : formatPlace(job)}</Meta>
                  <Meta icon={Briefcase}>
                    {job.jobType} · {formatExperience(job.experienceLevel)}
                  </Meta>
                  <Meta icon={Users}>
                    {plural(job.position, "opening")} · {plural(job.applicantCount, "applicant")}
                  </Meta>
                  <Meta icon={Clock}>Posted {timeAgo(job.createdAt)}</Meta>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 md:items-end">
              <p className="text-xl font-semibold tabular-nums">{formatSalary(job)}</p>
              <ApplyBox job={job} application={application} onApplied={(a) => setState((s) => ({ ...s, application: a }))} />
            </div>
          </header>

          <div className="grid gap-8 pt-8 lg:grid-cols-[1fr_340px]">
            <article className="min-w-0 space-y-8">
              <JobDescriptionText text={job.description} />
              {job.requirements?.length > 0 && (
                <div>
                  <h2 className="mb-3 font-medium">Skills</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requirements.map((r) => (
                      <span key={r} className="rounded-md border bg-card px-2.5 py-1 text-sm">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <aside className="space-y-4">
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-medium">Your match</h2>
                  <AiLabel />
                </div>
                <MatchPanel jobId={job._id} />
              </div>
              {job.company && (
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <CompanyLogo company={job.company} className="size-9" />
                    <div className="min-w-0">
                      <h2 className="truncate font-medium">{job.company.name}</h2>
                      {job.company.location && <p className="text-xs text-muted-foreground">{job.company.location}</p>}
                    </div>
                  </div>
                  {job.company.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{job.company.description}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/jobs?company=${job.company._id}`}>
                        <Building2 /> More jobs
                      </Link>
                    </Button>
                    {job.company.website && !job.company.isSeed && (
                      <Button asChild variant="ghost" size="sm">
                        <a href={job.company.website} target="_blank" rel="noreferrer">
                          <Globe /> Website <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default JobDetail;
