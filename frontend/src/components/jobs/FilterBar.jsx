import { useState } from "react";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFacets } from "@/hooks/useFacets";
import { DATE_POSTED, EXPERIENCE_BANDS, JOB_TYPES, SALARY_STEPS, WORK_MODES, activeBand } from "@/lib/filters";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const Option = ({ selected, multi, onClick, children }) => (
  <button
    type="button"
    role={multi ? "menuitemcheckbox" : "menuitemradio"}
    aria-checked={selected}
    onClick={onClick}
    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
  >
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center border transition-colors",
        multi ? "rounded" : "rounded-full",
        selected ? "border-primary bg-primary text-primary-foreground" : "bg-card"
      )}
      aria-hidden="true"
    >
      {selected && (multi ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />)}
    </span>
    {children}
  </button>
);

const ChipMenu = ({ label, value, active, onClear, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="menu"
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
            active ? "border-primary bg-primary/10 font-medium text-primary" : "bg-card hover:border-foreground/25"
          )}
        >
          {active && value ? value : label}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-xl p-1.5" role="menu" aria-label={label}>
        <div onClick={(e) => e.target.closest("[role^=menuitemradio]") && setOpen(false)}>{children}</div>
        {active && (
          <div className="mt-1 border-t px-1 pt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const summary = (list, single) => (list.length === 1 ? single(list[0]) : `${list.length} selected`);

const FilterControls = ({ filters, onChange, layout = "chips" }) => {
  const facets = useFacets();
  const band = activeBand(filters);
  const companies = facets?.companies || [];
  const cities = (facets?.locations || []).filter((l) => !/^remote/i.test(l));

  const groups = [
    {
      id: "date",
      label: "Date posted",
      active: filters.postedWithin != null,
      value: DATE_POSTED.find((d) => d.days === filters.postedWithin)?.label,
      clear: { postedWithin: undefined },
      options: DATE_POSTED.map((d) => ({
        key: d.days,
        label: d.label,
        selected: filters.postedWithin === d.days,
        onClick: () => onChange({ postedWithin: filters.postedWithin === d.days ? undefined : d.days }),
      })),
    },
    {
      id: "experience",
      label: "Experience",
      active: Boolean(band),
      value: EXPERIENCE_BANDS.find((b) => b.id === band)?.label,
      clear: { minExperience: undefined, maxExperience: undefined },
      options: EXPERIENCE_BANDS.map((b) => ({
        key: b.id,
        label: b.label,
        selected: band === b.id,
        onClick: () =>
          onChange(band === b.id ? { minExperience: undefined, maxExperience: undefined } : { minExperience: b.minExperience, maxExperience: b.maxExperience }),
      })),
    },
    {
      id: "salary",
      label: "Salary",
      active: filters.minSalary != null,
      value: filters.minSalary != null ? `₹${filters.minSalary}+ LPA` : null,
      clear: { minSalary: undefined },
      options: SALARY_STEPS.filter(Boolean).map((s) => ({
        key: s,
        label: `₹${s} LPA or more`,
        selected: filters.minSalary === s,
        onClick: () => onChange({ minSalary: filters.minSalary === s ? undefined : s }),
      })),
    },
    {
      id: "mode",
      label: "Work mode",
      multi: true,
      active: filters.workModes.length > 0,
      value: summary(filters.workModes, (v) => v),
      clear: { workModes: [] },
      options: WORK_MODES.map((m) => ({ key: m, label: m, selected: filters.workModes.includes(m), onClick: () => onChange({ workModes: toggle(filters.workModes, m) }) })),
    },
    {
      id: "type",
      label: "Job type",
      multi: true,
      active: filters.jobTypes.length > 0,
      value: summary(filters.jobTypes, (v) => v),
      clear: { jobTypes: [] },
      options: JOB_TYPES.map((t) => ({ key: t, label: t, selected: filters.jobTypes.includes(t), onClick: () => onChange({ jobTypes: toggle(filters.jobTypes, t) }) })),
    },
    {
      id: "company",
      label: "Company",
      active: Boolean(filters.company),
      value: companies.find((c) => c._id === filters.company)?.name || "1 company",
      clear: { company: "" },
      options: companies.map((c) => ({
        key: c._id,
        label: c.name,
        selected: filters.company === c._id,
        onClick: () => onChange({ company: filters.company === c._id ? "" : c._id }),
      })),
    },
  ];

  if (layout === "chips") {
    return groups.map((g) => (
      <ChipMenu key={g.id} label={g.label} value={g.value} active={g.active} onClear={() => onChange(g.clear)}>
        {g.options.map((o) => (
          <Option key={o.key} selected={o.selected} multi={g.multi} onClick={o.onClick}>
            {o.label}
          </Option>
        ))}
      </ChipMenu>
    ));
  }

  const cityGroup = {
    id: "city",
    label: "City",
    multi: true,
    options: cities.map((city) => {
      const on = filters.locations.some((l) => l.toLowerCase() === city.toLowerCase());
      return {
        key: city,
        label: city,
        selected: on,
        onClick: () =>
          onChange({ locations: on ? filters.locations.filter((l) => l.toLowerCase() !== city.toLowerCase()) : [...filters.locations, city] }),
      };
    }),
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[...groups, cityGroup].map((g) => (
        <fieldset key={g.id}>
          <legend className="mb-1.5 text-sm font-semibold">{g.label}</legend>
          <div className="-mx-2.5">
            {g.options.map((o) => (
              <Option key={o.key} selected={o.selected} multi={g.multi} onClick={o.onClick}>
                {o.label}
              </Option>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

const FilterBar = ({ filters, onChange, onClear, total, loading, activeCount }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
            activeCount ? "border-primary bg-primary/10 text-primary" : "bg-card hover:border-foreground/25"
          )}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          All filters{activeCount ? ` · ${activeCount}` : ""}
        </button>
        <span className="h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <FilterControls filters={filters} onChange={onChange} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>All filters</DialogTitle>
          </DialogHeader>
          <FilterControls filters={filters} onChange={onChange} layout="sheet" />
          <DialogFooter className="flex-row items-center justify-between gap-2 border-t pt-4">
            <Button variant="ghost" onClick={onClear}>
              Clear all
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={() => setOpen(false)}>
              {loading ? "Show results" : `Show ${plural(total, "job")}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilterBar;
