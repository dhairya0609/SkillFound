import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const CompanyLogo = ({ company, className }) => {
  const [failed, setFailed] = useState(false);
  const src = company?.logo;
  return (
    <div className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border bg-muted text-xs font-semibold text-muted-foreground", className)}>
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} loading="lazy" />
      ) : (
        initials(company?.name)
      )}
    </div>
  );
};

export default CompanyLogo;
