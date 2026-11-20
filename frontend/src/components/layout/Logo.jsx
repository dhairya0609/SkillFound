import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const LogoMark = ({ className }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)}>
    <rect width="32" height="32" rx="8" className="fill-foreground" />
    <path
      d="M10.5 19.5c1.2 1.6 3 2.5 5.3 2.5 2.9 0 4.7-1.4 4.7-3.4 0-4.5-9.6-2.4-9.6-7 0-1.9 1.8-3.4 4.6-3.4 2 0 3.6.8 4.6 2.1"
      fill="none"
      strokeWidth="2.6"
      strokeLinecap="round"
      className="stroke-background"
    />
    <circle cx="23.5" cy="8.5" r="2.5" className="fill-brand" />
  </svg>
);

const Logo = ({ to = "/", className }) => (
  <Link to={to} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="SkillFound home">
    <LogoMark />
    <span className="text-[17px]">SkillFound</span>
  </Link>
);

export default Logo;
