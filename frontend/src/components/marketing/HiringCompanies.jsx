import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import { plural } from "@/lib/format";

const HiringCompanies = ({ companies, loading, limit = 6 }) => {
  if (!loading && !companies?.length) return null;
  return (
    <section aria-labelledby="hiring-now">
      <div className="flex items-end justify-between gap-4">
        <h2 id="hiring-now" className="text-sm font-medium text-muted-foreground">
          Companies hiring now
        </h2>
        <Link to="/companies" className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          All companies <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: limit }, (_, i) => <Skeleton key={i} className="h-[58px] rounded-xl" />)
          : companies.slice(0, limit).map((c, i) => (
              <li key={c._id} className={i >= 4 ? "hidden min-[480px]:block" : undefined}>
                <Link
                  to={`/jobs?company=${c._id}`}
                  className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:border-brand/40"
                >
                  <CompanyLogo company={c} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.location}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {plural(c.openRoles, "role")}
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
};

export default HiringCompanies;
