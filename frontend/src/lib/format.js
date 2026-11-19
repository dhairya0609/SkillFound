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

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const formatPlace = (job) => {
  if (job?.workMode === "Remote") return "Remote";
  return [job?.location, job?.workMode].filter(Boolean).join(" · ");
};
