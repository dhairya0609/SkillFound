import mongoose from "mongoose";
import { Company } from "../models/company.model.js";
import { Job, liveJobFilter } from "../models/job.model.js";
import { uploadFile, StorageUnavailableError } from "../utils/storage.js";
import { escapeRegex, serverError } from "../utils/http.js";

const DEMO_COMPANY_CAP = 15;
const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

const notFound = (res) => res.status(404).json({ message: "Company not found.", success: false });

const loadOwnedCompany = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    notFound(res);
    return null;
  }
  const company = await Company.findById(req.params.id);
  if (!company || String(company.userId) !== String(req.id)) {
    notFound(res);
    return null;
  }
  return company;
};

export const registerCompany = async (req, res) => {
  try {
    const companyName = String(req.body.companyName || "").trim().slice(0, 80);
    if (!companyName) {
      return res.status(400).json({
        message: "Company name is required.",
        success: false,
      });
    }
    if (req.user?.isDemo && (await Company.countDocuments({ userId: req.id, isSeed: false })) >= DEMO_COMPANY_CAP) {
      return res.status(403).json({
        message: "The demo account has reached its company limit. Sign up to create more.",
        success: false,
      });
    }
    const exists = await Company.exists({ name: new RegExp(`^${escapeRegex(companyName)}$`, "i") });
    if (exists) {
      return res.status(400).json({
        message: "A company with this name already exists.",
        success: false,
      });
    }
    const company = await Company.create({
      name: companyName,
      userId: req.id,
    });

    return res.status(201).json({
      message: "Company created. Add a few details next.",
      company,
      success: true,
    });
  } catch (error) {
    return serverError(res, "Company registration error", error);
  }
};

export const getCompany = async (req, res) => {
  try {
    const companies = await Company.find({ userId: req.id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      companies,
      success: true,
    });
  } catch (error) {
    return serverError(res, "Error retrieving companies", error);
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await loadOwnedCompany(req, res);
    if (!company) return;
    return res.status(200).json({
      company,
      success: true,
    });
  } catch (error) {
    return serverError(res, "Error retrieving company", error);
  }
};

export const updateCompany = async (req, res) => {
  try {
    const company = await loadOwnedCompany(req, res);
    if (!company) return;
    if (company.isSeed && req.user?.isDemo) {
      return res.status(403).json({
        message: "Sample companies are read-only in the demo. Create your own company to try editing.",
        success: false,
      });
    }

    const { name, description, website, location, tagline, industry, size, founded, locations } = req.body;
    if (name !== undefined) {
      const nextName = String(name).trim().slice(0, 80);
      if (!nextName) {
        return res.status(400).json({ message: "Company name can't be empty.", success: false });
      }
      if (nextName.toLowerCase() !== company.name.toLowerCase()) {
        const taken = await Company.exists({ name: new RegExp(`^${escapeRegex(nextName)}$`, "i") });
        if (taken) {
          return res.status(400).json({ message: "A company with this name already exists.", success: false });
        }
      }
      company.name = nextName;
    }
    if (description !== undefined) company.description = String(description).slice(0, 2000);
    if (location !== undefined) company.location = String(location).slice(0, 80);
    if (tagline !== undefined) company.tagline = String(tagline).slice(0, 140);
    if (industry !== undefined) company.industry = String(industry).slice(0, 60);
    if (size !== undefined) company.size = COMPANY_SIZES.includes(size) ? size : "";
    if (locations !== undefined) {
      company.locations = String(locations).split(",").map((l) => l.trim().slice(0, 60)).filter(Boolean).slice(0, 10);
    }
    if (founded !== undefined && founded !== "") {
      const year = Number(founded);
      if (!Number.isInteger(year) || year < 1800 || year > new Date().getFullYear()) {
        return res.status(400).json({ message: "Founded year looks invalid.", success: false });
      }
      company.founded = year;
    }
    if (website !== undefined) {
      const site = String(website).trim();
      if (site && !/^https?:\/\//i.test(site)) {
        return res.status(400).json({ message: "Website should start with http:// or https://", success: false });
      }
      company.website = site;
    }

    const logoFile = req.files?.file?.[0];
    if (logoFile) {
      company.logo = await uploadFile(logoFile);
    }

    await company.save();

    return res.status(200).json({
      message: "Company updated.",
      company,
      success: true,
    });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return res.status(503).json({ message: error.message, success: false });
    }
    return serverError(res, "Error updating company", error);
  }
};

const PUBLIC_FIELDS = "name logo location website description tagline industry size founded locations verified isSeed";

export const getPublicCompany = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    const company = await Company.findById(req.params.id, PUBLIC_FIELDS).lean();
    if (!company) return notFound(res);
    const jobs = await Job.find({ ...liveJobFilter(), company: company._id })
      .select("-description -responsibilities -qualifications -benefits")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({
      company,
      jobs: jobs.map(({ applications = [], ...job }) => ({ ...job, company, applicantCount: applications.length })),
      success: true,
    });
  } catch (error) {
    return serverError(res, "Error retrieving company", error);
  }
};
