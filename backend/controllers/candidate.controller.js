import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { SavedJob } from "../models/savedJob.model.js";
import { JobAlert } from "../models/jobAlert.model.js";
import { FILTER_KEYS, buildJobQuery, normalizeFilters } from "../utils/jobQuery.js";
import { serverError } from "../utils/http.js";

const MAX_SAVED = 200;
const MAX_ALERTS = 10;
const COMPANY_FIELDS = "name logo location verified";

const validJobId = (req, res) => {
  if (mongoose.isValidObjectId(req.params.jobId)) return true;
  res.status(404).json({ message: "Job not found.", success: false });
  return false;
};

export const listSavedIds = async (req, res) => {
  try {
    const ids = await SavedJob.find({ user: req.id }).distinct("job");
    return res.status(200).json({ ids: ids.map(String), success: true });
  } catch (error) {
    return serverError(res, "Error listing saved jobs", error);
  }
};

export const listSaved = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select: "-description -responsibilities -qualifications -benefits",
        populate: { path: "company", select: COMPANY_FIELDS },
      })
      .lean();
    const now = new Date();
    return res.status(200).json({
      saved: saved
        .filter((s) => s.job)
        .map((s) => {
          const { applications = [], ...job } = s.job;
          return {
            _id: s._id,
            savedAt: s.createdAt,
            job: { ...job, applicantCount: applications.length, accepting: job.status !== "closed" && !(job.expiresAt && job.expiresAt <= now) },
          };
        }),
      success: true,
    });
  } catch (error) {
    return serverError(res, "Error listing saved jobs", error);
  }
};

export const saveJob = async (req, res) => {
  try {
    if (!validJobId(req, res)) return;
    if (!(await Job.exists({ _id: req.params.jobId }))) {
      return res.status(404).json({ message: "Job not found.", success: false });
    }
    if ((await SavedJob.countDocuments({ user: req.id })) >= MAX_SAVED) {
      return res.status(400).json({ message: "You've saved the maximum number of jobs. Remove a few first.", success: false });
    }
    await SavedJob.updateOne({ user: req.id, job: req.params.jobId }, { $setOnInsert: { user: req.id, job: req.params.jobId } }, { upsert: true });
    return res.status(200).json({ saved: true, message: "Saved", success: true });
  } catch (error) {
    return serverError(res, "Error saving job", error);
  }
};

export const unsaveJob = async (req, res) => {
  try {
    if (!validJobId(req, res)) return;
    await SavedJob.deleteOne({ user: req.id, job: req.params.jobId });
    return res.status(200).json({ saved: false, message: "Removed from saved", success: true });
  } catch (error) {
    return serverError(res, "Error removing saved job", error);
  }
};

const canonicalQuery = (raw) => {
  const params = new URLSearchParams(String(raw || ""));
  const filters = normalizeFilters(Object.fromEntries(params));
  const out = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) continue;
    out.set(key, Array.isArray(value) ? value.join(",") : String(value));
  }
  return { filters, query: out.toString() };
};

const countFor = async (filters, since) => {
  const query = buildJobQuery(filters);
  const [total, fresh] = await Promise.all([
    Job.countDocuments(query),
    Job.countDocuments({ $and: [query, { createdAt: { $gt: since } }] }),
  ]);
  return { total, fresh };
};

export const listAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({ user: req.id }).sort({ createdAt: -1 }).lean();
    const withCounts = await Promise.all(
      alerts.map(async (a) => {
        const { filters } = canonicalQuery(a.query);
        const { total, fresh } = await countFor(filters, a.lastSeenAt);
        return { ...a, total, newCount: fresh };
      })
    );
    return res.status(200).json({ alerts: withCounts, success: true });
  } catch (error) {
    return serverError(res, "Error listing alerts", error);
  }
};

export const createAlert = async (req, res) => {
  try {
    const { query } = canonicalQuery(req.body?.query);
    if (!query) {
      return res.status(400).json({ message: "Search for something or pick a filter first, then create an alert.", success: false });
    }
    const label = String(req.body?.label || "").trim().slice(0, 120) || "Saved search";
    const existing = await JobAlert.findOne({ user: req.id, query });
    if (existing) return res.status(200).json({ alert: existing, message: "You already have an alert for this search.", success: true });
    if ((await JobAlert.countDocuments({ user: req.id })) >= MAX_ALERTS) {
      return res.status(400).json({ message: `You can keep up to ${MAX_ALERTS} alerts. Delete one to add another.`, success: false });
    }
    const alert = await JobAlert.create({ user: req.id, query, label, lastSeenAt: new Date() });
    return res.status(201).json({ alert, message: "Alert created. New matches will show up in My jobs.", success: true });
  } catch (error) {
    return serverError(res, "Error creating alert", error);
  }
};

const loadAlert = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ message: "Alert not found.", success: false });
    return null;
  }
  const alert = await JobAlert.findOne({ _id: req.params.id, user: req.id });
  if (!alert) res.status(404).json({ message: "Alert not found.", success: false });
  return alert;
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await loadAlert(req, res);
    if (!alert) return;
    await alert.deleteOne();
    return res.status(200).json({ message: "Alert deleted.", success: true });
  } catch (error) {
    return serverError(res, "Error deleting alert", error);
  }
};

export const markAlertSeen = async (req, res) => {
  try {
    const alert = await loadAlert(req, res);
    if (!alert) return;
    alert.lastSeenAt = new Date();
    await alert.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    return serverError(res, "Error updating alert", error);
  }
};

