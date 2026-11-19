import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const AiLabel = ({ children = "AI", className }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand", className)}>
    <Sparkles className="size-3" />
    {children}
  </span>
);

export const AiUnavailableNote = ({ children, className }) => (
  <p className={cn("flex items-start gap-2 rounded-lg border border-dashed px-3 py-2.5 text-[13px] text-muted-foreground", className)}>
    <Sparkles className="mt-0.5 size-3.5 shrink-0" />
    <span>{children || "AI features are switched off on this server right now. Everything else works as usual."}</span>
  </p>
);
