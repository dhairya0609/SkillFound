import mongoose from "mongoose";

export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
export const WORK_MODES = ["Remote", "Hybrid", "On-site"];
export const JOB_LIFETIME_DAYS = 30;

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    requirements: [{
        type: String
    }],
    responsibilities: [{ type: String }],
    qualifications: [{ type: String }],
    benefits: [{ type: String }],
    salary: {
        type: Number,
        required: true,
        min: 0
    },
    salaryMax: {
        type: Number,
        min: 0,
    },
    experienceLevel: {
        type: Number,
        required: true,
        min: 0,
    },
    location: {
        type: String,
        required: true,
    },
    workMode: {
        type: String,
        enum: WORK_MODES,
        default: "On-site",
    },
    jobType: {
        type: String,
        required: true,
    },
    position: {
        type: Number,
        required: true,
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }],
    status: {
        type: String,
        enum: ["open", "closed"],
        default: "open",
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + JOB_LIFETIME_DAYS * 24 * 60 * 60 * 1000),
    },
    lastActivityAt: {
        type: Date,
    },
    isSeed: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const liveJobFilter = () => ({
    status: { $ne: "closed" },
    $nor: [{ expiresAt: { $lte: new Date() } }],
});

jobSchema.index(
    { title: "text", requirements: "text", description: "text", location: "text" },
    { weights: { title: 8, requirements: 5, location: 3, description: 1 }, name: "job_text" }
);
jobSchema.index({ createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);
