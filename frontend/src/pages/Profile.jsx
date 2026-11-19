import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FileText, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ResumeAutofill from "@/components/ai/ResumeAutofill";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import StatusBadge from "@/components/common/StatusBadge";
import UserAvatar from "@/components/common/UserAvatar";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api } from "@/lib/api";
import { classifyLoadError } from "@/lib/loadError";
import LoadError from "@/components/common/LoadError";
import { formatDate, formatSalary, formatYears } from "@/lib/format";

const strength = (user) => {
  const p = user?.profile || {};
  const checks = [
    Boolean(p.headline),
    Boolean(p.bio),
    (p.skills?.length || 0) >= 5,
    Boolean(p.experienceSummary),
    Boolean(p.resume),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const Section = ({ title, children, action }) => (
  <section className="rounded-xl border bg-card p-5">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-medium">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Applications = () => {
  const [apps, setApps] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api
      .get("/application/get")
      .then(({ data }) => setApps(data.application))
      .catch((e) => setError(classifyLoadError(e, { subject: "your applications" })));
  }, []);

  if (error) return <LoadError error={error} onRetry={() => window.location.reload()} className="border-0 py-8" />;

  if (!apps) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!apps.length) {
    return (
      <EmptyState icon={Briefcase} title="No applications yet" action={<Button asChild><Link to="/jobs">Browse jobs</Link></Button>}>
        Jobs you apply to show up here with their status.
      </EmptyState>
    );
  }
  return (
    <ul className="-mx-2 divide-y">
      {apps.map((a) => (
        <li key={a._id}>
          <Link to={`/jobs/${a.job._id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-accent/60">
            <CompanyLogo company={a.job.company} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.job.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.job.company?.name} · Applied {formatDate(a.createdAt)}
              </p>
            </div>
            <span className="hidden text-sm text-muted-foreground tabular-nums sm:block">{formatSalary(a.job)}</span>
            <StatusBadge status={a.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
};

const Profile = () => {
  useDocumentTitle("Profile");
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const p = user.profile || {};
  const score = strength(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar user={user} className="size-16 text-lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{user.fullName}</h1>
              {user.isDemo && <Badge variant="brand">Demo account</Badge>}
            </div>
            <p className="mt-0.5 text-muted-foreground">{p.headline || "Add a headline so recruiters know what you do"}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil /> Edit profile
        </Button>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <ResumeAutofill />

          <Section title="About">
            {p.bio ? <p className="text-[15px] leading-relaxed text-foreground/90">{p.bio}</p> : <p className="text-sm text-muted-foreground">Nothing here yet.</p>}
          </Section>

          <Section title="Experience" action={p.yearsOfExperience != null && <span className="text-sm text-muted-foreground">{formatYears(p.yearsOfExperience)}</span>}>
            {p.experienceSummary ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{p.experienceSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Summarise your roles and projects, or let resume autofill do it.</p>
            )}
          </Section>

          <Section title="Skills">
            {p.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-md border bg-background px-2.5 py-1 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add skills to unlock match scores on every job.</p>
            )}
          </Section>

          <Section title="Applications">
            <Applications />
          </Section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <h2 className="font-medium">Profile strength</h2>
              <span className="tabular-nums text-muted-foreground">{score}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Better profiles get more accurate match scores.</p>
          </section>
          <section className="space-y-3 rounded-xl border bg-card p-5 text-sm">
            <h2 className="font-medium">Contact</h2>
            <p className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="size-4 shrink-0" /> <span className="truncate">{user.email}</span>
            </p>
            <p className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="size-4 shrink-0" /> {user.phoneNumber}
            </p>
            {p.location && (
              <p className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="size-4 shrink-0" /> {p.location}
              </p>
            )}
            <div className="border-t pt-3">
              {p.resume ? (
                <a href={p.resume} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 font-medium text-brand hover:underline">
                  <FileText className="size-4 shrink-0" /> <span className="truncate">{p.resumeOriginalName || "Resume"}</span>
                </a>
              ) : (
                <p className="flex items-center gap-2.5 text-muted-foreground">
                  <FileText className="size-4 shrink-0" /> No resume attached
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {editing && <EditProfileDialog user={user} open={editing} onOpenChange={setEditing} />}
    </div>
  );
};

export default Profile;
