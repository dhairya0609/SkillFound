import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, CalendarDays, Globe, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import { JobCard } from "@/components/jobs/JobCard";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMatches } from "@/hooks/useMatches";
import { api } from "@/lib/api";
import { plural } from "@/lib/format";
import { classifyLoadError } from "@/lib/loadError";

const Fact = ({ icon: Icon, label, children }) => (
  <div className="flex items-center gap-2.5">
    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  </div>
);

const CompanyPage = () => {
  const { id } = useParams();
  const [state, setState] = useState({ id: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/company/public/${id}`)
      .then(({ data }) => !cancelled && setState({ id, data, error: null }))
      .catch((error) => !cancelled && setState({ id, data: null, error: classifyLoadError(error, { subject: "this company" }) }));
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const company = state.data?.company;
  const jobs = state.data?.jobs || [];
  const { matches, pending } = useMatches(jobs.map((j) => j._id));
  useDocumentTitle(company ? `${company.name}: jobs and company info` : "Company");

  if (state.error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LoadError error={state.error} onRetry={() => setAttempt((a) => a + 1)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to="/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All companies
      </Link>

      {state.id !== id || !company ? (
        <div className="mt-6 space-y-4" aria-busy="true">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CompanyLogo company={company} className="size-20 rounded-2xl text-lg" />
              <div className="min-w-0">
                <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {company.name}
                  {company.verified && <BadgeCheck className="size-6 shrink-0 text-primary" aria-label="Verified employer" />}
                </h1>
                {company.tagline && <p className="mt-1 text-muted-foreground">{company.tagline}</p>}
              </div>
            </div>
            {company.website && !company.isSeed && (
              <Button asChild variant="outline">
                <a href={company.website} target="_blank" rel="noreferrer">
                  <Globe /> Website
                </a>
              </Button>
            )}
          </header>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4">
            <Fact icon={Building2} label="Industry">
              {company.industry || "—"}
            </Fact>
            <Fact icon={Users} label="Company size">
              {company.size ? `${company.size} employees` : "—"}
            </Fact>
            <Fact icon={CalendarDays} label="Founded">
              {company.founded || "—"}
            </Fact>
            <Fact icon={MapPin} label="Locations">
              {(company.locations?.length ? company.locations : [company.location]).filter(Boolean).join(", ") || "—"}
            </Fact>
          </dl>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section aria-labelledby="open-roles" className="min-w-0">
              <h2 id="open-roles" className="text-lg font-semibold">
                Open roles <span className="font-normal text-muted-foreground">({jobs.length})</span>
              </h2>
              {jobs.length === 0 ? (
                <EmptyState icon={Building2} title="No open roles right now" className="mt-4">
                  {company.name} isn't hiring on SkillFound at the moment.
                </EmptyState>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {jobs.map((job) => (
                    <li key={job._id}>
                      <JobCard job={job} match={matches[job._id]} matchPending={pending} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <aside className="space-y-4">
              <section className="rounded-xl border p-4">
                <h2 className="text-sm font-semibold">About</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{company.description || "No description yet."}</p>
              </section>
              {company.verified && (
                <section className="rounded-xl border p-4 text-sm">
                  <h2 className="flex items-center gap-1.5 font-semibold">
                    <BadgeCheck className="size-4 text-primary" /> Verified employer
                  </h2>
                  <p className="mt-1.5 text-muted-foreground">
                    Set up by the SkillFound team rather than a self-serve account. Report any job that asks you for money.
                  </p>
                </section>
              )}
              {jobs.length > 0 && (
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/jobs?company=${company._id}`}>Search {plural(jobs.length, "role")} with filters</Link>
                </Button>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default CompanyPage;
