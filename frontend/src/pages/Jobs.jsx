import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Info, Loader2, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DemoButtons from "@/components/common/DemoButtons";
import EmptyState from "@/components/common/EmptyState";
import FilterChips from "@/components/jobs/FilterChips";
import FilterPanel from "@/components/jobs/FilterPanel";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import SmartSearch from "@/components/jobs/SmartSearch";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJobs } from "@/hooks/useJobs";
import { useMatches } from "@/hooks/useMatches";
import { api } from "@/lib/api";
import { emptyFilters, filterChips, filtersFromParams, filtersToParams, hasFilters } from "@/lib/filters";
import { plural } from "@/lib/format";

const MATCH_ISSUES = {
  PROFILE_EMPTY: (
    <>
      Add your skills or upload a resume on your{" "}
      <Link to="/profile" className="font-medium text-foreground underline underline-offset-4">
        profile
      </Link>{" "}
      to see match scores.
    </>
  ),
  AI_RATE_LIMITED: "Match scores are paused for a moment because of AI rate limits. Refresh in a minute.",
};

const Jobs = () => {
  useDocumentTitle("Find jobs");
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const sort = params.get("sort") === "salary" ? "salary" : "recent";
  const [search, setSearch] = useState(location.state?.search || null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const ai = useAiStatus();
  const { user, isCandidate } = useAuth();

  const { jobs, total, loading, error, hasMore, loadMore, loadingMore } = useJobs(filters, { sort });
  const { matches, pending, issue } = useMatches(jobs.slice(0, 20).map((j) => j._id));

  useEffect(() => {
    api.get("/job/facets").then(({ data }) => setLocations(data.locations)).catch(() => {});
  }, []);

  const apply = (next, extra = {}) => {
    const qs = filtersToParams(next, { sort: sort === "salary" ? "salary" : undefined, ...extra });
    setParams(qs, { replace: false });
  };
  const patch = (changes) => {
    apply({ ...filters, ...changes });
  };
  const clear = () => {
    setSearch(null);
    apply(emptyFilters());
  };

  const chips = filterChips(filters, { companyName: jobs[0]?.company?.name });
  const aiInterpreted = search?.mode === "ai" && chips.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Find jobs</h1>
        <p className="text-muted-foreground">
          {ai.enabled ? "Describe what you want, or use the filters." : "Search by role, skill or city, or use the filters."}
        </p>
      </div>

      <SmartSearch
        key={search?.query || "search"}
        defaultValue={search?.query || filters.text || ""}
        className="mt-5"
        onResult={(result) => {
          setSearch(result);
          apply(result.filters);
        }}
      />

      <div className="mt-4 space-y-2">
        <FilterChips filters={filters} onChange={patch} onClear={clear} aiInterpreted={aiInterpreted} companyName={jobs[0]?.company?.name} />
        {search?.notice && search.mode === "keyword" && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Info className="size-3.5" /> {search.notice}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[232px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <FilterPanel filters={filters} onChange={patch} locations={locations} />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {loading ? "Searching…" : plural(total, "job")}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal /> Filters
              </Button>
              <Select value={sort} onValueChange={(v) => apply(filters, { sort: v === "salary" ? "salary" : undefined })}>
                <SelectTrigger size="sm" className="w-[132px] bg-card" aria-label="Sort jobs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="recent">Newest</SelectItem>
                  <SelectItem value="salary">Highest salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!user && ai.enabled && !loading && jobs.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand/25 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
                See how well you fit each job. Try the demo candidate to get AI match scores.
              </p>
              <DemoButtons size="sm" only="student" className="shrink-0" next="/jobs" />
            </div>
          )}
          {isCandidate && issue && MATCH_ISSUES[issue] && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border bg-card p-3.5 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
              <p>{MATCH_ISSUES[issue]}</p>
            </div>
          )}

          {error ? (
            <EmptyState icon={SearchX} title="Couldn't load jobs" action={<Button onClick={() => window.location.reload()}>Try again</Button>}>
              {error}
            </EmptyState>
          ) : loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={hasFilters(filters) ? "No jobs match all of these" : "No jobs posted yet"}
              action={
                hasFilters(filters) ? (
                  <>
                    {chips.length > 1 && (
                      <Button variant="outline" onClick={() => patch(chips[chips.length - 1].remove)}>
                        Remove “{chips[chips.length - 1].label}”
                      </Button>
                    )}
                    <Button onClick={clear}>Clear all filters</Button>
                  </>
                ) : null
              }
            >
              {hasFilters(filters)
                ? "Try removing a filter or two. Salary and experience limits narrow results the most."
                : "Check back soon, or ask a recruiter to post the first one."}
            </EmptyState>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.3 }}
                  >
                    <JobCard job={job} match={matches[job._id]} matchPending={pending && i < 20} />
                  </motion.div>
                ))}
              </div>
              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2 className="animate-spin" />} Show more jobs
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <FilterPanel filters={filters} onChange={patch} locations={locations} />
          <DialogFooter className="flex-row items-center justify-between gap-2 border-t pt-4">
            <Button variant="ghost" onClick={clear}>
              Clear all
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setFiltersOpen(false)}>{loading ? "Show jobs" : `Show ${plural(total, "job")}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
