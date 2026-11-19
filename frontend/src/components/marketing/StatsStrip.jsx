import { Skeleton } from "@/components/ui/skeleton";

const ITEMS = [
  { key: "openRoles", label: "Open roles" },
  { key: "companiesHiring", label: "Companies hiring" },
  { key: "remoteRoles", label: "Remote roles" },
  { key: "newThisWeek", label: "Posted this week" },
];

const StatsStrip = ({ stats, loading }) => {
  if (!stats && !loading) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
      {ITEMS.map((item) => (
        <div key={item.key} className="bg-card px-5 py-4">
          <dt className="text-[13px] text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {stats ? stats[item.key] : <Skeleton className="h-7 w-12" />}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default StatsStrip;
