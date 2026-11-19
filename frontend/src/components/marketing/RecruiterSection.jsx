import { Link } from "react-router-dom";
import { ArrowRight, ListOrdered, PenLine, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import RankPreview from "./RankPreview";

const RECRUITER_FEATURES = [
  {
    icon: PenLine,
    title: "Job posts from a few bullet points",
    body: "Jot down the stack, the team and what the hire will own. Get a clear description and skill list to edit and publish.",
  },
  {
    icon: ListOrdered,
    title: "A ranked shortlist with reasons",
    body: "Applicants are ordered by fit with a one-line reason each, judged on skills and experience only.",
  },
  {
    icon: Workflow,
    title: "A pipeline that stays simple",
    body: "Move people from applied to shortlisted to offer. Candidates see their status update on their profile.",
  },
];

const RecruiterSection = ({ id = "recruiters", showLearnMore = true }) => {
  const { user } = useAuth();
  const postPath = user?.role === "recruiter" ? "/admin/jobs/create" : "/signup?role=recruiter";
  return (
    <section id={id} className="scroll-mt-20 border-y bg-card/40">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-24 [&>*]:min-w-0">
        <div>
          <p className="text-sm font-medium text-brand">For recruiters</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">Hire from a ranked shortlist, not a pile of PDFs</h2>
          <ul className="mt-8 space-y-6">
            {RECRUITER_FEATURES.map((f) => (
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
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to={postPath}>Post a job</Link>
            </Button>
            {showLearnMore && (
              <Button asChild size="lg" variant="ghost">
                <Link to="/for-recruiters">
                  How it works <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
        <RankPreview />
      </div>
    </section>
  );
};

export default RecruiterSection;
