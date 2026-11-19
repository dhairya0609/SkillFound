import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Bookmark, Briefcase, Clock, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusTimeline from "@/components/applications/StatusTimeline";
import { NO_RESPONSE_DAYS, isAwaitingTooLong } from "@/lib/applications";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import StatusBadge from "@/components/common/StatusBadge";
import { JobCard } from "@/components/jobs/JobCard";
import { refreshAlertCount } from "@/hooks/useAlertCount";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSavedJobs } from "@/hooks/useSavedJobs";
import { api, errorMessage } from "@/lib/api";
import { filterChips, filtersFromParams } from "@/lib/filters";
import { formatDate, formatSalary, plural } from "@/lib/format";
import { classifyLoadError } from "@/lib/loadError";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "applications", label: "Applications", icon: Briefcase },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "alerts", label: "Alerts", icon: Bell },
];

const useLoad = (url, pick, subject) => {
  const [state, setState] = useState({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api
      .get(url)
      .then(({ data }) => !cancelled && setState({ data: pick(data), error: null }))
      .catch((error) => !cancelled && setState({ data: null, error: classifyLoadError(error, { subject }) }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, attempt]);
  return { ...state, setData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })), retry: () => setAttempt((a) => a + 1) };
};

const ListSkeleton = () => (
  <div className="space-y-3" aria-busy="true">
    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton key={i} className="h-36 rounded-xl" />
    ))}
  </div>
);

const ApplicationRow = ({ application: a }) => {
  const awaiting = isAwaitingTooLong(a);
  return (
    <li className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <CompanyLogo company={a.job.company} className="size-11" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="min-w-0">
              <Link to={`/jobs/${a.job._id}`} className="font-semibold hover:underline">
                {a.job.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {a.job.company?.name} · {formatSalary(a.job)}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Applied {formatDate(a.createdAt)}
            {a.history?.length > 1 && ` · Updated ${formatDate(a.history.at(-1).at)}`}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <StatusTimeline application={a} />
      </div>
      {(awaiting || !a.job.accepting) && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          {!a.job.accepting && ["applied", "viewed"].includes(a.status)
            ? "This job has closed without an update on your application."
            : `No response yet. The employer hasn't updated this application in over ${NO_RESPONSE_DAYS} days, so it may be worth focusing elsewhere.`}
        </p>
      )}
    </li>
  );
};

const Applications = () => {
  const { data, error, retry } = useLoad("/application/get", (d) => d.application, "your applications");
  const [view, setView] = useState("active");
  if (error) return <LoadError error={error} onRetry={retry} />;
  if (!data) return <ListSkeleton />;
  if (!data.length) {
    return (
      <EmptyState icon={Briefcase} title="No applications yet" action={<Button asChild><Link to="/jobs">Find jobs</Link></Button>}>
        Jobs you apply to appear here, with every update from the employer.
      </EmptyState>
    );
  }
  const archived = (a) => a.status === "rejected" || a.status === "offered" || (!a.job.accepting && ["applied", "viewed"].includes(a.status));
  const active = data.filter((a) => !archived(a));
  const done = data.filter(archived);
  const list = view === "active" ? active : done;
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border bg-card p-0.5" role="tablist" aria-label="Application status">
        {[
          { id: "active", label: `Active (${active.length})` },
          { id: "archived", label: `Archived (${done.length})` },
        ].map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={view === o.id}
            onClick={() => setView(o.id)}
            className={cn("rounded-md px-3 py-1.5 text-sm", view === o.id ? "bg-accent font-medium" : "text-muted-foreground hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
      {list.length ? (
        <ul className="space-y-3">
          {list.map((a) => (
            <ApplicationRow key={a._id} application={a} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">{view === "active" ? "Nothing in progress right now." : "Nothing archived yet."}</p>
      )}
    </div>
  );
};

const Saved = () => {
  const { data, error, retry } = useLoad("/me/saved", (d) => d.saved, "your saved jobs");
  const { isSaved } = useSavedJobs();
  if (error) return <LoadError error={error} onRetry={retry} />;
  if (!data) return <ListSkeleton />;
  const visible = data.filter((s) => isSaved(s.job._id));
  if (!visible.length) {
    return (
      <EmptyState icon={Bookmark} title="No saved jobs" action={<Button asChild><Link to="/jobs">Find jobs</Link></Button>}>
        Tap the bookmark on any job to keep it here for later.
      </EmptyState>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {visible.map((s) => (
        <li key={s._id} className="space-y-1">
          <JobCard job={s.job} />
          <p className="px-1 text-xs text-muted-foreground">
            Saved {formatDate(s.savedAt)}
            {!s.job.accepting && " · No longer accepting applications"}
          </p>
        </li>
      ))}
    </ul>
  );
};

const Alerts = () => {
  const navigate = useNavigate();
  const { data, error, retry, setData } = useLoad("/me/alerts", (d) => d.alerts, "your alerts");
  if (error) return <LoadError error={error} onRetry={retry} />;
  if (!data) return <ListSkeleton />;

  const open = async (alert) => {
    navigate(`/jobs?${alert.query}`);
    try {
      await api.post(`/me/alerts/${alert._id}/seen`);
      refreshAlertCount();
    } catch {
      // Counts catch up on the next visit.
    }
  };
  const remove = async (alert) => {
    try {
      await api.delete(`/me/alerts/${alert._id}`);
      setData((list) => list.filter((a) => a._id !== alert._id));
      refreshAlertCount();
      toast.success("Alert deleted");
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't delete the alert."));
    }
  };

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Bell className="mt-0.5 size-4 shrink-0" />
        Alerts are in-app: new jobs that match a saved search are counted here and on the My jobs link. We don't send emails yet.
      </p>
      {!data.length ? (
        <EmptyState icon={Bell} title="No alerts yet" action={<Button asChild><Link to="/jobs">Search jobs</Link></Button>}>
          Run a search, then use “Create alert” to follow it.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {data.map((alert) => {
            const chips = filterChips(filtersFromParams(new URLSearchParams(alert.query)));
            return (
              <li key={alert._id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {alert.label}
                    {alert.newCount > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{alert.newCount} new</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {chips.map((c) => c.label).join(" · ")} · {plural(alert.total, "open job")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => open(alert)}>
                    <ExternalLink /> View jobs
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete alert ${alert.label}`} onClick={() => remove(alert)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const MyJobs = () => {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "applications";
  useDocumentTitle("My jobs");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">My jobs</h1>
      <div className="mt-5 flex gap-1 border-b" role="tablist" aria-label="My jobs">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
              tab === t.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "applications" && <Applications />}
        {tab === "saved" && <Saved />}
        {tab === "alerts" && <Alerts />}
      </div>
    </div>
  );
};

export default MyJobs;
