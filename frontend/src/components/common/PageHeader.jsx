import { cn } from "@/lib/utils";

const PageHeader = ({ eyebrow, title, description, actions, className }) => (
  <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
    <div className="min-w-0">
      {eyebrow && <p className="mb-1.5 text-sm font-medium text-brand">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
