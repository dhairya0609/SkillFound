import mongoose from "mongoose";

export const APPLICATION_STATUSES = ['applied', 'viewed', 'shortlisted', 'interview', 'offered', 'rejected'];
export const CONTACTABLE_STATUSES = ['shortlisted', 'interview', 'offered'];

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:APPLICATION_STATUSES,
        default:'applied'
    },
    history: [{
        _id: false,
        status: { type: String, enum: APPLICATION_STATUSES },
        at: { type: Date, default: Date.now },
    }],
},{timestamps : true});

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export const Application  = mongoose.model("Application", applicationSchema);
