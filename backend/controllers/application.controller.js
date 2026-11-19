import mongoose from "mongoose";
import { Job } from "../models/job.model.js";
import { Application, APPLICATION_STATUSES } from "../models/application.model.js";
import { serverError } from "../utils/http.js";

const APPLICANT_FIELDS = "fullName email phoneNumber profile profileVersion createdAt";

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

        const existing = await Application.findOne({ job: jobId, applicant: req.id });
        if (existing) {
            return res.status(400).json({
                message: "You've already applied to this job.",
                success: false,
            });
        }

        const application = await Application.create({ job: jobId, applicant: req.id });
        await Job.updateOne({ _id: jobId }, { $addToSet: { applications: application._id } });

        return res.status(201).json({
            message: "Application sent.",
            application: { _id: application._id, status: application.status },
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
                select: "title location workMode jobType salary salaryMax company",
                populate: { path: "company", select: "name logo" },
            })
            .lean();
        return res.status(200).json({
            application: application.filter((a) => a.job),
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

export const getAllApplicants = async (req, res) => {
    try {
        const job = await loadOwnedJob(req, res, true);
        if (!job) return;
        return res.status(200).json({
            job,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error retrieving applicants", error);
    }
};

export const updateStatus = async (req, res) => {
    try {
        const raw = String(req.body.status || "").toLowerCase();
        const status = raw === "accepted" ? "offered" : raw;
        if (!APPLICATION_STATUSES.includes(status)) {
            return res.status(400).json({
                message: "Choose a valid status.",
                success: false,
            });
        }
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Application not found.", success: false });
        }

        const application = await Application.findById(req.params.id).populate({ path: "job", select: "createdBy" });
        if (!application || String(application.job?.createdBy) !== String(req.id)) {
            return res.status(404).json({
                message: "Application not found.",
                success: false,
            });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            message: `Marked as ${status}.`,
            status,
            success: true,
        });
    } catch (error) {
        return serverError(res, "Error updating application status", error);
    }
};
