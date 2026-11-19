import express from 'express';
import isAuthenticated, { requireRole } from '../middlewares/isAuthenticated.js';
import { registerCompany, getCompany, getCompanyById, updateCompany, getPublicCompany } from '../controllers/company.controller.js';
import { singleUpload } from '../middlewares/multer.js';

const router = express.Router();
const recruiter = [isAuthenticated, requireRole("recruiter")];

router.route("/public/:id").get(getPublicCompany);
router.route("/register").post(...recruiter, registerCompany);
router.route("/get").get(...recruiter, getCompany);
router.route("/get/:id").get(...recruiter, getCompanyById);
router.route("/update/:id").put(...recruiter, singleUpload, updateCompany);

export default router;
