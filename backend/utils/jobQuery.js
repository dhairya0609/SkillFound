import mongoose from "mongoose";
import { JOB_TYPES, WORK_MODES } from "../models/job.model.js";
import { escapeRegex } from "./http.js";
import { categoryById } from "./categories.js";

const MAX_LIST = 8;
const MAX_TERM = 40;

const toList = (value) => {
  if (value == null || value === "") return [];
  const raw = Array.isArray(value) ? value : String(value).split(",");
  return Array.from(
    new Set(raw.map((v) => String(v).trim().slice(0, MAX_TERM)).filter(Boolean))
  ).slice(0, MAX_LIST);
};

const pickEnum = (values, allowed) => {
  const byLower = new Map(allowed.map((a) => [a.toLowerCase().replace(/[^a-z]/g, ""), a]));
  return toList(values)
    .map((v) => byLower.get(v.toLowerCase().replace(/[^a-z]/g, "")))
    .filter(Boolean);
};

const toNumber = (value, { min = 0, max = 1000 } = {}) => {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
};

export const FILTER_KEYS = [
  "q", "text", "keywords", "skills", "locations", "workModes", "jobTypes",
  "minSalary", "minExperience", "maxExperience", "company", "category",
];

export const normalizeFilters = (input = {}) => {
  const filters = {
    q: String(input.q ?? input.keyword ?? "").trim().slice(0, 120),
    text: String(input.text ?? "").trim().slice(0, 200),
    keywords: toList(input.keywords),
    skills: toList(input.skills),
    locations: toList(input.locations),
    workModes: pickEnum(input.workModes, WORK_MODES),
    jobTypes: pickEnum(input.jobTypes, JOB_TYPES),
    minSalary: toNumber(input.minSalary, { max: 500 }),
    minExperience: toNumber(input.minExperience, { max: 40 }),
    maxExperience: toNumber(input.maxExperience, { max: 40 }),
    company: mongoose.isValidObjectId(input.company) ? String(input.company) : "",
    category: categoryById(input.category) ? input.category : "",
  };
  if (
    filters.minExperience != null &&
    filters.maxExperience != null &&
    filters.minExperience > filters.maxExperience
  ) {
    filters.minExperience = undefined;
  }
  return filters;
};

const wordRegex = (term) => new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}($|[^a-z0-9])`, "i");
const prefixRegex = (term) => new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}`, "i");
const containsRegex = (term) => new RegExp(escapeRegex(term), "i");

const STOPWORDS = new Set(["a", "an", "and", "the", "for", "in", "of", "or", "to", "with", "job", "jobs", "role", "roles"]);

export const buildJobQuery = (filters) => {
  const and = [];

  if (filters.q) {
    const terms = filters.q.toLowerCase().split(/\s+/).filter((t) => t && !STOPWORDS.has(t)).slice(0, 6);
    for (const term of terms) {
      const rx = containsRegex(term);
      and.push({ $or: [{ title: rx }, { requirements: rx }, { location: rx }, { description: rx }] });
    }
  }

  if (filters.keywords.length) {
    and.push({
      $or: filters.keywords.flatMap((k) => [{ title: containsRegex(k) }, { requirements: wordRegex(k) }]),
    });
  }

  if (filters.skills.length) {
    and.push({
      $or: filters.skills.flatMap((s) => [{ requirements: wordRegex(s) }, { title: wordRegex(s) }]),
    });
  }

  if (filters.locations.length) {
    and.push({ $or: filters.locations.map((l) => ({ location: containsRegex(l) })) });
  }

  if (filters.workModes.length) and.push({ workMode: { $in: filters.workModes } });
  if (filters.jobTypes.length) and.push({ jobType: { $in: filters.jobTypes } });

  if (filters.minSalary != null) {
    and.push({ $expr: { $gte: [{ $ifNull: ["$salaryMax", "$salary"] }, filters.minSalary] } });
  }
  if (filters.maxExperience != null) and.push({ experienceLevel: { $lte: filters.maxExperience } });
  if (filters.minExperience != null) and.push({ experienceLevel: { $gte: filters.minExperience } });
  if (filters.company) and.push({ company: new mongoose.Types.ObjectId(filters.company) });

  const category = categoryById(filters.category);
  if (category?.titles) and.push({ $or: category.titles.map((t) => ({ title: prefixRegex(t) })) });
  if (category?.workModes) and.push({ workMode: { $in: category.workModes } });
  if (category?.jobTypes) and.push({ jobType: { $in: category.jobTypes } });

  const query = and.length ? { $and: and } : {};
  if (filters.text) query.$text = { $search: filters.text };
  return query;
};
