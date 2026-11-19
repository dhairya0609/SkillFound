import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BellRing, Eye, IndianRupee, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadError from "@/components/common/LoadError";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import SmartSearch from "@/components/jobs/SmartSearch";
import CategoryTiles from "@/components/marketing/CategoryTiles";
import HiringCompanies from "@/components/marketing/HiringCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJobs } from "@/hooks/useJobs";
import { useMatches } from "@/hooks/useMatches";
import { useOverview } from "@/hooks/useOverview";
import { emptyFilters, filtersToParams } from "@/lib/filters";
import { plural } from "@/lib/format";

const ALL_JOBS = emptyFilters();

const POPULAR = [
  { label: "React developer", to: "/jobs?skills=React" },
  { label: "Data analyst", to: "/jobs?q=data%20analyst" },
  { label: "Remote", to: "/jobs?category=remote" },
  { label: "Internships", to: "/jobs?category=internships" },
  { label: "Product designer", to: "/jobs?category=design" },
  { label: "Freshers", to: "/jobs?maxExperience=1" },
];

const PROMISES = [
  { icon: IndianRupee, title: "Salary on every listing", body: "Employers must post a range, so you never apply blind." },
  { icon: Eye, title: "No sign-in to browse", body: "Search, read jobs and company pages without an account." },
  { icon: BellRing, title: "Updates on every application", body: "See when an employer views, shortlists or passes." },
  { icon: PhoneOff, title: "Your number stays private", body: "Employers only see it once they shortlist you." },
];

const SectionHeading = ({ title, action, id }) => (
  <div className="flex items-end justify-between gap-4">
    <h2 id={id} className="text-xl font-semibold tracking-tight sm:text-2xl">
      {title}
    </h2>
    {action}
  </div>
);

const Home = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const { user } = useAuth();
  const overview = useOverview();
  const latest = useJobs(ALL_JOBS, { limit: 6, featured: true, sort: "newest" });
  const { matches, pending } = useMatches(latest.jobs.map((j) => j._id));
  const stats = overview.data?.stats;

  return (
    <>
      <section className="relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute inset-0 glow" />
        <div className="relative mx-auto max-w-4xl px-4 pt-14 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16">
          <h1 className="text-[38px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
            Find jobs that fit what you can <span className="text-primary">actually do</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-pretty text-muted-foreground">
            {stats
              ? `${plural(stats.openRoles, "open role")} at ${plural(stats.companiesHiring, "company")}, each with the salary shown and a clear read on how your skills match.`
              : "Open roles at growing teams, each with the salary shown and a clear read on how your skills match."}
          </p>
          <div className="mx-auto mt-8 max-w-3xl text-left">
            <SmartSearch
              size="lg"
              withLocation
              onResult={(result) => navigate(`/jobs?${filtersToParams(result.filters)}`, { state: { search: result } })}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Popular:</span>
            {POPULAR.map((p) => (
              <Link
                key={p.label}
                to={p.to}
                className="rounded-full border bg-card/70 px-3 py-1 text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="What you can count on" className="border-b bg-muted/30">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex gap-3">
              <p.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold">{p.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 sm:py-16">
        <section aria-labelledby="latest">
          <SectionHeading
            id="latest"
            title="Latest jobs"
            action={
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link to="/jobs?sort=newest">
                  View all <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-5">
            {latest.error ? (
              <LoadError error={latest.error} onRetry={latest.retry} />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {latest.loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <li key={i}>
                        <JobCardSkeleton />
                      </li>
                    ))
                  : latest.jobs.map((job) => (
                      <li key={job._id}>
                        <JobCard job={job} match={matches[job._id]} matchPending={pending} />
                      </li>
                    ))}
              </ul>
            )}
          </div>
        </section>

        {(overview.loading || overview.data) && (
          <section aria-labelledby="categories">
            <SectionHeading id="categories" title="Browse by category" />
            <div className="mt-5">
              <CategoryTiles categories={overview.data?.categories} loading={overview.loading} />
            </div>
          </section>
        )}

        <HiringCompanies companies={overview.data?.companies} loading={overview.loading} />
      </div>

      {user?.role !== "student" && (
        <section className="border-t bg-muted/30" aria-labelledby="hiring">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="hiring" className="text-xl font-semibold tracking-tight">
                Hiring?
              </h2>
              <p className="mt-1 max-w-xl text-muted-foreground">
                Post a role with the salary up front and work through a pipeline that ranks applicants by fit.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline">
                <Link to={user?.role === "recruiter" ? "/admin/jobs/create" : "/signup?role=recruiter"}>Post a job</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/employers">Learn more</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default Home;
