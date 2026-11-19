import mongoose from "mongoose";

const jobAlertSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true, maxlength: 120 },
    query: { type: String, required: true, maxlength: 1000 },
    lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

jobAlertSchema.index({ user: 1, query: 1 }, { unique: true });

export const JobAlert = mongoose.model("JobAlert", jobAlertSchema);
