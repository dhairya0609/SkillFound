import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import JobDetailView from "@/components/jobs/JobDetailView";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 sm:px-6 sm:pt-8 sm:pb-16">
      <Link
        to="/jobs"
        onClick={(e) => {
          if (window.history.length > 1 && window.history.state?.idx > 0) {
            e.preventDefault();
            navigate(-1);
          }
        }}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>
      <JobDetailView id={id} />
    </div>
  );
};

export default JobDetail;
