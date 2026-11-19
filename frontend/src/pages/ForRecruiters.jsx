import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecruiterSection from "@/components/marketing/RecruiterSection";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const STEPS = [
  { title: "Add your company", body: "Name, logo, a line about what you do. Candidates see it on every post." },
  { title: "Post a role", body: "Fill in the basics and paste a few notes. Edit the drafted description, then publish." },
  { title: "Review a ranked list", body: "Rank applicants when they come in, open resumes and move people through your pipeline." },
];

const ForRecruiters = () => {
  useDocumentTitle("For recruiters");
  const { user } = useAuth();
  const postPath = user?.role === "recruiter" ? "/admin/jobs/create" : "/signup?role=recruiter";
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 glow" />
        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
          <p className="text-sm font-medium text-brand">SkillFound for recruiters</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">Spend your time on the right applicants</h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
            Write a clear job post in minutes, then start from a shortlist ordered by fit, with a reason for every rank.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link to={postPath}>Post a job</Link>
            </Button>
            {!user && (
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Log in</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <RecruiterSection id="features" showLearnMore={false} />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Up and running in three steps</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border bg-card p-5">
              <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">{i + 1}</span>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex items-start gap-3 rounded-xl border p-5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
          <p>
            Rankings use skills and experience only. Applicant names and contact details are never sent to the model, and every
            ranking comes with a reason you can check.{" "}
            <Link to="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
              How we handle data
            </Link>
          </p>
        </div>
      </section>
    </>
  );
};

export default ForRecruiters;
