import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

process.env.SECRET_KEY ||= "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/skillfound_test";
delete process.env.GEMINI_API_KEY;

const mongoose = (await import("mongoose")).default;
const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let server;
let base;
let ready = false;
let Job;
let MatchScore;
let User;

before(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    await mongoose.connection.db.dropDatabase();
    const seed = spawnSync(process.execPath, ["scripts/seed.js"], { cwd: backendDir, env: { ...process.env }, encoding: "utf8" });
    assert.equal(seed.status, 0, seed.stderr);
    const app = (await import("../app.js")).default;
    ({ Job } = await import("../models/job.model.js"));
    ({ MatchScore } = await import("../models/matchScore.model.js"));
    ({ User } = await import("../models/user.model.js"));
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    ready = true;
  } catch (error) {
    console.warn(`Skipping product tests: ${error.message}`);
  }
});

after(async () => {
  server?.close();
  if (ready) await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

const api = async (method, url, { token, body } = {}) => {
  const headers = { "X-Requested-With": "test" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${base}${url}`, { method, headers, body: body && JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
};
const demo = async (role) => (await api("POST", "/user/demo", { body: { role } })).data.token;
const signup = async (role, email) => {
  await api("POST", "/user/register", {
    body: { fullName: "Test Person", email, phoneNumber: "9111111111", password: "secret123", role },
  });
  return (await api("POST", "/user/login", { body: { email, password: "secret123" } })).data.token;
};
const jobByTitle = async (title) => (await Job.findOne({ title }).lean());

test("saved jobs: save, list, ids, unsave; recruiters and guests can't", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const candidate = await signup("student", "saver@example.com");
  const job = await jobByTitle("Data Engineer");

  assert.equal((await api("PUT", `/me/saved/${job._id}`, { token: candidate })).status, 200);
  assert.equal((await api("PUT", `/me/saved/${job._id}`, { token: candidate })).status, 200);
  const ids = await api("GET", "/me/saved/ids", { token: candidate });
  assert.deepEqual(ids.data.ids, [String(job._id)]);
  const list = await api("GET", "/me/saved", { token: candidate });
  assert.equal(list.data.saved[0].job.title, "Data Engineer");
  assert.equal(list.data.saved[0].job.accepting, true);
  assert.equal((await api("DELETE", `/me/saved/${job._id}`, { token: candidate })).status, 200);
  assert.equal((await api("GET", "/me/saved/ids", { token: candidate })).data.ids.length, 0);

  assert.equal((await api("PUT", `/me/saved/${job._id}`)).status, 401);
  assert.equal((await api("PUT", `/me/saved/${job._id}`, { token: await demo("recruiter") })).status, 403);
});

test("alerts store a canonical query, count new matches and respect the cap", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const candidate = await signup("student", "alerts@example.com");
  const created = await api("POST", "/me/alerts", {
    token: candidate,
    body: { query: "workModes=Remote&bogus=1&skills=Python&$where=x", label: "Remote Python" },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.alert.query, "skills=Python&workModes=Remote");

  const dup = await api("POST", "/me/alerts", { token: candidate, body: { query: "skills=Python&workModes=Remote" } });
  assert.equal(dup.status, 200);

  const empty = await api("POST", "/me/alerts", { token: candidate, body: { query: "bogus=1" } });
  assert.equal(empty.status, 400);

  const list = await api("GET", "/me/alerts", { token: candidate });
  assert.equal(list.data.alerts.length, 1);
  const alert = list.data.alerts[0];
  const matching = await api("GET", "/job/get?skills=Python&workModes=Remote&limit=1");
  assert.equal(alert.total, matching.data.total);
  assert.equal(alert.newCount, 0);

  await Job.updateOne({ title: "Generative AI Engineer" }, { $set: { createdAt: new Date() } }, { timestamps: false, overwriteImmutable: true });
  const afterNew = await api("GET", "/me/alerts", { token: candidate });
  assert.equal(afterNew.data.alerts[0].newCount, 1);
  await api("POST", `/me/alerts/${alert._id}/seen`, { token: candidate });
  assert.equal((await api("GET", "/me/alerts", { token: candidate })).data.alerts[0].newCount, 0);

  for (let i = 0; i < 9; i += 1) {
    await api("POST", "/me/alerts", { token: candidate, body: { query: `minSalary=${i + 1}` } });
  }
  const over = await api("POST", "/me/alerts", { token: candidate, body: { query: "minSalary=99" } });
  assert.equal(over.status, 400);
  assert.equal((await api("DELETE", `/me/alerts/${alert._id}`, { token: candidate })).status, 200);
});

test("reporting a job validates the reason and is idempotent per reporter", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const job = await jobByTitle("Python Developer");
  assert.equal((await api("POST", `/job/${job._id}/report`, { body: { reason: "nope" } })).status, 400);
  assert.equal((await api("POST", `/job/${job._id}/report`, { body: { reason: "scam", details: "asked for a fee" } })).status, 201);
  assert.equal((await api("POST", `/job/${job._id}/report`, { body: { reason: "fake" } })).status, 201);
  const { JobReport } = await import("../models/jobReport.model.js");
  assert.equal(await JobReport.countDocuments({ job: job._id }), 1);
});

test("application timeline: apply, viewed, shortlisted; phone hidden until shortlisted", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const candidate = await signup("student", "timeline@example.com");
  const recruiter = await demo("recruiter");
  const job = await jobByTitle("Data Science Intern");

  const applied = await api("POST", `/application/apply/${job._id}`, { token: candidate });
  assert.equal(applied.status, 201);
  assert.deepEqual(applied.data.application.history.map((h) => h.status), ["applied"]);

  const list = await api("GET", `/application/${job._id}/applicants`, { token: recruiter });
  const mine = list.data.job.applications.find((a) => a.applicant.email === "timeline@example.com");
  assert.equal(mine.applicant.phoneNumber, null);
  assert.equal(mine.contactHidden, true);

  const viewed = await api("POST", `/application/${mine._id}/view`, { token: recruiter });
  assert.equal(viewed.data.status, "viewed");
  const viewedAgain = await api("POST", `/application/${mine._id}/view`, { token: recruiter });
  assert.equal(viewedAgain.data.history.length, 2);

  await api("POST", `/application/status/${mine._id}/update`, { token: recruiter, body: { status: "shortlisted" } });
  const after = await api("GET", `/application/${job._id}/applicants`, { token: recruiter });
  const shortlisted = after.data.job.applications.find((a) => a._id === mine._id);
  assert.equal(shortlisted.applicant.phoneNumber, "9111111111");

  const mineAsCandidate = await api("GET", "/application/get", { token: candidate });
  assert.deepEqual(mineAsCandidate.data.application[0].history.map((h) => h.status), ["applied", "viewed", "shortlisted"]);
  const touched = await jobByTitle("Data Science Intern");
  assert.ok(Date.now() - new Date(touched.lastActivityAt).getTime() < 60000);

  assert.equal((await api("POST", `/application/${mine._id}/view`, { token: await demo("student") })).status, 403);
});

test("closed and expired jobs leave search but stay viewable, and can't be applied to", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const recruiter = await signup("recruiter", "closer@example.com");
  const company = await api("POST", "/company/register", { token: recruiter, body: { companyName: "Closer Labs" } });
  const posted = await api("POST", "/job/post", {
    token: recruiter,
    body: {
      title: "Closable Role", description: "About", requirements: "Go", salary: 10, salaryMax: 12, location: "Pune",
      jobType: "Full-time", experience: 1, position: 1, companyId: company.data.company._id,
      responsibilities: "• Build things\n• Ship things", benefits: "Insurance",
    },
  });
  assert.equal(posted.status, 201);
  assert.deepEqual(posted.data.job.responsibilities, ["Build things", "Ship things"]);
  const id = posted.data.job._id;
  const visible = async () => (await api("GET", "/job/get?q=Closable&limit=5")).data.total;
  const overviewTotal = async () => (await api("GET", "/job/overview")).data.stats.openRoles;

  assert.equal(await visible(), 1);
  const before = await overviewTotal();
  await api("POST", `/job/${id}/status`, { token: recruiter, body: { action: "close" } });
  assert.equal(await visible(), 0);
  assert.equal(await overviewTotal(), before - 1);
  const detail = await api("GET", `/job/get/${id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.job.accepting, false);
  const candidate = await signup("student", "late@example.com");
  assert.equal((await api("POST", `/application/apply/${id}`, { token: candidate })).status, 400);

  await api("POST", `/job/${id}/status`, { token: recruiter, body: { action: "reopen" } });
  assert.equal(await visible(), 1);

  await Job.updateOne({ _id: id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await visible(), 0);
  const admin = await api("GET", "/job/getadminjobs", { token: recruiter });
  assert.equal(admin.data.jobs.find((j) => j._id === id).accepting, false);
  await api("POST", `/job/${id}/status`, { token: recruiter, body: { action: "extend" } });
  assert.equal(await visible(), 1);

  const seeded = await jobByTitle("Data Analyst");
  const demoRecruiter = await demo("recruiter");
  assert.equal((await api("POST", `/job/${seeded._id}/status`, { token: demoRecruiter, body: { action: "close" } })).status, 403);
  assert.equal((await api("POST", `/job/${seeded._id}/status`, { token: recruiter, body: { action: "close" } })).status, 404);
});

test("recruiter dashboard reports per-stage pipeline counts", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const recruiter = await demo("recruiter");
  const { data } = await api("GET", "/job/getadminjobs", { token: recruiter });
  const fe = data.jobs.find((j) => j.title === "Frontend Engineer (React)");
  const sum = Object.values(fe.pipeline).reduce((a, b) => a + b, 0);
  assert.equal(sum, fe.applicantCount);
  assert.equal(fe.pipeline.interview, 1);
  assert.equal(fe.pipeline.rejected, 1);
});

test("postedWithin, salary and match sorts", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const recent = await api("GET", "/job/get?postedWithin=1&limit=50");
  assert.ok(recent.data.jobs.every((j) => Date.now() - new Date(j.createdAt).getTime() <= 24 * 3600 * 1000));
  assert.ok(recent.data.total < (await api("GET", "/job/get?limit=1")).data.total);

  const bySalary = (await api("GET", "/job/get?sort=salary&limit=5")).data.jobs;
  const tops = bySalary.map((j) => j.salaryMax ?? j.salary);
  assert.deepEqual(tops, [...tops].sort((a, b) => b - a));
  assert.equal(bySalary[0].description, undefined);

  const candidate = await demo("student");
  const user = await User.findOne({ isDemo: true, role: "student" }).lean();
  const target = await jobByTitle("Clinical Data Analyst");
  await MatchScore.create({ user: user._id, job: target._id, profileVersion: user.profileVersion, score: 99, reasons: [], missingSkills: [] });
  const byMatch = await api("GET", "/job/get?sort=match&limit=3", { token: candidate });
  assert.equal(byMatch.data.jobs[0].title, "Clinical Data Analyst");
  const anon = await api("GET", "/job/get?sort=match&limit=3");
  assert.equal(anon.status, 200);
});

test("re-running the seed refreshes posting dates", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  await Job.updateOne({ title: "Data Engineer" }, { $set: { createdAt: new Date("2020-01-01") } }, { timestamps: false, overwriteImmutable: true });
  const seed = spawnSync(process.execPath, ["scripts/seed.js"], { cwd: backendDir, env: { ...process.env }, encoding: "utf8" });
  assert.equal(seed.status, 0, seed.stderr);
  const job = await jobByTitle("Data Engineer");
  assert.ok(Date.now() - new Date(job.createdAt).getTime() < 10 * 24 * 3600 * 1000, `createdAt ${job.createdAt} seed: ${seed.stdout} ${seed.stderr}`);
});

test("similar jobs exclude the job itself; company pages list live roles", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const job = await jobByTitle("Frontend Engineer (React)");
  const similar = await api("GET", `/job/${job._id}/similar`);
  assert.ok(similar.data.jobs.length > 0 && similar.data.jobs.length <= 4);
  assert.ok(similar.data.jobs.every((j) => j._id !== String(job._id)));

  const company = await api("GET", `/company/public/${job.company}`);
  assert.equal(company.data.company.verified, true);
  assert.ok(company.data.company.size);
  assert.ok(company.data.jobs.some((j) => j.title === "Frontend Engineer (React)"));
  assert.equal(company.data.company.userId, undefined);
  assert.equal((await api("GET", "/company/public/000000000000000000000000")).status, 404);
});
