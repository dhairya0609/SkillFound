// Live check of every AI feature. Uses real Gemini quota (about 6 requests).
//
//   Local:    GEMINI_API_KEY=... MONGO_URI=... node scripts/ai-smoke.js
//   Deployed: node scripts/ai-smoke.js --url https://skillfound-jobs-api.onrender.com
//
// The deployed mode needs no secrets: it signs in through the demo accounts.

const urlFlag = process.argv.indexOf("--url");
const baseUrl = urlFlag > -1 ? process.argv[urlFlag + 1]?.replace(/\/$/, "") : null;

const results = [];
const check = async (name, fn) => {
  const started = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name} (${Date.now() - started}ms)${detail ? `  ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name} (${Date.now() - started}ms)  ${error.message}`);
  }
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const samplePdf = () => {
  const lines = [
    "Ishita Verma - Frontend Developer",
    "Pune, India",
    "",
    "Summary",
    "Frontend developer with 2 years of experience building React and TypeScript web apps.",
    "",
    "Experience",
    "Frontend Developer, Brightleaf Software (2024 - present)",
    "- Built a React + TypeScript analytics dashboard used by 200 clinics",
    "- Wrote Jest and Playwright tests; cut regressions by half",
    "Intern, Pixelnest Labs (2023)",
    "- Built landing pages with Next.js and Tailwind CSS",
    "",
    "Skills",
    "React, TypeScript, JavaScript, Next.js, Tailwind CSS, Redux, Jest, Playwright, Git, REST APIs",
    "",
    "Education",
    "B.E. Computer Engineering, 2023",
  ];
  const esc = (s) => s.replace(/[\\()]/g, (m) => `\\${m}`);
  const stream = ["BT", "/F1 11 Tf", "15 TL", "56 790 Td", ...lines.map((l) => `(${esc(l)}) '`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
};

const startedAt = new Date().toISOString();
const SEARCH_QUERY = `remote React roles over ${10 + Math.floor(Math.random() * 4)} LPA for freshers`;

const runLocal = async () => {
  const { default: mongoose } = await import("mongoose");
  const { ai, aiEnabled } = await import("../config/env.js");
  const tasks = await import("../ai/tasks.js");
  const { User } = await import("../models/user.model.js");
  const { Job } = await import("../models/job.model.js");
  await import("../models/company.model.js");
  const { Application } = await import("../models/application.model.js");

  if (!aiEnabled()) {
    console.error("GEMINI_API_KEY is not set.");
    process.exit(2);
  }
  console.log(`Model: ${ai.model}\n`);
  await mongoose.connect(process.env.MONGO_URI);

  try {
    const candidate = await User.findOne({ isDemo: true, role: "student" }).lean();
    const recruiter = await User.findOne({ isDemo: true, role: "recruiter" }).lean();
    assert(candidate && recruiter, "Seed data missing: run npm run seed first");
    const jobs = await Job.find({ isSeed: true }).populate("company", "name").limit(3).lean();
    const locations = await Job.distinct("location");

    await check("search: natural language to filters", async () => {
      const f = await tasks.interpretSearch(SEARCH_QUERY, { knownLocations: locations });
      assert(f.workModes.includes("Remote"), `expected Remote work mode, got ${JSON.stringify(f)}`);
      assert(f.minSalary >= 10, `expected minSalary, got ${f.minSalary}`);
      return JSON.stringify(f);
    });

    await check("match: score candidate against 3 jobs", async () => {
      const scored = await tasks.scoreMatches(candidate.profile, jobs);
      assert(scored.length === jobs.length, `expected ${jobs.length} scores, got ${scored.length}`);
      return scored.map((s) => `${s.job.title}: ${s.score}`).join(" | ");
    });

    await check("resume: PDF to profile draft", async () => {
      const draft = await tasks.parseResume(samplePdf());
      assert(draft.skills.includes("React"), `expected React in skills, got ${draft.skills}`);
      return `${draft.headline} | ${draft.skills.length} skills | ${draft.yearsOfExperience} yrs`;
    });

    await check("job description: bullets to draft", async () => {
      const d = await tasks.writeJobDescription({
        title: "Frontend Engineer",
        notes: "- React + TypeScript\n- owns the merchant dashboard\n- hybrid in Bengaluru",
        companyName: "Kestrelbyte",
        experience: 2,
      });
      assert(d.description.length > 80, "description too short");
      return `${d.description.length} chars, ${d.requirements.length} requirements`;
    });

    await check("rank: applicants for a recruiter job", async () => {
      const job = await Job.findOne({ createdBy: recruiter._id, "applications.1": { $exists: true } })
        .populate("company", "name")
        .lean();
      const apps = await Application.find({ job: job._id }).populate("applicant", "profile").lean();
      const ranked = await tasks.rankApplicants(
        job,
        apps.map((a) => ({ applicationId: String(a._id), profile: a.applicant.profile }))
      );
      assert(ranked.length === apps.length, `expected ${apps.length} rankings, got ${ranked.length}`);
      return ranked.map((r) => r.score).join(", ");
    });
  } finally {
    await mongoose.disconnect();
  }
};

const runRemote = async () => {
  const api = async (method, path, { token, body, form } = {}) => {
    const headers = { "X-Requested-With": "ai-smoke" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      headers,
      body: form || (body ? JSON.stringify(body) : undefined),
      signal: AbortSignal.timeout(90000),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
  const expectOk = (res, label) =>
    assert(res.status < 300 && res.data.success !== false, `${label}: HTTP ${res.status} ${res.data.code || ""} ${res.data.message || ""}`);

  console.log(`Target: ${baseUrl}\n`);
  let candidate;
  let recruiter;

  await check("health: key configured and AI available", async () => {
    const res = await api("GET", "/ai/health");
    expectOk(res, "health");
    assert(res.data.configured, "GEMINI_API_KEY is not set on the server");
    assert(res.data.available, `AI unavailable: ${JSON.stringify(res.data.lastFailure)}`);
    return `model=${res.data.model} usedToday=${res.data.usage?.today}/${res.data.usage?.dailyCap}`;
  });

  await check("demo logins", async () => {
    const c = await api("POST", "/user/demo", { body: { role: "student" } });
    const r = await api("POST", "/user/demo", { body: { role: "recruiter" } });
    expectOk(c, "candidate demo");
    expectOk(r, "recruiter demo");
    candidate = c.data.token;
    recruiter = r.data.token;
  });

  await check("search: natural language to filters", async () => {
    const res = await api("POST", "/ai/search", { body: { query: SEARCH_QUERY } });
    expectOk(res, "search");
    assert(res.data.mode === "ai", `fell back to keyword search (${res.data.reason})`);
    return `${res.data.cached ? "cached " : ""}${JSON.stringify(res.data.filters)}`;
  });

  await check("match: score demo candidate against 3 jobs", async () => {
    const jobs = await api("GET", "/job/get?limit=3");
    const res = await api("POST", "/ai/match", { token: candidate, body: { jobIds: jobs.data.jobs.map((j) => j._id) } });
    expectOk(res, "match");
    assert(res.data.matches.length > 0, "no matches returned");
    return res.data.matches.map((m) => m.score).join(", ");
  });

  await check("resume: PDF to profile draft", async () => {
    const form = new FormData();
    form.append("resume", new Blob([samplePdf()], { type: "application/pdf" }), "sample-resume.pdf");
    const res = await api("POST", "/ai/resume", { token: candidate, form });
    expectOk(res, "resume");
    assert(res.data.draft?.skills?.length, "no skills extracted");
    return `${res.data.draft.headline} | ${res.data.draft.skills.length} skills`;
  });

  await check("job description: bullets to draft", async () => {
    const res = await api("POST", "/ai/job-description", {
      token: recruiter,
      body: { title: "Frontend Engineer", notes: "- React + TypeScript\n- owns the merchant dashboard\n- hybrid", experience: 2 },
    });
    expectOk(res, "job description");
    return `${res.data.draft.description.length} chars`;
  });

  await check("rank: applicants for a recruiter job", async () => {
    const jobs = await api("GET", "/job/getadminjobs", { token: recruiter });
    const job = jobs.data.jobs?.find((j) => j.applicantCount > 1);
    assert(job, "no recruiter job with applicants (run the seed)");
    const res = await api("POST", `/ai/jobs/${job._id}/rank`, { token: recruiter });
    expectOk(res, "rank");
    assert(res.data.rankings.length > 0, "no rankings returned");
    return `${res.data.cached ? "cached " : ""}${res.data.rankings.map((r) => r.score).join(", ")}`;
  });

  await check("health after calls: no new failures recorded", async () => {
    const res = await api("GET", "/ai/health");
    const failure = res.data.lastFailure;
    assert(!failure || failure.at < startedAt, `last failure: ${JSON.stringify(failure)}`);
  });
};

await (baseUrl ? runRemote() : runLocal());

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exitCode = failed ? 1 : 0;
