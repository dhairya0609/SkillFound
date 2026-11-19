import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchTier } from "./match";

export const MatchBadge = ({ match, pending, className }) => {
  if (pending && !match) {
    return <span className={cn("h-6 w-[74px] animate-pulse rounded-full bg-brand-soft", className)} aria-label="Scoring match" />;
  }
  if (!match) return null;
  const tier = matchTier(match.score);
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      title={`${tier.label}: ${match.reasons?.[0] || ""}`}
      className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-semibold tabular-nums", tier.bg, tier.tone, className)}
    >
      <Sparkles className="size-3" />
      {match.score}% match
    </motion.span>
  );
};

export const MatchRing = ({ score, size = 76 }) => {
  const tier = matchTier(score);
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-muted" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={tier.stroke}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums leading-none">{score}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};
