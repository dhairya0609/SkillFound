import express from 'express';
import isAuthenticated, { optionalAuth, requireRole } from '../middlewares/isAuthenticated.js';
import {
    postJob, getAllJobs, getJobForAdmin, getJobById, getJobFacets, getJobOverview,
    getSimilarJobs, updateJobStatus, reportJob,
} from '../controllers/job.controller.js';

const router = express.Router();
const recruiter = [isAuthenticated, requireRole("recruiter")];

router.route("/post").post(...recruiter, postJob);
router.route("/get").get(optionalAuth, getAllJobs);
router.route("/facets").get(getJobFacets);
router.route("/overview").get(getJobOverview);
router.route("/getadminjobs").get(...recruiter, getJobForAdmin);
router.route("/get/:id").get(optionalAuth, getJobById);
router.route("/:id/similar").get(getSimilarJobs);
router.route("/:id/status").post(...recruiter, updateJobStatus);
router.route("/:id/report").post(optionalAuth, reportJob);

export default router;
