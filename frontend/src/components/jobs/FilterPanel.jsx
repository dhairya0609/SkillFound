import { Check } from "lucide-react";
import { EXPERIENCE_BANDS, JOB_TYPES, SALARY_STEPS, WORK_MODES, activeBand } from "@/lib/filters";
import { cn } from "@/lib/utils";

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "rounded-lg border px-2.5 py-1.5 text-[13px] transition-colors",
      active ? "border-brand/50 bg-brand-soft text-brand" : "bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const Section = ({ title, children }) => (
  <fieldset className="space-y-2.5">
    <legend className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</legend>
    {children}
  </fieldset>
);

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const FilterPanel = ({ filters, onChange, locations = [] }) => {
  const band = activeBand(filters);
  const cities = locations.filter((l) => !/^remote/i.test(l));
  return (
    <div className="space-y-7">
      <Section title="Work mode">
        <div className="flex flex-wrap gap-1.5">
          {WORK_MODES.map((m) => (
            <Chip key={m} active={filters.workModes.includes(m)} onClick={() => onChange({ workModes: toggle(filters.workModes, m) })}>
              {m}
            </Chip>
          ))}
        </div>
      </Section>
      <Section title="Job type">
        <div className="flex flex-wrap gap-1.5">
          {JOB_TYPES.map((t) => (
            <Chip key={t} active={filters.jobTypes.includes(t)} onClick={() => onChange({ jobTypes: toggle(filters.jobTypes, t) })}>
              {t}
            </Chip>
          ))}
        </div>
      </Section>
      <Section title="Experience">
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_BANDS.map((b) => (
            <Chip
              key={b.id}
              active={band === b.id}
              onClick={() =>
                onChange(
                  band === b.id
                    ? { minExperience: undefined, maxExperience: undefined }
                    : { minExperience: b.minExperience, maxExperience: b.maxExperience }
                )
              }
            >
              {b.label}
            </Chip>
          ))}
        </div>
      </Section>
      <Section title="Minimum salary">
        <div className="flex flex-wrap gap-1.5">
          {SALARY_STEPS.map((s) => (
            <Chip
              key={s}
              active={(filters.minSalary ?? 0) === s}
              onClick={() => onChange({ minSalary: s === 0 ? undefined : s })}
            >
              {s === 0 ? "Any" : `₹${s}+ L`}
            </Chip>
          ))}
        </div>
      </Section>
      {cities.length > 0 && (
        <Section title="City">
          <div className="grid gap-0.5">
            {cities.map((city) => {
              const active = filters.locations.some((l) => l.toLowerCase() === city.toLowerCase());
              return (
                <button
                  key={city}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      locations: active
                        ? filters.locations.filter((l) => l.toLowerCase() !== city.toLowerCase())
                        : [...filters.locations, city],
                    })
                  }
                  className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border transition-colors",
                      active ? "border-brand bg-brand text-brand-foreground" : "bg-card"
                    )}
                  >
                    {active && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  {city}
                </button>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
};

export default FilterPanel;
