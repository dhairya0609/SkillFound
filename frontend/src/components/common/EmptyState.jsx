import { cn } from "@/lib/utils";

const EmptyState = ({ icon: Icon, title, children, action, className }) => (
  <div className={cn("flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center", className)}>
    {Icon && (
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border bg-card shadow-xs">
        <Icon className="size-5 text-muted-foreground" />
      </div>
    )}
    <h3 className="font-medium">{title}</h3>
    {children && <div className="mt-1.5 max-w-sm text-sm text-muted-foreground">{children}</div>}
    {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

export default EmptyState;
