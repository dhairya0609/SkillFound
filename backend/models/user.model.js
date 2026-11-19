import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'recruiter'],
        required: true,
    },
    isDemo: {
        type: Boolean,
        default: false,
    },
    isSeed: {
        type: Boolean,
        default: false,
    },
    profileVersion: {
        type: Number,
        default: 1,
    },
    profile: {
        headline: {type: String, default: ""},
        bio: {type: String},
        skills: [{type: String}],
        experienceSummary: {type: String, default: ""},
        yearsOfExperience: {type: Number, min: 0, max: 50},
        location: {type: String, default: ""},
        resume: {type: String},
        resumeOriginalName: {type: String},
        company: {type: mongoose.Schema.Types.ObjectId, ref: 'Company'},
        profilePhoto: {
            type: String,
            default: ""
        },
    }
}, { timestamps: true });

userSchema.methods.toPublic = function toPublic() {
    return {
        _id: this._id,
        fullName: this.fullName,
        email: this.email,
        phoneNumber: this.phoneNumber,
        role: this.role,
        isDemo: this.isDemo,
        profileVersion: this.profileVersion,
        profile: this.profile,
    };
};

export const User = mongoose.model('User', userSchema);
