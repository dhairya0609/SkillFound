import express from 'express';
import isAuthenticated, { requireRole } from '../middlewares/isAuthenticated.js';
import { applyJob, getAppliedJobs, getAllApplicants, updateStatus, markViewed } from '../controllers/application.controller.js';

const router = express.Router();
const recruiter = [isAuthenticated, requireRole("recruiter")];
const student = [isAuthenticated, requireRole("student")];

router.route("/apply/:id").post(...student, applyJob);
router.route("/get").get(...student, getAppliedJobs);
router.route("/:id/applicants").get(...recruiter, getAllApplicants);
router.route("/status/:id/update").post(...recruiter, updateStatus);
router.route("/:id/view").post(...recruiter, markViewed);

export default router;
