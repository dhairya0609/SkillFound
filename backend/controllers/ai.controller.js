import crypto from "crypto";
import mongoose from "mongoose";
import { ai as cfg } from "../config/env.js";
import { AiError } from "../ai/errors.js";
import { consume, usage } from "../ai/limits.js";
import { health, isAvailable, isConfigured } from "../ai/gemini.js";
import { interpretSearch, parseResume, rankApplicants, scoreMatches, writeJobDescription } from "../ai/tasks.js";
import { Job } from "../models/job.model.js";
import { MatchScore } from "../models/matchScore.model.js";
import { normalizeFilters } from "../utils/jobQuery.js";
import { createTtlCache } from "../utils/ttlCache.js";
import { loadOwnedJob } from "./application.controller.js";

const HOUR = 60 * 60 * 1000;
const MAX_MATCH_BATCH = 10;
const MAX_RANK = 25;

const searchCache = createTtlCache({ max: 300, ttlMs: 6 * HOUR });
const rankCache = createTtlCache({ max: 100, ttlMs: HOUR / 2 });

const sendAiError = (res, error, label) => {
  if (error instanceof AiError) {
    if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
      retryAfter: error.retryAfter,
    });
  }
  console.error(`${label}:`, error?.message || error);
  return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Something went wrong. Please try again." });
};

const requireAi = () => {
  if (!isConfigured()) throw new AiError("AI_DISABLED");
  if (!isAvailable()) throw new AiError("AI_UNAVAILABLE");
};

const spend = (req) => consume({ ip: req.ip, userId: req.id });

export const aiStatus = (req, res) => {
  const { today, dailyCap } = usage();
  return res.status(200).json({
    success: true,
    enabled: isAvailable(),
    quotaExhausted: isAvailable() && today >= dailyCap,
  });
};

export const aiHealth = (req, res) => {
  res.set("Cache-Control", "no-store");
  return res.status(200).json({ success: true, ...health(), usage: usage() });
};

const hasAnyFilter = (f) =>
  f.keywords.length || f.skills.length || f.locations.length || f.workModes.length || f.jobTypes.length ||
  f.minSalary != null || f.minExperience != null || f.maxExperience != null;

export const aiSearch = async (req, res) => {
  const query = String(req.body?.query || "").trim().replace(/\s+/g, " ").slice(0, 200);
  if (!query) {
    return res.status(400).json({ success: false, message: "Type what you're looking for." });
  }

  const keywordFallback = (reason, notice) =>
    res.status(200).json({
      success: true,
      mode: "keyword",
      reason,
      notice,
      filters: normalizeFilters({ text: query }),
    });

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached) return res.status(200).json({ success: true, mode: "ai", cached: true, filters: cached });

  try {
    requireAi();
    spend(req);
    const knownLocations = (await Job.distinct("location")).filter(Boolean);
    const interpreted = await interpretSearch(query, { knownLocations });
    const filters = normalizeFilters(interpreted);
    if (!hasAnyFilter(filters)) {
      return keywordFallback("NO_FILTERS", "Couldn't pick out specific filters, so here are keyword matches.");
    }
    searchCache.set(cacheKey, filters);
    return res.status(200).json({ success: true, mode: "ai", filters });
  } catch (error) {
    if (error instanceof AiError) {
      const notice =
        error.code === "AI_DISABLED" || error.code === "AI_UNAVAILABLE"
          ? "AI search isn't available right now, so these are keyword matches."
          : error.code === "AI_RATE_LIMITED"
            ? `${error.message} Showing keyword matches meanwhile.`
            : "AI search hit a snag, so these are keyword matches.";
      return keywordFallback(error.code, notice);
    }
    return sendAiError(res, error, "AI search error");
  }
};

const profileIsEmpty = (profile = {}) =>
  !(profile.skills?.length || profile.bio || profile.experienceSummary || profile.headline);

const serializeMatch = (m) => ({
  jobId: String(m.job),
  score: m.score,
  reasons: m.reasons,
  missingSkills: m.missingSkills,
});

export const matchJobs = async (req, res) => {
  try {
    requireAi();
    const user = req.user;
    if (profileIsEmpty(user.profile)) {
      return res.status(422).json({
        success: false,
        code: "PROFILE_EMPTY",
        message: "Add your skills or upload a resume to see match scores.",
      });
    }

    const jobIds = Array.from(new Set((req.body?.jobIds || []).map(String)))
      .filter((id) => mongoose.isValidObjectId(id))
      .slice(0, MAX_MATCH_BATCH);
    if (!jobIds.length) return res.status(200).json({ success: true, matches: [] });

    const version = user.profileVersion || 1;
    const cached = await MatchScore.find({ user: user._id, profileVersion: version, job: { $in: jobIds } }).lean();
    const cachedIds = new Set(cached.map((m) => String(m.job)));
    const missingIds = jobIds.filter((id) => !cachedIds.has(id));

    let fresh = [];
    if (missingIds.length) {
      const jobs = await Job.find({ _id: { $in: missingIds } }).populate({ path: "company", select: "name" }).lean();
      if (jobs.length) {
        spend(req);
        const scored = await scoreMatches(user.profile, jobs);
        fresh = scored.map((s) => ({
          user: user._id,
          job: s.job._id,
          profileVersion: version,
          score: s.score,
          reasons: s.reasons,
          missingSkills: s.missingSkills,
          model: cfg.model,
        }));
        if (fresh.length) {
          await MatchScore.bulkWrite(
            fresh.map((doc) => ({
              updateOne: {
                filter: { user: doc.user, job: doc.job, profileVersion: doc.profileVersion },
                update: { $set: doc },
                upsert: true,
              },
            })),
            { ordered: false }
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      matches: [...cached, ...fresh].map(serializeMatch),
    });
  } catch (error) {
    return sendAiError(res, error, "AI match error");
  }
};

export const resumeAutofill = async (req, res) => {
  try {
    requireAi();
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Choose a PDF resume to upload." });
    }
    if (file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ success: false, message: "That file isn't a valid PDF." });
    }
    spend(req);
    const draft = await parseResume(file.buffer);
    return res.status(200).json({ success: true, draft });
  } catch (error) {
    return sendAiError(res, error, "AI resume error");
  }
};

export const draftJobDescription = async (req, res) => {
  try {
    requireAi();
    const { title, notes, companyName, location, workMode, jobType, experience } = req.body || {};
    if (!String(title || "").trim() || String(notes || "").trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Add a job title and a few bullet points about the role first.",
      });
    }
    spend(req);
    const draft = await writeJobDescription({ title, notes, companyName, location, workMode, jobType, experience });
    return res.status(200).json({ success: true, draft });
  } catch (error) {
    return sendAiError(res, error, "AI job description error");
  }
};

export const rankJobApplicants = async (req, res) => {
  try {
    requireAi();
    const job = await loadOwnedJob(req, res, true);
    if (!job) return;

    const applications = job.applications.filter((a) => a.applicant).slice(0, MAX_RANK);
    if (!applications.length) return res.status(200).json({ success: true, rankings: [] });

    const fingerprint = crypto
      .createHash("sha1")
      .update(
        [job._id, job.updatedAt?.getTime(), ...applications.map((a) => `${a._id}:${a.applicant.profileVersion || 1}`)].join("|")
      )
      .digest("hex");
    const cached = rankCache.get(fingerprint);
    if (cached) return res.status(200).json({ success: true, cached: true, rankings: cached });

    spend(req);
    const ranked = await rankApplicants(
      job.toObject(),
      applications.map((a) => ({ applicationId: String(a._id), profile: a.applicant.profile || {} }))
    );
    const rankings = ranked.map((r) => ({
      applicationId: r.applicant.applicationId,
      score: r.score,
      reason: r.reason,
    }));
    rankCache.set(fingerprint, rankings);
    return res.status(200).json({ success: true, rankings });
  } catch (error) {
    return sendAiError(res, error, "AI ranking error");
  }
};
