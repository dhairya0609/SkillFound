import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Field = ({ label, htmlFor, hint, className, children }) => (
  <div className={cn("grid gap-1.5", className)}>
    <Label htmlFor={htmlFor} className="text-[13px] font-medium">
      {label}
    </Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default Field;
