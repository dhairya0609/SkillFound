import { Job } from "../models/job.model.js";

export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if(!title || !description || !requirements || !salary || !location || !jobType || !experience || !position || !companyId) {
            return res.status(400).json({
                message: "Please provide all required fields.",
                success: false,
            });
        }

        const job = await Job.create({
            title,
            description,
            requirements: requirements.split(","),
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experience,
            position,
            company: companyId,
            createdBy: userId,
        });

        return res.status(201).json({
            message: "Job posted successfully.",
            job,
            success: true,
        });
    } catch (error) {
        console.error("Job posting error:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
};
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || ""; 
        const query = {
            $or : [
                { title: { $regex: keyword, $options: "i" } }, 
                { description: { $regex: keyword, $options: "i" } }
            ]
        }
        const jobs = await Job.find(query).populate({
            path: "company",
        }).sort({ createdAt: -1 });
        if (!jobs) {
            return res.status(404).json({
                message: "No jobs found.",
                success: false,
            });
        }
        return res.status(200).json({
            jobs,
            success: true,
        });
    } catch (error) {
        console.error("Error retrieving jobs:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
};
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:"applications"
        });
        if (!job) {
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
        console.error("Error retrieving job:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
};
export const getJobForAdmin = async (req, res) => {
    try {
        const adminId = req.id;
        const jobs = await Job.find({createdBy: adminId}).populate({
            path:'company',
            createdAt:-1
        });
        if (!jobs) {
            return res.status(404).json({
                message: "No jobs found.",
                success: false,
            });
        }
        return res.status(200).json({
            jobs,
            success: true,
        });
    } catch (error) {
        console.error("Error retrieving jobs for admin:", error);
        return res.status(500).json({
            message: "Something went wrong. Please try again.",
            success: false,
        });
    }
}