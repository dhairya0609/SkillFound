import mongoose from "mongoose";
import { Job, JOB_TYPES, WORK_MODES, JOB_LIFETIME_DAYS, liveJobFilter } from "../models/job.model.js";
import { Application, APPLICATION_STATUSES } from "../models/application.model.js";
import { MatchScore } from "../models/matchScore.model.js";
import { JobReport, REPORT_REASONS } from "../models/jobReport.model.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { buildJobQuery, normalizeFilters } from "../utils/jobQuery.js";
import { CATEGORIES } from "../utils/categories.js";
import { serverError } from "../utils/http.js";

const DEMO_JOB_CAP = 25;
const COMPANY_FIELDS = "name logo location website description isSeed tagline industry size founded locations verified";
const LIST_EXCLUDE = "-description -responsibilities -qualifications -benefits";
const DAY = 24 * 60 * 60 * 1000;

const parseRequirements = (value) =>
    (Array.isArray(value) ? value : String(value || "").split(/[,\n]/))
        .map((r) => String(r).trim())
        .filter(Boolean)
        .slice(0, 30);

const parseLines = (value, max = 12) =>
    (Array.isArray(value) ? value : String(value || "").split("\n"))
        .map((r) => String(r).replace(/^\s*[•\-*]\s*/, "").trim().slice(0, 240))
        .filter(Boolean)
        .slice(0, max);

const withCounts = (job) => {
    const { applications = [], ...rest } = job;
    return { ...rest, applicantCount: applications.length };
};

export const postJob = async (req, res) => {
    try {
        const {
            title, description, requirements, salary, salaryMax, location,
            jobType, experience, position, companyId, workMode,
            responsibilities, qualifications, benefits,
        } = req.body;

        if (!title || !description || !requirements || salary === undefined || salary === "" || !location || !jobType || experience === undefined || experience === "" || !position || !companyId) {
            return res.status(400).json({
                message: "Please fill in every required field.",
                success: false,
            });
        }
        if (!mongoose.isValidObjectId(companyId)) {
            return res.status(400).json({ message: "Pick a company for this job.", success: false });
        }
        const company = await Company.findById(companyId);
        if (!company || String(company.userId) !== String(req.id)) {
            return res.status(403).json({ message: "You can only post jobs for your own companies.", success: false });
        }

        if (req.user?.isDemo && (await Job.countDocuments({ createdBy: req.id, isSeed: false })) >= DEMO_JOB_CAP) {
            return res.status(403).json({
                message: "The demo account has reached its job posting limit. Sign up to post more.",
                success: false,
            });
        }

        const minSalary = Number(salary);
        const maxSalary = salaryMax === undefined || salaryMax === "" ? undefined : Number(salaryMax);
        if (!Number.isFinite(minSalary) || minSalary < 0 || (maxSalary !== undefined && (!Number.isFinite(maxSalary) || maxSalary < minSalary))) {
            return res.status(400).json({ message: "Salary range looks invalid.", success: false });
        }

        const job = await Job.create({
            title: String(title).slice(0, 120),
            description: String(description).slice(0, 8000),
            requirements: parseRequirements(requirements),
            responsibilities: parseLines(responsibilities),
            qualifications: parseLines(qualifications),
            benefits: parseLines(benefits),
            lastActivityAt: new Date(),
            salary: minSalary,
            salaryMax: maxSalary,
            location: String(location).slice(0, 80),
            workMode: WORK_MODES.includes(workMode) ? workMode : "On-site",
            jobType: JOB_TYPES.includes(jobType) ? jobType : String(jobType).slice(0, 40),
            experienceLevel: Math.max(0, Number(experience) || 0),
            position: Math.max(1, Number(position) || 1),
            company: companyId,
            createdBy: req.id,
        });

        return res.status(201).json({
            message: "Job posted.",
            job,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Job posting error", error);
    }
};

const SORTS = new Set(["relevant", "newest", "salary", "match"]);

const sortMatches = async (userId, jobs) => {
    const user = await User.findById(userId, "profileVersion role").lean();
    if (!user || user.role !== "student") return null;
    const scores = await MatchScore.find(
        { user: userId, profileVersion: user.profileVersion || 1, job: { $in: jobs.map((j) => j._id) } },
        "job score"
    ).lean();
    const byJob = new Map(scores.map((m) => [String(m.job), m.score]));
    return [...jobs].sort(
        (a, b) => (byJob.get(String(b._id)) ?? -1) - (byJob.get(String(a._id)) ?? -1) || b.createdAt - a.createdAt
    );
};

export const getAllJobs = async (req, res) => {
    try {
        const filters = normalizeFilters(req.query);
        const query = buildJobQuery(filters);
        if (req.query.featured === "true") {
            const demoIds = await User.find({ isDemo: true }).distinct("_id");
            query.$or = [{ isSeed: true }, { createdBy: { $nin: demoIds } }];
        }

        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const sortKey = SORTS.has(req.query.sort) ? req.query.sort : "relevant";

        let sort = { createdAt: -1 };
        if (sortKey === "salary") sort = { salaryMax: -1, salary: -1, createdAt: -1 };
        else if (sortKey === "relevant" && filters.text) sort = { score: { $meta: "textScore" }, createdAt: -1 };

        const projection = filters.text && sortKey === "relevant" ? { score: { $meta: "textScore" } } : {};
        const find = () => Job.find(query, projection).select(LIST_EXCLUDE).populate({ path: "company", select: COMPANY_FIELDS });

        let jobs;
        let total;
        if (sortKey === "match" && req.id) {
            const all = await find().sort({ createdAt: -1 }).limit(500).lean();
            const ranked = (await sortMatches(req.id, all)) || all;
            total = ranked.length;
            jobs = ranked.slice((page - 1) * limit, page * limit);
        } else {
            [jobs, total] = await Promise.all([
                find().sort(sort).skip((page - 1) * limit).limit(limit).lean(),
                Job.countDocuments(query),
            ]);
        }

        return res.status(200).json({
            jobs: jobs.map(withCounts),
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            sort: sortKey,
            filters,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving jobs", error);
    }
};

export const getJobFacets = async (req, res) => {
    try {
        const live = liveJobFilter();
        const [locations, companyIds, total] = await Promise.all([
            Job.distinct("location", live),
            Job.distinct("company", live),
            Job.countDocuments(live),
        ]);
        const companies = await Company.find({ _id: { $in: companyIds } }, "name").sort({ name: 1 }).lean();
        return res.status(200).json({
            locations: locations.filter(Boolean).sort(),
            companies,
            jobTypes: JOB_TYPES,
            workModes: WORK_MODES,
            total,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving job facets", error);
    }
};

const isLive = (job) => job.status !== "closed" && !(job.expiresAt && new Date(job.expiresAt) <= new Date());

export const getJobById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }
        const job = await Job.findById(req.params.id)
            .populate({ path: "company", select: COMPANY_FIELDS })
            .populate({ path: "applications", select: "applicant status history createdAt" })
            .lean();
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false,
            });
        }
        const viewerApplication = req.id
            ? job.applications.find((a) => String(a.applicant) === String(req.id))
            : null;
        const isOwner = req.id && String(job.createdBy) === String(req.id);
        return res.status(200).json({
            job: {
                ...job,
                applications: isOwner ? job.applications : [],
                applicantCount: job.applications.length,
                accepting: isLive(job),
            },
            viewerApplication: viewerApplication
                ? { _id: viewerApplication._id, status: viewerApplication.status, history: viewerApplication.history, createdAt: viewerApplication.createdAt }
                : null,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving job", error);
    }
};

export const getSimilarJobs = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(200).json({ jobs: [], success: true });
        const job = await Job.findById(req.params.id, "requirements company title").lean();
        if (!job) return res.status(200).json({ jobs: [], success: true });
        const skills = new Set((job.requirements || []).map((r) => r.toLowerCase()));
        const titleWords = new Set(job.title.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
        const candidates = await Job.find({
            ...liveJobFilter(),
            _id: { $ne: job._id },
            $or: [{ requirements: { $in: job.requirements || [] } }, { company: job.company }],
        })
            .select(LIST_EXCLUDE)
            .populate({ path: "company", select: COMPANY_FIELDS })
            .limit(60)
            .lean();
        const scored = candidates
            .map((c) => {
                const overlap = (c.requirements || []).filter((r) => skills.has(r.toLowerCase())).length;
                const titleHits = c.title.toLowerCase().split(/[^a-z]+/).filter((w) => titleWords.has(w)).length;
                return { job: c, score: overlap * 2 + titleHits * 3 + (String(c.company?._id) === String(job.company) ? 1 : 0) };
            })
            .sort((a, b) => b.score - a.score || b.job.createdAt - a.job.createdAt)
            .slice(0, 4)
            .map((s) => withCounts(s.job));
        return res.status(200).json({ jobs: scored, success: true });
    } catch (error) {
        return serverError(res, "Error retrieving similar jobs", error);
    }
};

const emptyPipeline = () => Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));

export const getJobForAdmin = async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.id })
            .select(LIST_EXCLUDE)
            .populate({ path: "company", select: COMPANY_FIELDS })
            .sort({ createdAt: -1 })
            .lean();
        const counts = await Application.aggregate([
            { $match: { job: { $in: jobs.map((j) => j._id) } } },
            { $group: { _id: { job: "$job", status: "$status" }, n: { $sum: 1 } } },
        ]);
        const pipelines = new Map();
        for (const { _id, n } of counts) {
            const key = String(_id.job);
            if (!pipelines.has(key)) pipelines.set(key, emptyPipeline());
            pipelines.get(key)[_id.status] = n;
        }
        return res.status(200).json({
            jobs: jobs.map((job) => ({
                ...withCounts(job),
                pipeline: pipelines.get(String(job._id)) || emptyPipeline(),
                accepting: isLive(job),
            })),
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving jobs for admin", error);
    }
};

export const updateJobStatus = async (req, res) => {
    try {
        const action = String(req.body?.action || "");
        if (!["close", "reopen", "extend"].includes(action)) {
            return res.status(400).json({ message: "Unknown action.", success: false });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }
        const job = await Job.findById(req.params.id);
        if (!job || String(job.createdBy) !== String(req.id)) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }
        if (job.isSeed && req.user?.isDemo) {
            return res.status(403).json({
                message: "Sample jobs can't be closed from the shared demo account. Post your own job to try it.",
                success: false,
            });
        }
        if (action === "close") {
            job.status = "closed";
        } else {
            job.status = "open";
            job.expiresAt = new Date(Date.now() + JOB_LIFETIME_DAYS * DAY);
        }
        job.lastActivityAt = new Date();
        await job.save();
        const messages = { close: "Job closed. It no longer appears in search.", reopen: "Job reopened for 30 days.", extend: "Job extended for 30 days." };
        return res.status(200).json({ message: messages[action], status: job.status, expiresAt: job.expiresAt, success: true });
    } catch (error) {
        return serverError(res, "Error updating job status", error);
    }
};

export const reportJob = async (req, res) => {
    try {
        const reason = String(req.body?.reason || "");
        if (!REPORT_REASONS.includes(reason)) {
            return res.status(400).json({ message: "Choose a reason for the report.", success: false });
        }
        if (!mongoose.isValidObjectId(req.params.id) || !(await Job.exists({ _id: req.params.id }))) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }
        const reporterKey = req.id ? `user:${req.id}` : `ip:${req.ip}`;
        await JobReport.updateOne(
            { job: req.params.id, reporterKey },
            { $set: { reason, details: String(req.body?.details || "").slice(0, 1000) } },
            { upsert: true }
        );
        return res.status(201).json({ message: "Thanks. We'll review this job.", success: true });
    } catch (error) {
        return serverError(res, "Error reporting job", error);
    }
};

export const getJobOverview = async (req, res) => {
    try {
        const live = liveJobFilter();
        const remoteQuery = buildJobQuery(normalizeFilters({ workModes: ["Remote"] }));
        const weekAgo = new Date(Date.now() - 7 * DAY);
        const [openRoles, remoteRoles, newThisWeek, byCompany, categoryCounts] = await Promise.all([
            Job.countDocuments(live),
            Job.countDocuments(remoteQuery),
            Job.countDocuments({ ...live, createdAt: { $gte: weekAgo } }),
            Job.aggregate([
                { $match: live },
                { $group: { _id: "$company", openRoles: { $sum: 1 }, latest: { $max: "$createdAt" } } },
                { $sort: { openRoles: -1, latest: -1 } },
                { $limit: 48 },
            ]),
            Promise.all(CATEGORIES.map((c) => Job.countDocuments(buildJobQuery(normalizeFilters({ category: c.id }))))),
        ]);
        const companyDocs = await Company.find({ _id: { $in: byCompany.map((c) => c._id) } }, COMPANY_FIELDS).lean();
        const docsById = new Map(companyDocs.map((c) => [String(c._id), c]));
        const companies = byCompany
            .map((c) => docsById.get(String(c._id)) && { ...docsById.get(String(c._id)), openRoles: c.openRoles })
            .filter(Boolean);

        res.set("Cache-Control", "public, max-age=60");
        return res.status(200).json({
            stats: { openRoles, companiesHiring: companies.length, remoteRoles, newThisWeek },
            companies,
            categories: CATEGORIES.map((c, i) => ({ id: c.id, label: c.label, count: categoryCounts[i] })),
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error building job overview", error);
    }
};
