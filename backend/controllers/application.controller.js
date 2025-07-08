import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

export const applyJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.id; 

        if(!jobId)
        {
            return res.status(400).json({
                message: "Job ID is required.",
                success: false,
            });
        }

        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if( existingApplication ) {
            return res.status(400).json({   
                message: "You have already applied for this job.",
                success: false,
            });
        }

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false,
            });
        }

        const newApplication = new Application({
            job: jobId,
            applicant: userId,
        });


        await newApplication.save();

        // Add the user to the job's applications
        job.applications.push(newApplication._id);
        await job.save();

        return res.status(200).json({
            message: "Applied successfully.",
            success: true,
        });
    } catch (error) {
        console.error("Error applying for job:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
}
export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'company',
                options:{sort:{createdAt:-1}},
            }
        });
        if(!application){
            return res.status(404).json({
                message:"No Applied Jobs Found.",
                success:false
            })
        };
        return res.status(200).json({
            application,
            success:true
        })
    } catch (error) {
        console.error("Error retrieving applied jobs:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
}

export const getAllApplicants = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({ 
            path: "applications",
            options: {sort: {createdAt:-1}},
            populate: {
                path: "applicant",
            }   
        });
        if(!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false,
            });
        }

        return res.status(200).json({
            job,
            success: true,
        });

    } catch (error) {
        console.error("Error retrieving applicants:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }   
}   

export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const applicationId = req.params.id;

        if (!status) {
            return res.status(400).json({
                message: "Status is required.",
                success: false,
            });
        }

        const application = await Application.findOne({_id:applicationId});

        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
                success: false,
            });
        }

        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message: "Application status updated successfully.",
            success: true,
        });
    } catch (error) {
        console.error("Error updating application status:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
}