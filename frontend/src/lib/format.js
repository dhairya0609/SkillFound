const trim = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ""));

export const formatSalary = (job) => {
  if (job?.salary == null) return "";
  const min = Number(job.salary);
  const max = job.salaryMax != null ? Number(job.salaryMax) : null;
  return max && max !== min ? `₹${trim(min)}–${trim(max)} LPA` : `₹${trim(min)} LPA`;
};

export const formatExperience = (years) => {
  const n = Number(years);
  if (!Number.isFinite(n) || n <= 0) return "Fresher";
  return `${trim(n)}+ yr${n === 1 ? "" : "s"}`;
};

export const formatYears = (years) => {
  const n = Number(years);
  if (years == null || years === "" || !Number.isFinite(n)) return "";
  if (n <= 0) return "Fresher";
  return `${trim(n)} yr${n === 1 ? "" : "s"} experience`;
};

export const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days}d ago`;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export const plural = (n, word) => {
  if (n === 1) return `${n} ${word}`;
  return `${n} ${/[^aeiou]y$/i.test(word) ? `${word.slice(0, -1)}ies` : `${word}s`}`;
};

export const formatPlace = (job) => {
  if (job?.workMode === "Remote") return "Remote";
  return [job?.location, job?.workMode].filter(Boolean).join(" · ");
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysSince = (date) => (date ? Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS) : Infinity);

export const postedLabel = (date) => {
  const days = daysSince(date);
  if (days < 1) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return "Posted 30+ days ago";
};

export const jobBadge = (job) => {
  if (!job || job.accepting === false || job.status === "closed") return null;
  if ((job.applicantCount ?? 0) < 3 && daysSince(job.createdAt) <= 3) return { tone: "brand", label: "Early applicant" };
  if (daysSince(job.lastActivityAt) <= 7) return { tone: "success", label: "Actively hiring" };
  return null;
};

export const closesLabel = (job) => {
  if (!job?.expiresAt) return null;
  const days = Math.ceil((new Date(job.expiresAt).getTime() - Date.now()) / DAY_MS);
  if (days <= 0) return null;
  return days === 1 ? "Closes tomorrow" : `Closes in ${days} days`;
};

const normaliseSkill = (s) => String(s).toLowerCase().replace(/[^a-z0-9+#]/g, "");

export const skillsMatch = (jobSkills = [], profileSkills = []) => {
  const mine = new Set(profileSkills.map(normaliseSkill));
  const matched = jobSkills.filter((s) => mine.has(normaliseSkill(s)));
  const missing = jobSkills.filter((s) => !mine.has(normaliseSkill(s)));
  return { matched, missing, total: jobSkills.length };
};
