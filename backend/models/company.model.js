import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: {
        type: String,
    },
    website: {
        type: String
    },
    location: {
        type: String,
    },
    logo: {
        type: String,
    },
    tagline: { type: String },
    industry: { type: String },
    size: { type: String },
    founded: { type: Number },
    locations: [{ type: String }],
    verified: { type: Boolean, default: false },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isSeed: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

export const Company = mongoose.model('Company', companySchema);
