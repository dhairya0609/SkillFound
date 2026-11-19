import express from "express";
import isAuthenticated, { optionalAuth, requireRole } from "../middlewares/isAuthenticated.js";
import { resumeUpload } from "../middlewares/multer.js";
import {
  aiHealth,
  aiSearch,
  aiStatus,
  draftJobDescription,
  matchJobs,
  rankJobApplicants,
  resumeAutofill,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/status", aiStatus);
router.get("/health", aiHealth);
router.post("/search", optionalAuth, aiSearch);
router.post("/match", isAuthenticated, requireRole("student"), matchJobs);
router.post("/resume", isAuthenticated, requireRole("student"), resumeUpload, resumeAutofill);
router.post("/job-description", isAuthenticated, requireRole("recruiter"), draftJobDescription);
router.post("/jobs/:id/rank", isAuthenticated, requireRole("recruiter"), rankJobApplicants);

export default router;
