import mongoose from "mongoose";

const matchScoreSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    profileVersion: { type: Number, required: true },
    score: { type: Number, min: 0, max: 100, required: true },
    reasons: [{ type: String }],
    missingSkills: [{ type: String }],
    model: { type: String },
}, { timestamps: true });

matchScoreSchema.index({ user: 1, job: 1, profileVersion: 1 }, { unique: true });

export const MatchScore = mongoose.model("MatchScore", matchScoreSchema);
