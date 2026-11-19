import * as React from "react";

import { cn } from "@/lib/utils";

const fieldClass =
  "placeholder:text-muted-foreground/80 selection:bg-brand-soft border-input bg-card flex w-full min-w-0 rounded-lg border px-3 text-base shadow-xs transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClass,
        "h-10 py-1 file:mr-3 file:inline-flex file:h-7 file:rounded-md file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }) {
  return <textarea data-slot="textarea" className={cn(fieldClass, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export { Input, Textarea };
