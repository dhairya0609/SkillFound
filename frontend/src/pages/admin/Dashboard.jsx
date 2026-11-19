import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CalendarClock, ChevronRight, Ellipsis, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import { useAuth } from "@/hooks/useAuth";
import { useCompanies } from "@/hooks/useCompanies";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorMessage } from "@/lib/api";
import { closesLabel, formatSalary, timeAgo } from "@/lib/format";
import { classifyLoadError } from "@/lib/loadError";
import { cn } from "@/lib/utils";
import { STAGES } from "@/lib/applications";


const Stat = ({ label, value, hint }) => (
  <div className="rounded-xl border bg-card p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="mt-1 text-2xl font-semibold tabular-nums">{value ?? <Skeleton className="h-8 w-10" />}</div>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const JobActions = ({ job, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (action) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/job/${job._id}/status`, { action });
      toast.success(data.message);
      onChanged({ ...job, status: data.status, expiresAt: data.expiresAt, accepting: data.status === "open" });
      setOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't update the job."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${job.title}`}>
          {busy ? <Loader2 className="animate-spin" /> : <Ellipsis />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 rounded-xl p-1.5">
        <Link to={`/jobs/${job._id}`} className="flex rounded-md px-2.5 py-2 text-sm hover:bg-accent">
          View public post
        </Link>
        {job.accepting ? (
          <>
            <button onClick={() => run("extend")} className="flex w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent">
              Extend 30 days
            </button>
            <button onClick={() => run("close")} className="flex w-full rounded-md px-2.5 py-2 text-left text-sm text-destructive hover:bg-accent">
              Close job
            </button>
          </>
        ) : (
          <button onClick={() => run("reopen")} className="flex w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent">
            Reopen for 30 days
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const Pipeline = ({ pipeline }) => (
  <dl className="grid grid-cols-5 gap-1 text-center">
    {STAGES.map((s) => (
      <div key={s.id} className="min-w-0">
        <dd className={cn("text-sm font-semibold tabular-nums", !pipeline[s.id] && "text-muted-foreground/60")}>{pipeline[s.id] || 0}</dd>
        <dt className="truncate text-[11px] text-muted-foreground">{s.label}</dt>
      </div>
    ))}
  </dl>
);

const Dashboard = () => {
  useDocumentTitle("Hiring dashboard");
  const { user } = useAuth();
  const { companies } = useCompanies();
  const [jobs, setJobs] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("open");

  useEffect(() => {
    api
      .get("/job/getadminjobs")
      .then(({ data }) => setJobs(data.jobs))
      .catch((error) => setLoadError(classifyLoadError(error, { subject: "your job posts" })));
  }, []);

  const counts = useMemo(() => {
    if (!jobs) return null;
    const live = jobs.filter((j) => j.accepting);
    const sum = (key) => live.reduce((n, j) => n + (j.pipeline?.[key] || 0), 0);
    return { open: live.length, closed: jobs.length - live.length, newApplicants: sum("applied"), interview: sum("interview"), offers: sum("offered") };
  }, [jobs]);

  const filtered = useMemo(() => {
    if (!jobs) return null;
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => (tab === "open" ? j.accepting : !j.accepting))
      .filter((j) => !q || j.title.toLowerCase().includes(q) || j.company?.name?.toLowerCase().includes(q));
  }, [jobs, query, tab]);

  const replaceJob = (next) => setJobs((list) => list.map((j) => (j._id === next._id ? { ...j, ...next } : j)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {user.fullName.split(" ")[0]}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Hiring dashboard</h1>
        </div>
        <Button asChild>
          <Link to="/admin/jobs/create">Post a job</Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open jobs" value={counts?.open} hint={counts ? `${counts.closed} closed or expired` : null} />
        <Stat label="New applicants" value={counts?.newApplicants} hint="Not yet reviewed" />
        <Stat label="In interview" value={counts?.interview} />
        <Stat label="Offers" value={counts?.offers} />
      </div>

      <section className="mt-8 rounded-xl border bg-card" aria-label="Job posts">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist" aria-label="Job status">
            {[
              { id: "open", label: `Open${counts ? ` (${counts.open})` : ""}` },
              { id: "closed", label: `Closed${counts ? ` (${counts.closed})` : ""}` },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn("rounded-md px-3 py-1.5 text-sm", tab === t.id ? "bg-card font-medium shadow-xs" : "text-muted-foreground")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your jobs" className="h-9 bg-background pl-9" aria-label="Search your jobs" />
          </div>
        </div>

        {loadError ? (
          <div className="p-4">
            <LoadError error={loadError} onRetry={() => window.location.reload()} className="border-0" />
          </div>
        ) : !filtered ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No job posts yet"
                className="border-0"
                action={
                  <Button asChild>
                    <Link to={companies?.length === 0 ? "/admin/companies" : "/admin/jobs/create"}>
                      {companies?.length === 0 ? "Add your company first" : "Post your first job"}
                    </Link>
                  </Button>
                }
              >
                {companies?.length === 0 ? "Jobs belong to a company, so start by adding yours." : "Your jobs and their pipelines will show up here."}
              </EmptyState>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query ? `No jobs match “${query}”.` : tab === "open" ? "No open jobs." : "No closed or expired jobs."}
              </p>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((job) => {
              const closes = closesLabel(job);
              return (
                <li key={job._id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center md:gap-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo company={job.company} className="size-10" />
                    <div className="min-w-0">
                      <Link to={`/admin/jobs/${job._id}/applicants`} className="block truncate font-semibold hover:underline">
                        {job.title}
                      </Link>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {[job.company?.name, job.location, formatSalary(job)].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3" aria-hidden="true" />
                        {job.accepting ? `${closes || "Open"} · posted ${timeAgo(job.createdAt)}` : job.status === "closed" ? "Closed" : "Expired"}
                      </p>
                    </div>
                  </div>
                  <Pipeline pipeline={job.pipeline || {}} />
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="outline" size="sm" className="min-w-[136px] justify-between">
                      <Link to={`/admin/jobs/${job._id}/applicants`}>
                        {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"} <ChevronRight />
                      </Link>
                    </Button>
                    <JobActions job={job} onChanged={replaceJob} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
