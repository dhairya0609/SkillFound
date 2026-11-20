import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Flag,
  Globe,
  Laptop,
  Link2,
  Loader2,
  MapPin,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import LoadError from "@/components/common/LoadError";
import StatusBadge from "@/components/common/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJob, useSimilarJobs } from "@/hooks/useJob";
import { api, errorMessage } from "@/lib/api";
import { closesLabel, formatExperience, formatSalary, plural, postedLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import FitPanel from "./FitPanel";
import { JobCard, SaveButton } from "./JobCard";
import JobDescriptionText from "./JobDescriptionText";
import ReportJobDialog from "./ReportJobDialog";

const ApplyAction = ({ job, application, onApplied, className }) => {
  const { user, isCandidate } = useAuth();
  const location = useLocation();
  const [applying, setApplying] = useState(false);

  if (application) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Button asChild variant="outline" className="h-10">
          <Link to="/my-jobs?tab=applications">
            <CheckCircle2 className="text-success" /> Applied
          </Link>
        </Button>
        {application.status !== "applied" && <StatusBadge status={application.status} />}
      </div>
    );
  }
  if (!job.accepting) {
    return (
      <Button disabled variant="outline" className={cn("h-10", className)}>
        No longer accepting applications
      </Button>
    );
  }
  if (!user) {
    return (
      <Button asChild className={cn("h-10 px-6", className)}>
        <Link to="/login" state={{ from: location.pathname + location.search }}>
          Sign in to apply
        </Link>
      </Button>
    );
  }
  if (!isCandidate) return null;

  return (
    <Button
      className={cn("h-10 px-6", className)}
      disabled={applying}
      onClick={async () => {
        setApplying(true);
        try {
          const { data } = await api.post(`/application/apply/${job._id}`);
          onApplied(data.application);
          toast.success("Application sent", { description: "Track its status in My jobs." });
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

const copyLink = async (id) => {
  const url = `${window.location.origin}/jobs/${id}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast(url, { description: "Copy this link to share the job." });
  }
};

const Fact = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-base font-semibold">{title}</h2>
    {children}
  </section>
);

const BulletList = ({ items }) => (
  <ul className="space-y-2 text-[15px] leading-relaxed text-foreground/90">
    {items.map((item) => (
      <li key={item} className="flex gap-2.5">
        <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-foreground/40" aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const CompanyCard = ({ company }) => (
  <section className="rounded-xl border p-4" aria-labelledby="about-company">
    <div className="flex items-center gap-3">
      <CompanyLogo company={company} className="size-11" />
      <div className="min-w-0">
        <h2 id="about-company" className="flex items-center gap-1 font-semibold">
          <span className="truncate">About {company.name}</span>
          {company.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified employer" />}
        </h2>
        {company.tagline && <p className="truncate text-sm text-muted-foreground">{company.tagline}</p>}
      </div>
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      {company.industry && (
        <div>
          <dt className="text-xs text-muted-foreground">Industry</dt>
          <dd className="font-medium">{company.industry}</dd>
        </div>
      )}
      {company.size && (
        <div>
          <dt className="text-xs text-muted-foreground">Company size</dt>
          <dd className="font-medium">{company.size} employees</dd>
        </div>
      )}
      {company.founded && (
        <div>
          <dt className="text-xs text-muted-foreground">Founded</dt>
          <dd className="font-medium">{company.founded}</dd>
        </div>
      )}
      {(company.locations?.length || company.location) && (
        <div>
          <dt className="text-xs text-muted-foreground">Locations</dt>
          <dd className="font-medium">{(company.locations?.length ? company.locations : [company.location]).join(", ")}</dd>
        </div>
      )}
    </dl>
    {company.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{company.description}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to={`/companies/${company._id}`}>
          <Building2 /> Company page
        </Link>
      </Button>
      {company.website && !company.isSeed && (
        <Button asChild variant="ghost" size="sm">
          <a href={company.website} target="_blank" rel="noreferrer">
            <Globe /> Website
          </a>
        </Button>
      )}
    </div>
  </section>
);

const SimilarJobs = ({ id }) => {
  const jobs = useSimilarJobs(id);
  if (jobs && jobs.length === 0) return null;
  return (
    <section className="space-y-3" aria-labelledby="similar">
      <h2 id="similar" className="text-base font-semibold">
        Similar jobs
      </h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {jobs ? jobs.map((j) => <JobCard key={j._id} job={j} />) : Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </section>
  );
};

const JobDetailSkeleton = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading job">
    <div className="flex gap-4">
      <Skeleton className="size-14 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <Skeleton className="h-24 rounded-xl" />
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton key={i} className="h-4 w-full" />
    ))}
  </div>
);

const JobDetailView = ({ id, variant = "page", headingLevel = 1 }) => {
  const { job, application, error, loading, retry, setApplication } = useJob(id);
  const [reporting, setReporting] = useState(false);
  const Heading = `h${headingLevel}`;
  useDocumentTitle(variant === "page" ? (job ? `${job.title} at ${job.company?.name || "SkillFound"}` : "Job") : null);

  if (error) return <LoadError error={error} onRetry={retry} />;
  if (loading || !job) return <JobDetailSkeleton />;

  const closes = closesLabel(job);
  const company = job.company;
  const isPane = variant === "pane";

  return (
    <article className="space-y-7" aria-labelledby={`job-title-${job._id}`}>
      <header className="space-y-4">
        <div className="flex items-start gap-4">
          <CompanyLogo company={company} className="size-14 rounded-xl text-sm" />
          <div className="min-w-0 flex-1">
            {company && (
              <Link to={`/companies/${company._id}`} className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
                {company.name}
                {company.verified && <BadgeCheck className="size-4 text-primary" aria-label="Verified employer" />}
              </Link>
            )}
            <Heading id={`job-title-${job._id}`} className={cn("mt-0.5 font-semibold tracking-tight text-balance", isPane ? "text-xl" : "text-2xl sm:text-[28px]")}>
              {isPane ? <Link to={`/jobs/${job._id}`} className="hover:underline">{job.title}</Link> : job.title}
            </Heading>
            <p className="mt-1 text-sm text-muted-foreground">
              {[job.location, job.workMode !== "Remote" && job.workMode, postedLabel(job.createdAt), job.applicantCount > 0 && plural(job.applicantCount, "applicant")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {!job.accepting && (
          <p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
            <Clock className="size-4 shrink-0 text-warning" />
            This job is no longer accepting applications.
          </p>
        )}

        <div className={cn("flex flex-wrap items-center gap-2", !isPane && "max-sm:hidden")}>
          <ApplyAction job={job} application={application} onApplied={setApplication} />
          <SaveButton job={job} withLabel />
          <Button variant="ghost" className="h-10" onClick={() => copyLink(job._id)}>
            <Link2 /> Share
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border p-4 sm:grid-cols-3">
        <Fact icon={Wallet} label="Salary">
          <span className="tabular-nums">{formatSalary(job)}</span>
        </Fact>
        <Fact icon={Briefcase} label="Experience">
          {job.experienceLevel > 0 ? `${formatExperience(job.experienceLevel)} required` : "Freshers welcome"}
        </Fact>
        <Fact icon={Clock} label="Job type">
          {job.jobType}
        </Fact>
        <Fact icon={Laptop} label="Work mode">
          {job.workMode || "On-site"}
        </Fact>
        <Fact icon={Users} label="Openings">
          {job.position}
        </Fact>
        <Fact icon={CalendarClock} label="Applications">
          {job.accepting ? closes || "Open" : "Closed"}
        </Fact>
      </dl>

      <FitPanel job={job} />

      <Section title="About the role">
        <JobDescriptionText text={job.description} />
      </Section>

      {job.responsibilities?.length > 0 && (
        <Section title="What you'll do">
          <BulletList items={job.responsibilities} />
        </Section>
      )}

      {job.qualifications?.length > 0 && (
        <Section title="What we're looking for">
          <BulletList items={job.qualifications} />
        </Section>
      )}

      {job.requirements?.length > 0 && (
        <Section title="Skills">
          <div className="flex flex-wrap gap-1.5">
            {job.requirements.map((r) => (
              <span key={r} className="rounded-md bg-secondary px-2.5 py-1 text-sm">
                {r}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Salary & benefits">
        <p className="text-[15px]">
          <span className="font-semibold tabular-nums">{formatSalary(job)}</span>
          <span className="text-muted-foreground"> per year, set by the employer</span>
        </p>
        {job.benefits?.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {job.benefits.map((b) => (
              <li key={b} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {company && <CompanyCard company={company} />}

      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          SkillFound and employers never ask for money to apply or interview.
        </p>
        <Button variant="ghost" size="sm" className="shrink-0 self-start sm:self-auto" onClick={() => setReporting(true)}>
          <Flag /> Report job
        </Button>
      </div>

      <SimilarJobs id={job._id} />

      {!isPane && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
          <ApplyAction job={job} application={application} onApplied={setApplication} className="flex-1 [&>a]:flex-1" />
          <SaveButton job={job} withLabel />
        </div>
      )}

      <ReportJobDialog job={job} open={reporting} onOpenChange={setReporting} />
    </article>
  );
};

export default JobDetailView;
