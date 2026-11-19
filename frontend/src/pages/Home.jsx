import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gauge, MessageSquareText, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadError from "@/components/common/LoadError";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import SmartSearch from "@/components/jobs/SmartSearch";
import CategoryTiles from "@/components/marketing/CategoryTiles";
import HiringCompanies from "@/components/marketing/HiringCompanies";
import MatchPreview from "@/components/marketing/MatchPreview";
import RecruiterSection from "@/components/marketing/RecruiterSection";
import StatsStrip from "@/components/marketing/StatsStrip";
import { useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJobs } from "@/hooks/useJobs";
import { useMatches } from "@/hooks/useMatches";
import { useOverview } from "@/hooks/useOverview";
import { emptyFilters, filtersToParams } from "@/lib/filters";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

const inView = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

const ALL_JOBS = emptyFilters();

const CANDIDATE_FEATURES = [
  {
    icon: Gauge,
    title: "A match score on every listing",
    body: "A 0–100 fit score with the reasons behind it and the skills you're missing, so you apply where you're strong.",
  },
  {
    icon: Upload,
    title: "Your profile from your resume",
    body: "Upload a PDF and review a drafted headline, skills and experience. Nothing is saved until you confirm.",
  },
  {
    icon: MessageSquareText,
    title: "Search the way you'd say it",
    body: "“Remote React roles over 12 LPA for freshers” turns into filters you can see and remove.",
  },
];

const SectionHeading = ({ eyebrow, title, action }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="text-sm font-medium text-brand">{eyebrow}</p>}
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h2>
    </div>
    {action}
  </div>
);

const Home = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const ai = useAiStatus();
  const { user, isCandidate } = useAuth();
  const overview = useOverview();
  const fresh = useJobs(ALL_JOBS, { limit: 6, featured: true });
  const { matches, pending } = useMatches(fresh.jobs.map((j) => j._id));

  const goToResults = (result) => {
    navigate(`/jobs?${filtersToParams(result.filters)}`, { state: { search: result } });
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 glow" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:px-6 sm:pt-20 sm:pb-16">
          <motion.div initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
            {ai.enabled && (
              <motion.div variants={fadeUp} custom={0}>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-[13px] text-muted-foreground shadow-xs backdrop-blur transition-colors hover:text-foreground"
                >
                  <Sparkles className="size-3.5 text-brand" />
                  New: match scores on every listing
                  <ArrowRight className="size-3.5" />
                </Link>
              </motion.div>
            )}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-6 text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl"
            >
              Find jobs that fit what you can <span className="text-brand">actually do</span>.
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-pretty text-muted-foreground">
              Engineering, data, design and product roles at growing teams across India. See how well each one fits your
              skills, and what's missing, before you apply.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mx-auto mt-8 max-w-3xl text-left">
              <SmartSearch size="lg" withLocation examples onResult={goToResults} />
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mx-auto mt-12 max-w-4xl">
            <StatsStrip stats={overview.data?.stats} loading={overview.loading} />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-20 sm:px-6 sm:space-y-24">
        <motion.div {...inView}>
          <HiringCompanies companies={overview.data?.companies} loading={overview.loading} />
        </motion.div>

        {(overview.loading || overview.data) && (
          <motion.section {...inView} aria-label="Browse by category">
            <SectionHeading eyebrow="Browse" title="Explore by category" />
            <div className="mt-6">
              <CategoryTiles categories={overview.data?.categories} loading={overview.loading} />
            </div>
          </motion.section>
        )}

        <motion.section {...inView} aria-label="Fresh openings">
          <SectionHeading
            eyebrow="Just posted"
            title="Fresh openings"
            action={
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link to="/jobs">
                  View all jobs <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="mt-6">
            {fresh.error ? (
              <LoadError error={fresh.error} onRetry={fresh.retry} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fresh.loading
                  ? Array.from({ length: 6 }, (_, i) => <JobCardSkeleton key={i} />)
                  : fresh.jobs.map((job) => <JobCard key={job._id} job={job} match={matches[job._id]} matchPending={pending} />)}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section {...inView} className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 [&>*]:min-w-0" aria-labelledby="candidates">
          <div>
            <p className="text-sm font-medium text-brand">For candidates</p>
            <h2 id="candidates" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              Know your fit before you apply
            </h2>
            <ul className="mt-8 space-y-6">
              {CANDIDATE_FEATURES.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <f.icon className="size-[18px]" />
                  </span>
                  <div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to={isCandidate ? "/profile" : user ? "/jobs" : "/signup"}>
                  {isCandidate ? "Update your profile" : user ? "Browse jobs" : "Create your profile"}
                </Link>
              </Button>
            </div>
          </div>
          <MatchPreview />
        </motion.section>
      </div>

      <RecruiterSection />

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">Your next role is a search away</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          {overview.data?.stats
            ? `${overview.data.stats.openRoles} open roles from ${overview.data.stats.companiesHiring} companies, updated as teams post.`
            : "New roles from growing teams, updated as they post."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg">
            <Link to="/jobs">
              Browse jobs <ArrowRight />
            </Link>
          </Button>
          {!user && (
            <Button asChild size="lg" variant="outline">
              <Link to="/signup">Create an account</Link>
            </Button>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
