import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import "../config/env.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { QUALIFICATIONS, applications, candidates, companies, jobs, recruiters } from "./data/seedData.js";
import { SavedJob } from "../models/savedJob.model.js";
import { JobAlert } from "../models/jobAlert.model.js";
import { JOB_LIFETIME_DAYS } from "../models/job.model.js";

const DAY = 24 * 60 * 60 * 1000;
const resetDemo = process.argv.includes("--reset-demo");

const STATUS_PATHS = {
  applied: ["applied"],
  viewed: ["applied", "viewed"],
  shortlisted: ["applied", "viewed", "shortlisted"],
  interview: ["applied", "viewed", "shortlisted", "interview"],
  offered: ["applied", "viewed", "shortlisted", "interview", "offered"],
  rejected: ["applied", "viewed", "rejected"],
};

const DEMO_SAVED = ["Frontend Developer (React), New Grad", "Generative AI Engineer", "Product Designer"];
const DEMO_ALERT = { label: "Remote · React", query: "skills=React&workModes=Remote" };

const logoSvg = ({ initials, colors: [from, to] }) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#g)"/><text x="48" y="50" dy=".35em" text-anchor="middle" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="36" font-weight="700" fill="#fff" letter-spacing="-1">${initials}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

// Seeded profiles get a small hash-based version; user edits use Date.now(),
// so a re-seed never reuses a version that a visitor's edit already cached against.
const profileVersionFor = (profile) =>
  Number.parseInt(crypto.createHash("sha1").update(JSON.stringify(profile)).digest("hex").slice(0, 8), 16);

// Mongoose drops createdAt from upserts after the first insert, so the
// seed's relative dates are written with a separate, non-upsert update.
const refreshDates = (Model, _id, createdAt, updatedAt) =>
  Model.updateOne({ _id }, { $set: { createdAt, updatedAt } }, { timestamps: false, overwriteImmutable: true });

const unusablePassword = () => bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

const upsertUser = async (spec, role) => {
  const existing = await User.findOne({ email: spec.email });
  const fields = {
    fullName: spec.fullName,
    phoneNumber: spec.phoneNumber,
    role,
    isDemo: Boolean(spec.isDemo),
    isSeed: true,
    profileVersion: profileVersionFor(spec.profile),
    "profile.headline": spec.profile.headline || "",
    "profile.bio": spec.profile.bio || "",
    "profile.skills": spec.profile.skills || [],
    "profile.experienceSummary": spec.profile.experienceSummary || "",
    "profile.yearsOfExperience": spec.profile.yearsOfExperience,
    "profile.location": spec.profile.location || "",
  };
  if (existing) {
    if (!existing.isSeed) {
      throw new Error(`Refusing to overwrite non-seed user ${spec.email}`);
    }
    await User.updateOne({ _id: existing._id }, { $set: fields });
    return existing._id;
  }
  const created = await User.create({
    email: spec.email,
    password: await unusablePassword(),
    fullName: spec.fullName,
    phoneNumber: spec.phoneNumber,
    role,
  });
  await User.updateOne({ _id: created._id }, { $set: fields });
  return created._id;
};

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.init(), Company.init(), Job.init(), Application.init()]);
  const now = Date.now();

  const userIds = {};
  for (const r of recruiters) userIds[r.key] = await upsertUser(r, "recruiter");
  for (const c of candidates) userIds[c.key] = await upsertUser(c, "student");

  const companyIds = {};
  for (const c of companies) {
    const existing = await Company.findOne({ name: c.name });
    if (existing && !existing.isSeed) throw new Error(`Refusing to overwrite non-seed company ${c.name}`);
    const doc = await Company.findOneAndUpdate(
      { name: c.name },
      {
        $set: {
          name: c.name,
          description: c.description,
          website: c.website,
          location: c.location,
          tagline: c.tagline,
          industry: c.industry,
          size: c.size,
          founded: c.founded,
          locations: c.locations,
          verified: Boolean(c.verified),
          logo: logoSvg(c),
          userId: userIds[c.owner],
          isSeed: true,
        },
      },
      { upsert: true, new: true }
    );
    companyIds[c.name] = doc._id;
  }

  const jobIds = {};
  for (const j of jobs) {
    const { company, daysAgo, ...fields } = j;
    const companySpec = companies.find((c) => c.name === company);
    const owner = companySpec.owner;
    const postedAt = new Date(now - daysAgo * DAY - (j.title.length % 7) * 60 * 60 * 1000);
    const doc = await Job.findOneAndUpdate(
      { company: companyIds[company], title: j.title, isSeed: true },
      {
        $set: {
          ...fields,
          qualifications: QUALIFICATIONS[j.title] || [],
          benefits: companySpec.benefits || [],
          status: "open",
          expiresAt: new Date(postedAt.getTime() + JOB_LIFETIME_DAYS * DAY),
          lastActivityAt: postedAt,
          company: companyIds[company],
          createdBy: userIds[owner],
          isSeed: true,
          createdAt: postedAt,
          updatedAt: postedAt,
        },
      },
      { upsert: true, new: true, timestamps: false }
    );
    await refreshDates(Job, doc._id, postedAt, postedAt);
    jobIds[j.title] = doc._id;
  }

  const staleJobs = await Job.find({ isSeed: true, _id: { $nin: Object.values(jobIds) } }, "_id");
  if (staleJobs.length) {
    await Application.deleteMany({ job: { $in: staleJobs.map((j) => j._id) } });
    await Job.deleteMany({ _id: { $in: staleJobs.map((j) => j._id) } });
  }

  const lastEmployerAction = new Map();
  for (const [title, who, status, daysAfterPost] of applications) {
    const job = jobs.find((j) => j.title === title);
    const appliedAt = new Date(now - Math.max(0, job.daysAgo - daysAfterPost) * DAY + 2 * 60 * 60 * 1000);
    const path = STATUS_PATHS[status];
    const span = Math.max(0, now - 3 * 60 * 60 * 1000 - appliedAt.getTime());
    const step = path.length > 1 ? Math.min(2 * DAY, span / (path.length - 1)) : 0;
    const history = path.map((s, i) => ({ status: s, at: new Date(appliedAt.getTime() + i * step) }));
    const updatedAt = history[history.length - 1].at;
    if (path.length > 1) {
      const key = String(jobIds[title]);
      if (!lastEmployerAction.has(key) || lastEmployerAction.get(key) < updatedAt) lastEmployerAction.set(key, updatedAt);
    }
    const app = await Application.findOneAndUpdate(
      { job: jobIds[title], applicant: userIds[who] },
      { $set: { status, history } },
      { upsert: true, new: true, timestamps: false }
    );
    await refreshDates(Application, app._id, appliedAt, updatedAt);
  }
  for (const [jobId, at] of lastEmployerAction) {
    await Job.updateOne({ _id: jobId }, { $set: { lastActivityAt: at } }, { timestamps: false });
  }

  for (const title of DEMO_SAVED) {
    await SavedJob.updateOne(
      { user: userIds.demoCandidate, job: jobIds[title] },
      { $setOnInsert: { user: userIds.demoCandidate, job: jobIds[title] } },
      { upsert: true }
    );
  }
  await JobAlert.updateOne(
    { user: userIds.demoCandidate, query: DEMO_ALERT.query },
    { $setOnInsert: { label: DEMO_ALERT.label, lastSeenAt: new Date(now - 4 * DAY) } },
    { upsert: true }
  );

  if (resetDemo) {
    const demoIds = [userIds.demoRecruiter, userIds.demoCandidate];
    const demoJobs = await Job.find({ createdBy: { $in: demoIds }, isSeed: false }, "_id");
    const demoJobIds = demoJobs.map((j) => j._id);
    const seededPairs = new Set(applications.map(([title, who]) => `${jobIds[title]}:${userIds[who]}`));
    const demoApps = await Application.find({ applicant: userIds.demoCandidate }, "job applicant");
    const strayApps = demoApps.filter((a) => !seededPairs.has(`${a.job}:${a.applicant}`)).map((a) => a._id);
    await Application.deleteMany({ $or: [{ job: { $in: demoJobIds } }, { _id: { $in: strayApps } }] });
    if (strayApps.length) await Job.updateMany({ applications: { $in: strayApps } }, { $pull: { applications: { $in: strayApps } } }, { timestamps: false });
    await Job.deleteMany({ _id: { $in: demoJobIds } });
    await Company.deleteMany({ userId: { $in: demoIds }, isSeed: false });
    const keepSaved = DEMO_SAVED.map((t) => jobIds[t]);
    await SavedJob.deleteMany({ user: userIds.demoCandidate, job: { $nin: keepSaved } });
    await JobAlert.deleteMany({ user: userIds.demoCandidate, query: { $ne: DEMO_ALERT.query } });
    await User.updateOne({ _id: userIds.demoCandidate }, { $unset: { "profile.resume": "", "profile.resumeOriginalName": "" } });
    console.log(`Reset demo: removed ${demoJobIds.length} jobs and ${strayApps.length} applications created by demo users`);
  }

  const seededJobIds = Object.values(jobIds);
  for (const _id of seededJobIds) {
    const appIds = await Application.find({ job: _id }).distinct("_id");
    await Job.updateOne({ _id }, { $set: { applications: appIds } }, { timestamps: false });
  }

  const counts = {
    companies: await Company.countDocuments({ isSeed: true }),
    jobs: await Job.countDocuments({ isSeed: true }),
    applications: await Application.countDocuments({ job: { $in: seededJobIds } }),
    demoUsers: await User.countDocuments({ isDemo: true }),
  };
  console.log("Seed complete:", counts);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
