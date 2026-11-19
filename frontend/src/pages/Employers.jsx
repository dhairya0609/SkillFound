import { Link } from "react-router-dom";
import { CalendarClock, KanbanSquare, ListOrdered, PenLine, PhoneOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const FEATURES = [
  {
    icon: PenLine,
    title: "Clear job posts in minutes",
    body: "Write a few notes about the role and get a structured draft: about the role, responsibilities, requirements and skills. Edit everything before it goes live.",
  },
  {
    icon: ListOrdered,
    title: "A ranked shortlist with reasons",
    body: "Rank applicants by fit with one click. Every rank comes with a one-line reason based on skills and experience only.",
  },
  {
    icon: KanbanSquare,
    title: "A pipeline by stage",
    body: "Move people from applied to viewed, shortlisted, interview and offer. Candidates see each update, so nobody is left guessing.",
  },
  {
    icon: CalendarClock,
    title: "Listings that stay current",
    body: "Jobs close automatically 30 days after posting unless you extend them, so your listings never go stale.",
  },
  {
    icon: PhoneOff,
    title: "Respectful by default",
    body: "Candidate phone numbers are shared only once you shortlist someone. No cold-calling the whole applicant pool.",
  },
  {
    icon: ShieldCheck,
    title: "Salary on every post",
    body: "A salary range is required, which is what candidates look for first and why the right people apply.",
  },
];

const STEPS = [
  { title: "Add your company", body: "Name, logo, size, industry and a line about what you do." },
  { title: "Post a role", body: "Fill in the basics and the salary range. Let SkillFound draft the description if you like." },
  { title: "Hire from your pipeline", body: "Review applicants by stage, rank them, and keep every candidate updated." },
];

const Employers = () => {
  useDocumentTitle("Hire with SkillFound");
  const { user } = useAuth();
  const postPath = user?.role === "recruiter" ? "/admin/jobs/create" : "/signup?role=recruiter";
  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold text-primary">SkillFound for employers</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Hire people who can do the job
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Post a clear role with the salary up front, then work through a pipeline that ranks applicants by fit and keeps every
            candidate informed.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to={postPath}>Post a job</Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline">
                <Link to="/login" state={{ from: "/admin/jobs" }}>
                  Employer sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="features">
        <h2 id="features" className="text-2xl font-semibold tracking-tight">
          What you get
        </h2>
        <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <f.icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t bg-muted/30" aria-labelledby="steps">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="steps" className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border bg-card p-5">
                <span className="text-sm font-semibold text-primary tabular-nums">Step {i + 1}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to={postPath}>Post your first job</Link>
            </Button>
            <Link to="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              How we handle candidate data
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Employers;
