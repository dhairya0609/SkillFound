import express from "express";
import isAuthenticated, { requireRole } from "../middlewares/isAuthenticated.js";
import {
  createAlert, deleteAlert, listAlerts, listSaved, listSavedIds, markAlertSeen, saveJob, unsaveJob,
} from "../controllers/candidate.controller.js";

const router = express.Router();
router.use(isAuthenticated, requireRole("student"));

router.get("/saved", listSaved);
router.get("/saved/ids", listSavedIds);
router.put("/saved/:jobId", saveJob);
router.delete("/saved/:jobId", unsaveJob);

router.get("/alerts", listAlerts);
router.post("/alerts", createAlert);
router.delete("/alerts/:id", deleteAlert);
router.post("/alerts/:id/seen", markAlertSeen);

export default router;
