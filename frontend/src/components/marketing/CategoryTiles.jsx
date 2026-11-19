import { Link } from "react-router-dom";
import { BarChart3, Code2, Compass, Globe, GraduationCap, PenTool } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { plural } from "@/lib/format";

const ICONS = {
  engineering: Code2,
  data: BarChart3,
  design: PenTool,
  product: Compass,
  remote: Globe,
  internships: GraduationCap,
};

const CategoryTiles = ({ categories, loading }) => {
  if (!loading && !categories?.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {loading
        ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)
        : categories.map((c) => {
            const Icon = ICONS[c.id] || Compass;
            return (
              <Link
                key={c.id}
                to={`/jobs?category=${c.id}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/40 sm:p-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-brand-soft group-hover:text-brand">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.label}</span>
                  <span className="text-sm text-muted-foreground">{plural(c.count, "role")}</span>
                </span>
              </Link>
            );
          })}
    </div>
  );
};

export default CategoryTiles;
