import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, FileText, Loader2, Lock, Mail, Phone, Sparkles, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import StatusTimeline from "@/components/applications/StatusTimeline";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import StatusBadge from "@/components/common/StatusBadge";
import UserAvatar from "@/components/common/UserAvatar";
import { matchTier } from "@/components/jobs/match";
import { markAiUnavailable, useAiStatus } from "@/hooks/useAiStatus";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorCode, errorMessage } from "@/lib/api";
import { CONTACTABLE, PIPELINE_TABS } from "@/lib/applications";
import { formatDate, formatYears, skillsMatch } from "@/lib/format";
import { classifyLoadError } from "@/lib/loadError";
import { cn } from "@/lib/utils";

const NEXT_ACTIONS = {
  applied: ["shortlisted", "rejected"],
  viewed: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: [],
  rejected: ["shortlisted"],
};
const ACTION_LABELS = { shortlisted: "Shortlist", interview: "Move to interview", offered: "Make offer", rejected: "Not selected" };

const ApplicantSheet = ({ application, job, ranking, open, onOpenChange, onStatus }) => {
  const [saving, setSaving] = useState(null);
  if (!application) return null;
  const a = application.applicant;
  const { matched, missing, total } = skillsMatch(job.requirements, a.profile?.skills || []);

  const move = async (status) => {
    setSaving(status);
    try {
      const { data } = await api.post(`/application/status/${application._id}/update`, { status });
      onStatus(application._id, data.status, data.history);
      toast.success(`${a.fullName}: ${PIPELINE_TABS.find((t) => t.id === status)?.label || status}`);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't update the status."));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 right-0 left-auto h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-r-0 p-0 sm:max-w-lg data-[state=open]:slide-in-from-right-8 data-[state=open]:zoom-in-100">
        <div className="flex h-full flex-col">
          <div className="border-b p-5 pr-12">
            <div className="flex items-center gap-3">
              <UserAvatar user={a} className="size-12" />
              <div className="min-w-0">
                <DialogTitle className="text-lg">{a.fullName}</DialogTitle>
                <DialogDescription className="truncate">{[a.profile?.headline, formatYears(a.profile?.yearsOfExperience)].filter(Boolean).join(" · ")}</DialogDescription>
              </div>
            </div>
            <div className="mt-4">
              <StatusTimeline application={application} />
            </div>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {ranking && (
              <section className="rounded-xl border bg-muted/40 p-3.5 text-sm">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-4 text-primary" /> Ranked #{ranking.position} · score {ranking.score}
                </p>
                <p className="mt-1 text-muted-foreground">{ranking.reason}</p>
              </section>
            )}

            <section>
              <h3 className="text-sm font-semibold">
                Skills match <span className="font-normal text-muted-foreground">({matched.length} of {total})</span>
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matched.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-medium text-success">
                    <Check className="size-3" aria-hidden="true" /> {s}
                  </span>
                ))}
                {missing.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
                    <X className="size-3" aria-hidden="true" /> {s}
                  </span>
                ))}
              </div>
              {a.profile?.skills?.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">All skills: {a.profile.skills.join(", ")}</p>
              )}
            </section>

            {a.profile?.experienceSummary && (
              <section>
                <h3 className="text-sm font-semibold">Experience</h3>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-foreground/90">{a.profile.experienceSummary}</p>
              </section>
            )}
            {a.profile?.bio && (
              <section>
                <h3 className="text-sm font-semibold">About</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{a.profile.bio}</p>
              </section>
            )}

            <section className="space-y-2 text-sm">
              <h3 className="font-semibold">Contact</h3>
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${a.email}`} className="hover:underline">
                  {a.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                {a.phoneNumber ? (
                  <>
                    <Phone className="size-4 text-muted-foreground" /> {a.phoneNumber}
                  </>
                ) : (
                  <>
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone number is shared once you shortlist</span>
                  </>
                )}
              </p>
              {a.profile?.resume && (
                <p className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <a href={a.profile.resume} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {a.profile.resumeOriginalName || "Resume"}
                  </a>
                </p>
              )}
              <p className="text-xs text-muted-foreground">Applied {formatDate(application.createdAt)}</p>
            </section>
          </div>

          {NEXT_ACTIONS[application.status]?.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t p-4">
              {NEXT_ACTIONS[application.status].map((status) => (
                <Button
                  key={status}
                  variant={status === "rejected" ? "outline" : "default"}
                  className={cn(status === "rejected" ? "text-destructive" : "flex-1")}
                  disabled={Boolean(saving)}
                  onClick={() => move(status)}
                >
                  {saving === status && <Loader2 className="animate-spin" />}
                  {ACTION_LABELS[status]}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Applicants = () => {
  const { id } = useParams();
  const ai = useAiStatus();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState("all");
  const [rankings, setRankings] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [openId, setOpenId] = useState(null);
  useDocumentTitle(job ? `Applicants · ${job.title}` : "Applicants");

  useEffect(() => {
    api
      .get(`/application/${id}/applicants`)
      .then(({ data }) => setJob(data.job))
      .catch((e) => setError(classifyLoadError(e, { subject: "this job's applicants" })));
  }, [id]);

  const apps = useMemo(() => (job?.applications || []).filter((a) => a.applicant), [job]);
  const counts = useMemo(() => Object.fromEntries(PIPELINE_TABS.map((t) => [t.id, apps.filter((a) => a.status === t.id).length])), [apps]);
  const visible = useMemo(() => {
    const list = stage === "all" ? apps : apps.filter((a) => a.status === stage);
    if (!rankings) return list;
    return [...list].sort((a, b) => (rankings[a._id]?.position ?? 999) - (rankings[b._id]?.position ?? 999));
  }, [apps, stage, rankings]);
  const opened = apps.find((a) => a._id === openId) || null;

  const updateApp = (appId, patch) =>
    setJob((j) => ({ ...j, applications: j.applications.map((a) => (a._id === appId ? { ...a, ...patch(a) } : a)) }));

  const openApplicant = async (app) => {
    setOpenId(app._id);
    if (app.status !== "applied") return;
    try {
      const { data } = await api.post(`/application/${app._id}/view`);
      updateApp(app._id, () => ({ status: data.status, history: data.history }));
    } catch {
      // Viewing still works if the receipt fails to record.
    }
  };

  const onStatus = async (appId, status, history) => {
    updateApp(appId, () => ({ status, history }));
    if (CONTACTABLE.includes(status)) {
      try {
        const { data } = await api.get(`/application/${id}/applicants`);
        setJob(data.job);
      } catch {
        // Contact details appear on the next load.
      }
    }
  };

  const rank = async () => {
    setRanking(true);
    try {
      const { data } = await api.post(`/ai/jobs/${id}/rank`);
      setRankings(Object.fromEntries(data.rankings.map((r, i) => [r.applicationId, { ...r, position: i + 1 }])));
    } catch (e) {
      const code = errorCode(e);
      if (code === "AI_UNAVAILABLE" || code === "AI_DISABLED") markAiUnavailable();
      toast.error(errorMessage(e, "Couldn't rank applicants."), { description: "The list stays in its usual order." });
    } finally {
      setRanking(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LoadError error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Hiring dashboard
      </Link>

      {!job ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyLogo company={job.company} className="size-11" />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{job.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {job.company?.name} · {apps.length} applicant{apps.length === 1 ? "" : "s"}
                  {!job.accepting && " · Closed"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/jobs/${job._id}`}>View post</Link>
              </Button>
              {ai.enabled && apps.length > 1 && (
                <Button size="sm" variant="outline" onClick={rank} disabled={ranking}>
                  {ranking ? <Loader2 className="animate-spin" /> : <Sparkles className="text-primary" />}
                  {ranking ? "Ranking…" : rankings ? "Re-rank by fit" : "Rank by fit"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 -mx-4 flex gap-1 overflow-x-auto border-b px-4 [scrollbar-width:none] sm:mx-0 sm:px-0" role="tablist" aria-label="Pipeline stages">
            {[{ id: "all", label: "All" }, ...PIPELINE_TABS].map((t) => {
              const n = t.id === "all" ? apps.length : counts[t.id];
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={stage === t.id}
                  onClick={() => setStage(t.id)}
                  className={cn(
                    "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap",
                    stage === t.id ? "border-primary font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                  <span className={cn("rounded-full px-1.5 text-xs tabular-nums", stage === t.id ? "bg-primary/10 text-primary" : "bg-muted")}>{n}</span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={Users} title={apps.length ? "Nobody at this stage" : "No applicants yet"} className="mt-6">
              {apps.length ? "Move applicants here from their profile." : "When candidates apply, they'll appear here with their skills and resume."}
            </EmptyState>
          ) : (
            <ul className="mt-4 divide-y rounded-xl border bg-card">
              {visible.map((app) => {
                const a = app.applicant;
                const r = rankings?.[app._id];
                const tier = r ? matchTier(r.score) : null;
                const { matched, total } = skillsMatch(job.requirements, a.profile?.skills || []);
                return (
                  <li key={app._id}>
                    <button
                      type="button"
                      onClick={() => openApplicant(app)}
                      className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none"
                    >
                      <UserAvatar user={a} className="size-10" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold">{a.fullName}</span>
                          {app.status === "applied" && <span className="size-2 rounded-full bg-primary" aria-label="New" />}
                          {r && (
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", tier.bg, tier.tone)}>
                              #{r.position} · {r.score}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {[a.profile?.headline, formatYears(a.profile?.yearsOfExperience)].filter(Boolean).join(" · ")}
                        </p>
                        {r?.reason && (
                          <p className="mt-1 flex items-start gap-1.5 text-sm">
                            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" /> {r.reason}
                          </p>
                        )}
                      </div>
                      <div className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                        <p className="font-medium text-foreground tabular-nums">
                          {matched.length}/{total} skills
                        </p>
                        <p>Applied {formatDate(app.createdAt)}</p>
                      </div>
                      <StatusBadge status={app.status} />
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {rankings && (
            <p className="mt-3 text-xs text-muted-foreground">Ranked on skills and experience only. Names and contact details aren't sent to the model.</p>
          )}
        </>
      )}

      <ApplicantSheet
        application={opened}
        job={job || {}}
        ranking={opened ? rankings?.[opened._id] : null}
        open={Boolean(opened)}
        onOpenChange={(o) => !o && setOpenId(null)}
        onStatus={onStatus}
      />
    </div>
  );
};

export default Applicants;
