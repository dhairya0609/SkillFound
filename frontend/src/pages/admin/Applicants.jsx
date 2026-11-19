import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, Mail, Phone, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AiLabel } from "@/components/ai/AiMark";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import UserAvatar from "@/components/common/UserAvatar";
import { matchTier } from "@/components/jobs/match";
import { markAiUnavailable, useAiStatus } from "@/hooks/useAiStatus";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorCode, errorMessage } from "@/lib/api";
import { formatDate, formatYears, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "applied", label: "Applied" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "offered", label: "Offered" },
  { value: "rejected", label: "Not selected" },
];

const StatusSelect = ({ application, onChange }) => {
  const [saving, setSaving] = useState(false);
  return (
    <Select
      value={application.status}
      disabled={saving}
      onValueChange={async (status) => {
        setSaving(true);
        try {
          await api.post(`/application/status/${application._id}/update`, { status });
          onChange(status);
          toast.success(`${application.applicant.fullName}: ${STATUSES.find((s) => s.value === status).label}`);
        } catch (error) {
          toast.error(errorMessage(error, "Couldn't update the status."));
        } finally {
          setSaving(false);
        }
      }}
    >
      <SelectTrigger size="sm" className="w-[136px] bg-card" aria-label={`Status for ${application.applicant.fullName}`}>
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <SelectValue />}
      </SelectTrigger>
      <SelectContent align="end">
        {STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const Applicants = () => {
  const { id } = useParams();
  const ai = useAiStatus();
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [rankings, setRankings] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [sortByRank, setSortByRank] = useState(true);
  useDocumentTitle(job ? `Applicants · ${job.title}` : "Applicants");

  useEffect(() => {
    api
      .get(`/application/${id}/applicants`)
      .then(({ data }) => setJob(data.job))
      .catch((e) => setError(errorMessage(e, "Couldn't load applicants.")));
  }, [id]);

  const rank = async () => {
    setRanking(true);
    try {
      const { data } = await api.post(`/ai/jobs/${id}/rank`);
      setRankings(Object.fromEntries(data.rankings.map((r, i) => [r.applicationId, { ...r, position: i + 1 }])));
      setSortByRank(true);
    } catch (e) {
      const code = errorCode(e);
      if (code === "AI_UNAVAILABLE" || code === "AI_DISABLED") markAiUnavailable();
      toast.error(errorMessage(e, "Couldn't rank applicants."), { description: "The list stays in its usual order." });
    } finally {
      setRanking(false);
    }
  };

  const applications = useMemo(() => {
    const list = (job?.applications || []).filter((a) => a.applicant);
    if (!rankings || !sortByRank) return list;
    return [...list].sort((a, b) => (rankings[a._id]?.position ?? 999) - (rankings[b._id]?.position ?? 999));
  }, [job, rankings, sortByRank]);

  const setStatus = (appId, status) =>
    setJob((j) => ({ ...j, applications: j.applications.map((a) => (a._id === appId ? { ...a, status } : a)) }));

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState icon={Users} title="Couldn't open this job" action={<Button asChild><Link to="/admin/jobs">Back to dashboard</Link></Button>}>
          {error}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>

      {!job ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyLogo company={job.company} className="size-11" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{job.company?.name}</p>
                <h1 className="truncate text-2xl font-semibold tracking-tight">{job.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/jobs/${job._id}`}>View post</Link>
              </Button>
              {ai.enabled && applications.length > 0 && (
                <Button variant="brand" size="sm" onClick={rank} disabled={ranking}>
                  {ranking ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {ranking ? "Ranking…" : rankings ? "Re-rank" : "Rank with AI"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">{plural(applications.length, "applicant")}</p>
            {rankings && (
              <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
                {[
                  { v: true, l: "AI rank" },
                  { v: false, l: "Newest" },
                ].map((o) => (
                  <button
                    key={o.l}
                    onClick={() => setSortByRank(o.v)}
                    aria-pressed={sortByRank === o.v}
                    className={cn("rounded-md px-2.5 py-1 text-xs", sortByRank === o.v ? "bg-accent font-medium" : "text-muted-foreground")}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {applications.length === 0 ? (
            <EmptyState icon={Users} title="No applicants yet" className="mt-4">
              When candidates apply, they'll show up here with their skills and resume.
            </EmptyState>
          ) : (
            <motion.ul layout className="mt-4 space-y-3">
              <AnimatePresence initial={false}>
                {applications.map((app) => {
                  const a = app.applicant;
                  const r = rankings?.[app._id];
                  const tier = r ? matchTier(r.score) : null;
                  return (
                    <motion.li layout key={app._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border bg-card p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 flex-1 gap-3">
                          <UserAvatar user={a} className="size-10" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="font-medium">{a.fullName}</p>
                              {r && (
                                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", tier.bg, tier.tone)}>
                                  #{r.position} · {r.score}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                              {[a.profile?.headline || "No headline", formatYears(a.profile?.yearsOfExperience)].filter(Boolean).join(" · ")}
                            </p>
                            {r?.reason && (
                              <p className="mt-2 flex items-start gap-1.5 text-sm">
                                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand" />
                                {r.reason}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(a.profile?.skills || []).slice(0, 8).map((s) => (
                                <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                                  {s}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                                <Mail className="size-3.5" /> {a.email}
                              </a>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="size-3.5" /> {a.phoneNumber}
                              </span>
                              {a.profile?.resume && (
                                <a href={a.profile.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                                  <FileText className="size-3.5" /> Resume
                                </a>
                              )}
                              <span>Applied {formatDate(app.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <StatusSelect application={app} onChange={(status) => setStatus(app._id, status)} />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </motion.ul>
          )}
          {rankings && (
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <AiLabel /> Ranked on skills and experience only. Names and contact details aren't sent to the model.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Applicants;
