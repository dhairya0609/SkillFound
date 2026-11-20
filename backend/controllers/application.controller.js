import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { Application, APPLICATION_STATUSES, CONTACTABLE_STATUSES } from "../models/application.model.js";
import { serverError } from "../utils/http.js";

const APPLICANT_FIELDS = "fullName email phoneNumber profile profileVersion createdAt";

const isLive = (job) => job.status !== "closed" && !(job.expiresAt && job.expiresAt <= new Date());

export const applyJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        if (!mongoose.isValidObjectId(jobId)) {
            return res.status(404).json({ message: "Job not found.", success: false });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false,
            });
        }
        if (!isLive(job)) {
            return res.status(400).json({ message: "This job is no longer accepting applications.", success: false });
        }

        const existing = await Application.findOne({ job: jobId, applicant: req.id });
        if (existing) {
            return res.status(400).json({
                message: "You've already applied to this job.",
                success: false,
            });
        }

        const application = await Application.create({
            job: jobId,
            applicant: req.id,
            history: [{ status: "applied", at: new Date() }],
        });
        await Job.updateOne({ _id: jobId }, { $addToSet: { applications: application._id } });

        return res.status(201).json({
            message: "Application sent.",
            application: { _id: application._id, status: application.status, history: application.history, createdAt: application.createdAt },
            success: true,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(400).json({ message: "You've already applied to this job.", success: false });
        }
        return serverError(res, "Error applying for job", error);
    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const application = await Application.find({ applicant: req.id })
            .sort({ createdAt: -1 })
            .populate({
                path: "job",
                select: "title location workMode jobType salary salaryMax company status expiresAt",
                populate: { path: "company", select: "name logo" },
            })
            .lean();
        return res.status(200).json({
            application: application
                .filter((a) => a.job)
                .map((a) => ({ ...a, job: { ...a.job, accepting: isLive(a.job) } })),
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving applied jobs", error);
    }
};

export const loadOwnedJob = async (req, res, populateApplicants = false) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(404).json({ message: "Job not found.", success: false });
        return null;
    }
    let query = Job.findById(req.params.id).populate({ path: "company", select: "name logo" });
    if (populateApplicants) {
        query = query.populate({
            path: "applications",
            options: { sort: { createdAt: -1 } },
            populate: { path: "applicant", select: APPLICANT_FIELDS },
        });
    }
    const job = await query;
    if (!job || String(job.createdBy) !== String(req.id)) {
        res.status(404).json({ message: "Job not found.", success: false });
        return null;
    }
    return job;
};

// Phone numbers stay private until the employer shortlists someone, so
// applying never exposes a candidate to cold calls.
const redactContact = (application) => {
    const app = application.toObject ? application.toObject() : application;
    if (!app.applicant || CONTACTABLE_STATUSES.includes(app.status)) return { ...app, contactHidden: false };
    return { ...app, applicant: { ...app.applicant, phoneNumber: null }, contactHidden: true };
};

export const getAllApplicants = async (req, res) => {
    try {
        const job = await loadOwnedJob(req, res, true);
        if (!job) return;
        const plain = job.toObject();
        return res.status(200).json({
            job: { ...plain, applications: job.applications.map(redactContact), accepting: isLive(job) },
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving applicants", error);
    }
};

const loadOwnedApplication = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(404).json({ message: "Application not found.", success: false });
        return null;
    }
    const application = await Application.findById(req.params.id).populate({ path: "job", select: "createdBy" });
    if (!application || String(application.job?.createdBy) !== String(req.id)) {
        res.status(404).json({ message: "Application not found.", success: false });
        return null;
    }
    return application;
};

const touchJob = (jobId) => Job.updateOne({ _id: jobId }, { $set: { lastActivityAt: new Date() } }, { timestamps: false });

export const updateStatus = async (req, res) => {
    try {
        const status = String(req.body.status || "").toLowerCase();
        if (!APPLICATION_STATUSES.includes(status)) {
            return res.status(400).json({
                message: "Choose a valid status.",
                success: false,
            });
        }
        const application = await loadOwnedApplication(req, res);
        if (!application) return;

        if (application.status !== status) {
            application.status = status;
            application.history.push({ status, at: new Date() });
            await application.save();
            await touchJob(application.job._id);
        }

        return res.status(200).json({
            message: `Moved to ${status}.`,
            status,
            history: application.history,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error updating application status", error);
    }
};

export const markViewed = async (req, res) => {
    try {
        const application = await loadOwnedApplication(req, res);
        if (!application) return;
        if (application.status === "applied") {
            application.status = "viewed";
            application.history.push({ status: "viewed", at: new Date() });
            await application.save();
            await touchJob(application.job._id);
        }
        return res.status(200).json({ status: application.status, history: application.history, success: true });
    } catch (error) {
        return serverError(res, "Error marking application viewed", error);
    }
};
