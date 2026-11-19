import mongoose from "mongoose";

export const REPORT_REASONS = ["scam", "fake", "closed", "misleading", "discriminatory", "other"];

const jobReportSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    reporterKey: { type: String, required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, maxlength: 1000 },
}, { timestamps: true });

jobReportSchema.index({ job: 1, reporterKey: 1 }, { unique: true });

export const JobReport = mongoose.model("JobReport", jobReportSchema);
