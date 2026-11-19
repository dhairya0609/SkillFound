export const WORK_MODES = ["Remote", "Hybrid", "On-site"];
export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];

export const EXPERIENCE_BANDS = [
  { id: "fresher", label: "Fresher", maxExperience: 1 },
  { id: "junior", label: "1–3 yrs", minExperience: 1, maxExperience: 3 },
  { id: "mid", label: "3–5 yrs", minExperience: 3, maxExperience: 5 },
  { id: "senior", label: "5+ yrs", minExperience: 5 },
];

export const SALARY_STEPS = [0, 5, 10, 15, 20, 30];

const LIST_KEYS = ["keywords", "skills", "locations", "workModes", "jobTypes"];
const NUMBER_KEYS = ["minSalary", "minExperience", "maxExperience"];
const TEXT_KEYS = ["q", "text", "company"];

export const emptyFilters = () => ({
  q: "",
  text: "",
  company: "",
  keywords: [],
  skills: [],
  locations: [],
  workModes: [],
  jobTypes: [],
  minSalary: undefined,
  minExperience: undefined,
  maxExperience: undefined,
});

export const filtersFromParams = (params) => {
  const f = emptyFilters();
  for (const key of TEXT_KEYS) f[key] = params.get(key) || "";
  for (const key of LIST_KEYS) {
    const raw = params.get(key);
    f[key] = raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : [];
  }
  for (const key of NUMBER_KEYS) {
    const raw = params.get(key);
    f[key] = raw !== null && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : undefined;
  }
  return f;
};

export const filtersToParams = (filters, extra = {}) => {
  const params = new URLSearchParams();
  for (const key of TEXT_KEYS) if (filters[key]) params.set(key, filters[key]);
  for (const key of LIST_KEYS) if (filters[key]?.length) params.set(key, filters[key].join(","));
  for (const key of NUMBER_KEYS) if (filters[key] != null) params.set(key, String(filters[key]));
  for (const [key, value] of Object.entries(extra)) if (value != null && value !== "") params.set(key, String(value));
  return params;
};

export const fromApiFilters = (api = {}) => ({
  ...emptyFilters(),
  ...Object.fromEntries(
    [...TEXT_KEYS, ...LIST_KEYS, ...NUMBER_KEYS].filter((k) => api[k] != null).map((k) => [k, api[k]])
  ),
});

export const activeBand = (filters) =>
  EXPERIENCE_BANDS.find(
    (b) => b.minExperience === filters.minExperience && b.maxExperience === filters.maxExperience
  )?.id;

export const hasFilters = (f) =>
  Boolean(f.q || f.text) ||
  LIST_KEYS.some((k) => f[k]?.length) ||
  NUMBER_KEYS.some((k) => f[k] != null);

export const filterChips = (f, { companyName } = {}) => {
  const chips = [];
  if (f.company) chips.push({ id: "company", label: companyName ? `Company: ${companyName}` : "One company", remove: { company: "" } });
  if (f.text) chips.push({ id: "text", label: `“${f.text}”`, remove: { text: "" } });
  if (f.q) chips.push({ id: "q", label: `“${f.q}”`, remove: { q: "" } });
  for (const key of LIST_KEYS) {
    for (const value of f[key] || []) {
      chips.push({
        id: `${key}:${value}`,
        label: key === "keywords" ? `Role: ${value}` : key === "skills" ? `Skill: ${value}` : value,
        remove: { [key]: f[key].filter((v) => v !== value) },
      });
    }
  }
  if (f.minSalary != null) chips.push({ id: "minSalary", label: `₹${f.minSalary}+ LPA`, remove: { minSalary: undefined } });
  const band = activeBand(f);
  if (band) {
    chips.push({
      id: "experience",
      label: EXPERIENCE_BANDS.find((b) => b.id === band).label,
      remove: { minExperience: undefined, maxExperience: undefined },
    });
  } else {
    if (f.maxExperience != null) chips.push({ id: "maxExperience", label: `≤ ${f.maxExperience} yrs exp`, remove: { maxExperience: undefined } });
    if (f.minExperience != null) chips.push({ id: "minExperience", label: `${f.minExperience}+ yrs exp`, remove: { minExperience: undefined } });
  }
  return chips;
};
