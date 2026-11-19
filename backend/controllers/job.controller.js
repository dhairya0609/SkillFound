import mongoose from "mongoose";
import { Job, JOB_TYPES, WORK_MODES } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import { buildJobQuery, normalizeFilters } from "../utils/jobQuery.js";
import { CATEGORIES } from "../utils/categories.js";
import { serverError } from "../utils/http.js";

const DEMO_JOB_CAP = 25;
const COMPANY_FIELDS = "name logo location website description isSeed";

const parseRequirements = (value) =>
    (Array.isArray(value) ? value : String(value || "").split(/[,\n]/))
        .map((r) => String(r).trim())
        .filter(Boolean)
        .slice(0, 30);

export const postJob = async (req, res) => {
    try {
        const {
            title, description, requirements, salary, salaryMax, location,
            jobType, experience, position, companyId, workMode,
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

        let sort = { createdAt: -1 };
        if (filters.text) sort = { score: { $meta: "textScore" }, createdAt: -1 };
        else if (req.query.sort === "salary") sort = { salaryMax: -1, salary: -1 };

        const projection = filters.text ? { score: { $meta: "textScore" } } : {};
        const [jobs, total] = await Promise.all([
            Job.find(query, projection)
                .populate({ path: "company", select: COMPANY_FIELDS })
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Job.countDocuments(query),
        ]);

        return res.status(200).json({
            jobs,
            total,
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            filters,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving jobs", error);
    }
};

export const getJobFacets = async (req, res) => {
    try {
        const [locations, total] = await Promise.all([Job.distinct("location"), Job.estimatedDocumentCount()]);
        return res.status(200).json({
            locations: locations.filter(Boolean).sort(),
            jobTypes: JOB_TYPES,
            workModes: WORK_MODES,
            total,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving job facets", error);
    }
};

export const getJobById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }
        const job = await Job.findById(req.params.id)
            .populate({ path: "company", select: COMPANY_FIELDS })
            .populate({ path: "applications", select: "applicant status" })
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
            },
            viewerApplication: viewerApplication ? { _id: viewerApplication._id, status: viewerApplication.status } : null,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving job", error);
    }
};

export const getJobForAdmin = async (req, res) => {
    try {
        const jobs = await Job.find({ createdBy: req.id })
            .populate({ path: "company", select: COMPANY_FIELDS })
            .sort({ createdAt: -1 })
            .lean();
        return res.status(200).json({
            jobs: jobs.map((job) => ({ ...job, applicantCount: job.applications.length })),
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving jobs for admin", error);
    }
};

export const getJobOverview = async (req, res) => {
    try {
        const remoteQuery = buildJobQuery(normalizeFilters({ workModes: ["Remote"] }));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [openRoles, remoteRoles, newThisWeek, byCompany, categoryCounts] = await Promise.all([
            Job.countDocuments({}),
            Job.countDocuments(remoteQuery),
            Job.countDocuments({ createdAt: { $gte: weekAgo } }),
            Job.aggregate([
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
