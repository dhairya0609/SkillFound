import express from 'express';
import isAuthenticated, { optionalAuth, requireRole } from '../middlewares/isAuthenticated.js';
import { postJob, getAllJobs, getJobForAdmin, getJobById, getJobFacets, getJobOverview } from '../controllers/job.controller.js';

const router = express.Router();

router.route("/post").post(isAuthenticated, requireRole("recruiter"), postJob);
router.route("/get").get(getAllJobs);
router.route("/facets").get(getJobFacets);
router.route("/overview").get(getJobOverview);
router.route("/getadminjobs").get(isAuthenticated, requireRole("recruiter"), getJobForAdmin);
router.route("/get/:id").get(optionalAuth, getJobById);

export default router;
