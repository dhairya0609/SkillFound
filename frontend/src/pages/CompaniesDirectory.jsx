import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Building2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import PageHeader from "@/components/common/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useOverview } from "@/hooks/useOverview";
import { plural } from "@/lib/format";

const CompaniesDirectory = () => {
  useDocumentTitle("Companies hiring");
  const { data, error, loading, reload } = useOverview();
  const [query, setQuery] = useState("");

  const companies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.companies || [];
    return q ? list.filter((c) => `${c.name} ${c.location || ""} ${c.description || ""}`.toLowerCase().includes(q)) : list;
  }, [data, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <PageHeader
        title="Companies hiring"
        description={
          data?.stats
            ? `${plural(data.stats.companiesHiring, "company")} with ${plural(data.stats.openRoles, "open role")} right now.`
            : "Teams with open roles right now."
        }
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search companies" className="pl-9" aria-label="Search companies" />
          </div>
        }
      />

      <div className="mt-8">
        {error && !data ? (
          <LoadError error={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState icon={Building2} title={query ? `No companies match “${query}”` : "No companies are hiring yet"}>
            {query ? "Try a different name or city." : "Check back soon."}
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <Link
                  to={`/companies/${c._id}`}
                  className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/40"
                >
                  <div className="flex items-center gap-3">
                    <CompanyLogo company={c} className="size-11 rounded-xl" />
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-1 truncate font-semibold">
                        <span className="truncate">{c.name}</span>
                        {c.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified employer" />}
                      </h2>
                      {c.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {c.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{c.tagline || c.description || "No description yet."}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{[c.industry, c.size && `${c.size} employees`].filter(Boolean).join(" · ")}</p>
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <span className="font-medium">{plural(c.openRoles, "open role")}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                      View company <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompaniesDirectory;
