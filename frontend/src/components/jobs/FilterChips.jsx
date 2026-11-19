import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AiLabel } from "@/components/ai/AiMark";
import { filterChips } from "@/lib/filters";

const FilterChips = ({ filters, onChange, onClear, aiInterpreted, companyName }) => {
  const chips = filterChips(filters, { companyName });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {aiInterpreted && <AiLabel className="mr-1">Understood as</AiLabel>}
      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.button
            layout
            key={chip.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => onChange(chip.remove)}
            className="group inline-flex max-w-full items-center gap-1 rounded-full border bg-card py-1 pr-1.5 pl-2.5 text-[13px] hover:border-foreground/25"
            aria-label={`Remove filter ${chip.label}`}
          >
            <span className="truncate">{chip.label}</span>
            <X className="size-3.5 text-muted-foreground group-hover:text-foreground" />
          </motion.button>
        ))}
      </AnimatePresence>
      <button type="button" onClick={onClear} className="ml-1 text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Clear all
      </button>
    </div>
  );
};

export default FilterChips;
