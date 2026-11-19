import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Building2, ChevronRight, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useCompanies } from "@/hooks/useCompanies";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api } from "@/lib/api";
import { formatSalary, plural, timeAgo } from "@/lib/format";

const Stat = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border bg-card p-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-4" /> {label}
    </div>
    <div className="mt-2 text-2xl font-semibold tabular-nums">{value ?? <Skeleton className="h-7 w-10" />}</div>
  </div>
);

const Dashboard = () => {
  useDocumentTitle("Recruiter dashboard");
  const { user } = useAuth();
  const { companies } = useCompanies();
  const [jobs, setJobs] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get("/job/getadminjobs")
      .then(({ data }) => setJobs(data.jobs))
      .catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!jobs || !q) return jobs;
    return jobs.filter((j) => j.title.toLowerCase().includes(q) || j.company?.name?.toLowerCase().includes(q));
  }, [jobs, query]);

  const applicants = jobs?.reduce((sum, j) => sum + (j.applicantCount || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow={`Hi ${user.fullName.split(" ")[0]}`}
        title="Your job posts"
        description="Review applicants, rank them with AI and move them through your pipeline."
        actions={
          <Button asChild>
            <Link to="/admin/jobs/create">
              <Plus /> Post a job
            </Link>
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat icon={Briefcase} label="Open jobs" value={jobs?.length} />
        <Stat icon={Users} label="Applicants" value={applicants} />
        <Stat icon={Building2} label="Companies" value={companies?.length} />
      </div>

      <div className="mt-8 rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b p-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by role or company" className="h-9 bg-background pl-9" aria-label="Filter jobs" />
          </div>
        </div>
        {!filtered ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            {jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs posted yet"
                className="border-0"
                action={
                  companies?.length === 0 ? (
                    <Button asChild>
                      <Link to="/admin/companies">Add your company first</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/admin/jobs/create">Post your first job</Link>
                    </Button>
                  )
                }
              >
                {companies?.length === 0 ? "Jobs belong to a company, so start by adding yours." : "Describe the role in a few bullets and AI drafts the rest."}
              </EmptyState>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No jobs match “{query}”.</p>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((job, i) => (
              <motion.li key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <Link to={`/admin/jobs/${job._id}/applicants`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50">
                  <CompanyLogo company={job.company} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {[job.company?.name, job.workMode, formatSalary(job), timeAgo(job.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums sm:inline-flex">
                    <Users className="size-3.5 text-muted-foreground" />
                    {plural(job.applicantCount || 0, "applicant")}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground sm:hidden">{job.applicantCount || 0}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
