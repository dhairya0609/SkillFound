import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Gauge,
  ListOrdered,
  MessageSquareText,
  PenLine,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DemoButtons from "@/components/common/DemoButtons";
import EmptyState from "@/components/common/EmptyState";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import { MatchRing } from "@/components/jobs/MatchBadge";
import SmartSearch from "@/components/jobs/SmartSearch";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useJobs } from "@/hooks/useJobs";
import { useMatches } from "@/hooks/useMatches";
import { emptyFilters, filtersToParams } from "@/lib/filters";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

const FEATURED_FILTERS = emptyFilters();

const AI_FEATURES = [
  {
    icon: Upload,
    title: "Resume to profile",
    body: "Upload a PDF and Gemini drafts your headline, skills and experience. You review every field before it's saved.",
  },
  {
    icon: Gauge,
    title: "Match scores with reasons",
    body: "Each job gets a 0–100 fit score, the reasons behind it and the skills you're missing. Cached, so it's instant on revisit.",
  },
  {
    icon: MessageSquareText,
    title: "Search in plain English",
    body: "“Remote React roles over 12 LPA for freshers” becomes filters you can see and remove. Falls back to keywords if AI is busy.",
  },
  {
    icon: PenLine,
    title: "Job posts from bullet points",
    body: "Recruiters jot a few notes and get an editable, plain-language description and skill list to post.",
  },
  {
    icon: ListOrdered,
    title: "Ranked applicants",
    body: "One click orders applicants by fit with a one-line reason each, judged on skills and experience only.",
  },
];

const STEPS = [
  { title: "Add your profile", body: "Upload a resume or type your skills. Takes a minute either way." },
  { title: "See how you fit", body: "Every listing shows a match score and what's missing, so you apply where you're strong." },
  { title: "Apply and track", body: "One click to apply. Your profile shows each application's status as recruiters move it." },
];

const SAMPLE_MATCH = {
  score: 86,
  reasons: ["React and TypeScript match the core stack", "Dashboard work lines up with the role", "Experience meets the 1-year bar"],
  have: ["React", "TypeScript", "Next.js", "Jest", "REST APIs"],
  missing: ["Redux Toolkit", "Accessibility audits"],
};

const Home = () => {
  useDocumentTitle();
  const navigate = useNavigate();
  const { user, isCandidate } = useAuth();
  const featured = useJobs(FEATURED_FILTERS, { featured: true, limit: 6 });
  const { matches, pending } = useMatches(featured.jobs.map((j) => j._id));

  const goToResults = (result) => {
    navigate(`/jobs?${filtersToParams(result.filters)}`, { state: { search: result } });
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute inset-0 glow" />
        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
          <motion.div initial="hidden" animate="show" className="mx-auto max-w-3xl text-center">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-[13px] text-muted-foreground shadow-xs backdrop-blur">
                <Sparkles className="size-3.5 text-brand" />
                <span className="sm:hidden">AI-assisted job search</span>
                <span className="hidden sm:inline">Resume autofill, match scores and plain-English search</span>
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-6 text-[40px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl"
            >
              Find jobs that fit what you can <span className="text-brand">actually do</span>.
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground text-pretty">
              Upload your resume once. SkillFound fills in your profile, scores every job against your skills and tells you
              what's missing. Recruiters get drafted job posts and a ranked shortlist.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mx-auto mt-8 max-w-2xl text-left">
              <SmartSearch size="lg" examples onResult={goToResults} />
            </motion.div>
            {!user && (
              <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">No sign-up needed. Jump in with a demo account:</p>
                <DemoButtons />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border bg-card/60 p-2 shadow-xl shadow-black/[0.03] backdrop-blur dark:shadow-black/30"
        >
          <div className="grid gap-2 lg:grid-cols-[1.35fr_1fr]">
            <div className="rounded-xl border bg-background p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-medium">Fresh openings</h2>
                <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  Browse all <ArrowRight className="size-3.5" />
                </Link>
              </div>
              {featured.error ? (
                <EmptyState icon={Search} title="Jobs are loading slowly">
                  {featured.error} The server may still be waking up. Try refreshing in a moment.
                </EmptyState>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {featured.loading
                    ? Array.from({ length: 4 }, (_, i) => <JobCardSkeleton key={i} />)
                    : featured.jobs.slice(0, 4).map((job) => (
                        <JobCard key={job._id} job={job} match={matches[job._id]} matchPending={pending} />
                      ))}
                </div>
              )}
            </div>
            <div className="flex flex-col rounded-xl border bg-background p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Why this score?</h2>
                <span className="text-xs text-muted-foreground">Example</span>
              </div>
              <div className="mt-5 flex items-center gap-4">
                <MatchRing score={SAMPLE_MATCH.score} />
                <div>
                  <p className="font-medium text-success">Strong match</p>
                  <p className="text-sm text-muted-foreground">Frontend Engineer (React)</p>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {SAMPLE_MATCH.reasons.map((r) => (
                  <li key={r} className="flex gap-2.5">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-success" />
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-5 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your skills</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SAMPLE_MATCH.have.map((s) => (
                    <span key={s} className="rounded-md bg-success/10 px-2 py-0.5 text-xs text-success">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Missing</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SAMPLE_MATCH.missing.map((s) => (
                    <span key={s} className="rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-5">
                {isCandidate ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/jobs">See your real scores</Link>
                  </Button>
                ) : (
                  <DemoButtons size="default" stacked only="student" next="/jobs" />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From resume to application in three steps</h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="rounded-xl border bg-card p-5"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                {i + 1}
              </span>
              <h3 className="mt-4 font-medium">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="border-y bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-brand">AI features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Useful AI, with you in control</h2>
              <p className="mt-3 text-muted-foreground">
                Every AI output is a draft you can edit or ignore. It runs on Google Gemini with rate limits, and the board
                keeps working without it.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AI_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="rounded-xl border bg-card p-5 transition-colors hover:border-brand/30"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <f.icon className="size-[18px]" />
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.div>
            ))}
            <div className="flex flex-col justify-between rounded-xl border border-dashed p-5">
              <div>
                <div className="flex size-9 items-center justify-center rounded-lg border bg-card">
                  <FileText className="size-[18px] text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-medium">Private by default</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Applicant names and contact details never go to the model, and prompts aren't logged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">See it working in under a minute</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          The demo accounts come with a filled profile, applications and applicants, so every screen has something to show.
        </p>
        <div className="mt-8 flex justify-center">
          {user ? (
            <Button asChild size="lg">
              <Link to={user.role === "recruiter" ? "/admin/jobs" : "/jobs"}>
                Continue as {user.fullName.split(" ")[0]} <ArrowRight />
              </Link>
            </Button>
          ) : (
            <DemoButtons />
          )}
        </div>
      </section>
    </>
  );
};

export default Home;
