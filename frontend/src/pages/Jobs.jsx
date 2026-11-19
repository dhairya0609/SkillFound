import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Info, Loader2, SearchX, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import FilterBar from "@/components/jobs/FilterBar";
import FilterChips from "@/components/jobs/FilterChips";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import JobDetailView from "@/components/jobs/JobDetailView";
import SmartSearch from "@/components/jobs/SmartSearch";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJobs } from "@/hooks/useJobs";
import { useMatches } from "@/hooks/useMatches";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { api, errorMessage } from "@/lib/api";
import { CATEGORY_LABELS, emptyFilters, filterChips, filtersFromParams, filtersToParams, hasFilters } from "@/lib/filters";
import { plural } from "@/lib/format";

const SORT_LABELS = {
  relevant: "Most relevant",
  newest: "Newest",
  salary: "Highest pay",
  match: "Best match",
};

const MATCH_ISSUES = {
  PROFILE_EMPTY: (
    <>
      Add skills or upload a resume on your{" "}
      <Link to="/profile" className="font-medium text-foreground underline underline-offset-4">
        profile
      </Link>{" "}
      to see match scores.
    </>
  ),
  AI_RATE_LIMITED: "Match scores are paused for a minute because of AI rate limits.",
};

const CHIP_KEYS = ["q", "text", "keywords", "skills", "locations", "category"];

const CreateAlertButton = ({ filters, label, className }) => {
  const { user, isCandidate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  if (user && !isCandidate) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={saving || !hasFilters(filters)}
      title={hasFilters(filters) ? undefined : "Search or pick a filter first"}
      onClick={async () => {
        if (!user) {
          toast("Sign in to create job alerts", { description: "We'll show new matches for this search in My jobs." });
          navigate("/login", { state: { from: location.pathname + location.search } });
          return;
        }
        setSaving(true);
        try {
          const { data } = await api.post("/me/alerts", { query: filtersToParams(filters).toString(), label });
          toast.success(data.message, {
            action: { label: "View alerts", onClick: () => navigate("/my-jobs?tab=alerts") },
          });
        } catch (error) {
          toast.error(errorMessage(error, "Couldn't create the alert."));
        } finally {
          setSaving(false);
        }
      }}
    >
      {saving ? <Loader2 className="animate-spin" /> : <Bell />} Create alert
    </Button>
  );
};

const Jobs = () => {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const ai = useAiStatus();
  const { isCandidate } = useAuth();
  const isDesktop = useIsDesktop();
  const canMatchSort = isCandidate && ai.enabled;
  const requestedSort = params.get("sort");
  const sort = SORT_LABELS[requestedSort] && (requestedSort !== "match" || canMatchSort) ? requestedSort : "relevant";
  const selectedId = params.get("job");
  const [search, setSearch] = useState(location.state?.search || null);
  const paneRef = useRef(null);

  const { jobs, total, loading, error, retry, hasMore, loadMore, loadingMore } = useJobs(filters, { sort, limit: 20 });
  const { matches, pending, issue } = useMatches(jobs.slice(0, 20).map((j) => j._id));

  const writeParams = (nextFilters, { nextSort = sort, job } = {}) => {
    const qs = filtersToParams(nextFilters, { sort: nextSort === "relevant" ? undefined : nextSort, job });
    setParams(qs, { replace: Boolean(job) });
  };
  const patch = (changes) => writeParams({ ...filters, ...changes });
  const clear = () => {
    setSearch(null);
    writeParams(emptyFilters());
  };
  const select = (job) => {
    writeParams(filters, { job: job._id });
  };

  useEffect(() => {
    if (isDesktop && !loading && jobs.length && !selectedId) writeParams(filters, { job: jobs[0]._id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop, loading, jobs, selectedId]);

  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
  }, [selectedId]);

  const companyName = filters.company ? jobs.find((j) => j.company?._id === filters.company)?.company?.name : null;
  const heading = companyName
    ? `Jobs at ${companyName}`
    : filters.category === "internships"
      ? "Internships"
      : filters.category
        ? `${CATEGORY_LABELS[filters.category]} jobs`
        : filters.workModes.length === 1 && filters.workModes[0] === "Remote"
          ? "Remote jobs"
          : "Jobs";
  useDocumentTitle(heading === "Jobs" ? "Find jobs" : heading);

  const chipFilters = { ...emptyFilters(), ...Object.fromEntries(CHIP_KEYS.map((k) => [k, filters[k]])) };
  const chips = filterChips(filters, { companyName });
  const aiInterpreted = search?.mode === "ai" && chips.length > 0;
  const activeCount =
    [filters.postedWithin != null, filters.minSalary != null, filters.minExperience != null || filters.maxExperience != null, Boolean(filters.company)].filter(Boolean)
      .length +
    filters.workModes.length +
    filters.jobTypes.length +
    filters.locations.length;
  const alertLabel = chips.slice(0, 3).map((c) => c.label.replace(/^(Skill|Role): /, "")).join(" · ") || "Saved search";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="sr-only">{heading}</h1>
      <SmartSearch
        key={`${search?.query || ""}|${search?.location || ""}`}
        defaultValue={search?.query || filters.text || filters.q || ""}
        defaultLocation={search?.location || ""}
        withLocation
        onResult={(result) => {
          setSearch(result);
          writeParams(result.filters);
        }}
      />

      <div className="mt-4 space-y-3">
        <FilterBar filters={filters} onChange={patch} onClear={clear} total={total} loading={loading} activeCount={activeCount} />
        <FilterChips filters={chipFilters} onChange={patch} onClear={clear} aiInterpreted={aiInterpreted} companyName={companyName} />
        {search?.notice && search.mode === "keyword" && (
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Info className="size-3.5" /> {search.notice}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section aria-label="Job results" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" aria-hidden="true">
                {heading}
              </p>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {loading ? "Searching…" : `${plural(total, "result")}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CreateAlertButton filters={filters} label={alertLabel} className="max-sm:hidden" />
              <Select value={sort} onValueChange={(v) => writeParams(filters, { nextSort: v })}>
                <SelectTrigger size="sm" className="w-[140px] bg-card" aria-label="Sort by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {Object.entries(SORT_LABELS)
                    .filter(([k]) => k !== "match" || canMatchSort)
                    .map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCandidate && issue && MATCH_ISSUES[issue] && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border bg-card p-3 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>{MATCH_ISSUES[issue]}</p>
            </div>
          )}

          {error ? (
            <LoadError error={error} onRetry={retry} />
          ) : loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 6 }, (_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={hasFilters(filters) ? "No jobs match all of these" : "No open jobs right now"}
              action={
                hasFilters(filters) ? (
                  <>
                    {chips.length > 1 && (
                      <Button variant="outline" onClick={() => patch(chips[chips.length - 1].remove)}>
                        Remove “{chips[chips.length - 1].label}”
                      </Button>
                    )}
                    <Button variant="outline" onClick={clear}>
                      Clear all filters
                    </Button>
                    <CreateAlertButton filters={filters} label={alertLabel} />
                  </>
                ) : null
              }
            >
              {hasFilters(filters)
                ? "Salary and experience limits narrow results the most. Or create an alert and we'll show new matches in My jobs."
                : "Check back soon."}
            </EmptyState>
          ) : (
            <>
              <ul className="space-y-2.5">
                {jobs.map((job, i) => (
                  <li key={job._id}>
                    <JobCard
                      job={job}
                      match={matches[job._id]}
                      matchPending={pending && i < 20}
                      selected={isDesktop && job._id === selectedId}
                      onSelect={isDesktop ? select : undefined}
                    />
                  </li>
                ))}
              </ul>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Loader2 className="animate-spin" />} Show more jobs
                  </Button>
                </div>
              )}
              <CreateAlertButton filters={filters} label={alertLabel} className="mt-4 w-full sm:hidden" />
            </>
          )}
        </section>

        {isDesktop && (
          <aside
            ref={paneRef}
            aria-label="Job details"
            className="sticky top-[72px] h-[calc(100dvh-88px)] overflow-y-auto overscroll-contain rounded-xl border bg-card p-6 [scrollbar-gutter:stable]"
          >
            {selectedId ? (
              <JobDetailView key={selectedId} id={selectedId} variant="pane" headingLevel={2} />
            ) : loading ? null : (
              <p className="py-20 text-center text-sm text-muted-foreground">Select a job to see the details.</p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default Jobs;
