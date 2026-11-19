import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const FAKE_KEY = "test-key-should-never-leak";
process.env.GEMINI_API_KEY = FAKE_KEY;
process.env.GEMINI_MODEL = "test-model";
process.env.GEMINI_FALLBACK_MODELS = "test-fallback";
process.env.AI_TIMEOUT_MS = "300";
process.env.AI_RESUME_TIMEOUT_MS = "300";
process.env.SECRET_KEY ||= "test-secret";
process.env.MONGO_URI = process.env.MONGO_URI_TEST || "mongodb://127.0.0.1:27017/skillfound_test";

const { __setClientForTests, health } = await import("../ai/gemini.js");
const { resetLimitsForTests } = await import("../ai/limits.js");
const tasks = await import("../ai/tasks.js");
const { AiError } = await import("../ai/errors.js");

const backendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

class FakeApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const respond = (payload, finishReason = "STOP") => ({
  text: typeof payload === "string" ? payload : JSON.stringify(payload),
  candidates: [{ finishReason }],
});

let calls = 0;
const stub = (impl) => {
  calls = 0;
  __setClientForTests({
    models: {
      generateContent: async (params) => {
        calls += 1;
        return impl(params);
      },
    },
  });
};

const FAILURES = {
  "model id not found (404)": () => { throw new FakeApiError(404, "models/test-model is not found"); },
  "auth error (403)": () => { throw new FakeApiError(403, "Permission denied"); },
  "invalid key (400)": () => { throw new FakeApiError(400, "API key not valid. Please pass a valid API key."); },
  "quota exhausted (429)": () => { throw new FakeApiError(429, "RESOURCE_EXHAUSTED"); },
  "server error (500)": () => { throw new FakeApiError(500, "Internal error"); },
  "network failure": () => { throw new TypeError("fetch failed"); },
  timeout: () => new Promise(() => {}),
  "malformed JSON": () => respond("{not json"),
  "empty response": () => respond(""),
  "truncated (MAX_TOKENS)": () => respond("{}", "MAX_TOKENS"),
  "blocked (SAFETY)": () => respond("{}", "SAFETY"),
  "text getter throws": () => ({ get text() { throw new Error("no candidates"); }, candidates: [] }),
  "schema mismatch": () => respond({ matches: "nope", rankings: 3, description: 7, isResume: "yes", skills: "React" }),
};

const EXPECTED_CODE = {
  "model id not found (404)": "AI_UNAVAILABLE",
  "auth error (403)": "AI_UNAVAILABLE",
  "invalid key (400)": "AI_UNAVAILABLE",
  "quota exhausted (429)": "AI_RATE_LIMITED",
  "server error (500)": "AI_UPSTREAM",
  "network failure": "AI_UPSTREAM",
  timeout: "AI_TIMEOUT",
};

const JOB = {
  _id: "j1",
  title: "Frontend Engineer",
  company: { name: "Kestrelbyte" },
  location: "Bengaluru",
  workMode: "Hybrid",
  jobType: "Full-time",
  experienceLevel: 2,
  salary: 12,
  salaryMax: 18,
  requirements: ["React", "TypeScript"],
  description: "Build the dashboard.",
};
const PROFILE = { headline: "Frontend dev", skills: ["React"], bio: "Hi", experienceSummary: "1 year" };

const TASK_CALLS = {
  parseResume: () => tasks.parseResume(Buffer.from("%PDF-1.4 fake")),
  scoreMatches: () => tasks.scoreMatches(PROFILE, [JOB]),
  interpretSearch: () => tasks.interpretSearch("remote react", { knownLocations: ["Pune"] }),
  writeJobDescription: () => tasks.writeJobDescription({ title: "Engineer", notes: "Build things with React" }),
  rankApplicants: () => tasks.rankApplicants(JOB, [{ applicationId: "a1", profile: PROFILE }]),
};

beforeEach(() => resetLimitsForTests());

describe("AI task failures surface as typed AiErrors", () => {
  for (const [name, impl] of Object.entries(FAILURES)) {
    for (const [taskName, call] of Object.entries(TASK_CALLS)) {
      if (name === "timeout" && taskName !== "scoreMatches") continue;
      test(`${taskName}: ${name}`, async () => {
        stub(impl);
        await assert.rejects(call, (error) => {
          assert.ok(error instanceof AiError, `expected AiError, got ${error?.name}`);
          assert.equal(error.code, EXPECTED_CODE[name] || "AI_BAD_OUTPUT");
          return true;
        });
      });
    }
  }
});

describe("config failures open a circuit instead of retrying every request", () => {
  test("404 stops further calls and is reported by health()", async () => {
    stub(FAILURES["model id not found (404)"]);
    await assert.rejects(TASK_CALLS.scoreMatches, { code: "AI_UNAVAILABLE" });
    await assert.rejects(TASK_CALLS.interpretSearch, { code: "AI_UNAVAILABLE" });
    assert.equal(calls, 2, "each model in the chain is tried once, then the circuit opens");
    const h = health();
    assert.equal(h.available, false);
    assert.equal(h.lastFailure.kind, "MODEL_NOT_FOUND");
    assert.ok(!JSON.stringify(h).includes(FAKE_KEY));
  });
});

describe("model fallback chain", () => {
  for (const [name, status] of [["overloaded (503)", 503], ["rate-limited (429)", 429], ["not served (404)", 404]]) {
    test(`primary ${name} falls through to the next model`, async () => {
      const seen = [];
      stub((params) => {
        seen.push(params.model);
        if (params.model === "test-model") throw new FakeApiError(status, "primary down");
        return respond({ skills: ["React"] });
      });
      const filters = await TASK_CALLS.interpretSearch();
      assert.deepEqual(filters.skills, ["React"]);
      assert.deepEqual(seen, ["test-model", "test-fallback"]);
      assert.equal(health().lastModel, "test-fallback");
      assert.equal(health().available, true);
    });
  }

  test("a hanging primary leaves time for the fallback", async () => {
    stub((params) => (params.model === "test-model" ? new Promise(() => {}) : respond({ skills: ["Go"] })));
    const filters = await TASK_CALLS.interpretSearch();
    assert.deepEqual(filters.skills, ["Go"]);
    assert.equal(health().lastModel, "test-fallback");
  });

  test("a model that just failed is skipped on the next request", async () => {
    const seen = [];
    stub((params) => {
      seen.push(params.model);
      if (params.model === "test-model") throw new FakeApiError(503, "overloaded");
      return respond({ skills: ["SQL"] });
    });
    await TASK_CALLS.interpretSearch();
    await TASK_CALLS.interpretSearch();
    assert.deepEqual(seen, ["test-model", "test-fallback", "test-fallback"]);
  });

  test("health keeps Google's reason but never the key", async () => {
    stub(() => { throw new FakeApiError(503, `overloaded for key=${FAKE_KEY} AIzaSyA1234567890abcdefghijklmnop`); });
    await assert.rejects(TASK_CALLS.interpretSearch);
    const msg = health().lastFailure.message;
    assert.match(msg, /overloaded/);
    assert.ok(!msg.includes(FAKE_KEY) && !msg.includes("AIzaSy"));
  });

  test("a bad key is not retried on other models", async () => {
    stub(FAILURES["auth error (403)"]);
    await assert.rejects(TASK_CALLS.interpretSearch, { code: "AI_UNAVAILABLE" });
    assert.equal(calls, 1);
  });
});

describe("valid responses are schema-checked and sanitised", () => {
  test("search drops unknown fields and invalid enum values are rejected", async () => {
    stub(() => respond({ skills: ["React"], workModes: ["Remote"], minSalaryLPA: 12, salaryCurrency: "USD", evil: { $where: 1 } }));
    const filters = await TASK_CALLS.interpretSearch();
    assert.deepEqual(filters.skills, ["React"]);
    assert.deepEqual(filters.workModes, ["Remote"]);
    assert.equal(filters.minSalary, 12);
    assert.equal(filters.salaryCurrency, undefined);
    assert.equal(filters.evil, undefined);

    stub(() => respond({ workModes: ["Moon"] }));
    await assert.rejects(TASK_CALLS.interpretSearch, { code: "AI_BAD_OUTPUT" });
  });

  test("match ignores unknown refs and fails when none are usable", async () => {
    stub(() => respond({ matches: [{ ref: "J1", score: 88, reasons: ["a", "b", "c", "d"], missingSkills: [] }, { ref: "J9", score: 10, reasons: [], missingSkills: [] }] }));
    const [only, ...rest] = await TASK_CALLS.scoreMatches();
    assert.equal(only.score, 88);
    assert.equal(only.reasons.length, 3);
    assert.equal(rest.length, 0);

    stub(() => respond({ matches: [{ ref: "J9", score: 10, reasons: [], missingSkills: [] }] }));
    await assert.rejects(TASK_CALLS.scoreMatches, { code: "AI_BAD_OUTPUT" });
  });

  test("out-of-range score is a schema mismatch", async () => {
    stub(() => respond({ matches: [{ ref: "J1", score: 140, reasons: [], missingSkills: [] }] }));
    await assert.rejects(TASK_CALLS.scoreMatches, { code: "AI_BAD_OUTPUT" });
  });

  test("resume flagged as not-a-resume", async () => {
    stub(() => respond({ isResume: false, headline: "", bio: "", skills: [], experienceSummary: "", yearsOfExperience: 0 }));
    await assert.rejects(TASK_CALLS.parseResume, { code: "NOT_A_RESUME" });
  });

  test("the key and model are passed to the SDK, never the prompt to logs", async () => {
    let seen;
    stub((params) => {
      seen = params;
      return respond({ description: "Para", responsibilities: ["Do"], requirements: ["React"] });
    });
    const logs = [];
    const original = { log: console.log, warn: console.warn };
    console.log = console.warn = (...args) => logs.push(args.join(" "));
    try {
      await TASK_CALLS.writeJobDescription();
    } finally {
      Object.assign(console, original);
    }
    assert.equal(seen.model, "test-model");
    assert.equal(seen.config.responseMimeType, "application/json");
    assert.ok(seen.config.responseJsonSchema);
    assert.equal(seen.config.httpOptions.retryOptions.attempts, 1);
    assert.ok(logs.every((line) => !line.includes("Build things") && !line.includes(FAKE_KEY)));
  });
});

describe("HTTP: every AI route degrades and core flows keep working", async () => {
  const mongoose = (await import("mongoose")).default;
  let server;
  let base;
  let dbReady = false;

  before(async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoose.connection.db.dropDatabase();
      const seed = spawnSync(process.execPath, ["scripts/seed.js"], {
        cwd: backendDir,
        env: { ...process.env },
        encoding: "utf8",
      });
      assert.equal(seed.status, 0, seed.stderr);
      const app = (await import("../app.js")).default;
      server = app.listen(0);
      base = `http://127.0.0.1:${server.address().port}/api/v1`;
      dbReady = true;
    } catch (error) {
      console.warn(`Skipping HTTP tests: ${error.message}`);
    }
  });

  after(async () => {
    server?.close();
    if (dbReady) await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  const api = async (method, url, { token, body, form } = {}) => {
    const headers = { "X-Requested-With": "test" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";
    const res = await fetch(`${base}${url}`, { method, headers, body: form || (body && JSON.stringify(body)) });
    return { status: res.status, data: await res.json() };
  };

  const demo = async (role) => (await api("POST", "/user/demo", { body: { role } })).data.token;

  for (const [name, impl] of Object.entries(FAILURES)) {
    test(`with Gemini failing (${name})`, async (t) => {
      if (!dbReady) return t.skip("MongoDB not reachable");
      stub(impl);

      const search = await api("POST", "/ai/search", { body: { query: `remote react ${name}` } });
      assert.equal(search.status, 200);
      assert.equal(search.data.mode, "keyword");
      assert.ok(search.data.filters.text.includes("remote react"));
      const qs = new URLSearchParams({ text: search.data.filters.text });
      const jobs = await api("GET", `/job/get?${qs}`);
      assert.equal(jobs.status, 200);

      const candidate = await demo("student");
      const recruiter = await demo("recruiter");
      assert.ok(candidate && recruiter, "demo login works");

      const list = await api("GET", "/job/get?limit=3");
      const jobId = list.data.jobs[0]._id;
      const match = await api("POST", "/ai/match", { token: candidate, body: { jobIds: [jobId] } });
      assert.ok([429, 502, 503, 504].includes(match.status), `match status ${match.status}`);
      assert.ok(match.data.code?.startsWith("AI_"));

      const form = new FormData();
      form.append("resume", new Blob(["%PDF-1.4 resume"], { type: "application/pdf" }), "cv.pdf");
      const resume = await api("POST", "/ai/resume", { token: candidate, form });
      assert.ok([429, 502, 503, 504].includes(resume.status), `resume status ${resume.status}`);

      const profile = await api("POST", "/user/profile/update", { token: candidate, body: { bio: `Bio ${name}` } });
      assert.equal(profile.status, 200);

      const adminJobs = await api("GET", "/job/getadminjobs", { token: recruiter });
      const ownJob = adminJobs.data.jobs.find((j) => j.applicantCount > 0);
      const rank = await api("POST", `/ai/jobs/${ownJob._id}/rank`, { token: recruiter });
      assert.ok([429, 502, 503, 504].includes(rank.status), `rank status ${rank.status}`);
      const applicants = await api("GET", `/application/${ownJob._id}/applicants`, { token: recruiter });
      assert.equal(applicants.status, 200);

      const jd = await api("POST", "/ai/job-description", { token: recruiter, body: { title: "Engineer", notes: "Build React dashboards" } });
      assert.ok([429, 502, 503, 504].includes(jd.status), `jd status ${jd.status}`);
      const companies = await api("GET", "/company/get", { token: recruiter });
      const posted = await api("POST", "/job/post", {
        token: recruiter,
        body: {
          title: `Manual ${name}`, description: "Written by hand", requirements: "React", salary: 10,
          location: "Pune", jobType: "Full-time", experience: 0, position: 1, companyId: companies.data.companies[0]._id,
        },
      });
      assert.equal(posted.status, 201);

      const apply = await api("POST", `/application/apply/${posted.data.job._id}`, { token: candidate });
      assert.equal(apply.status, 201);

      const healthRes = await api("GET", "/ai/health");
      assert.equal(healthRes.status, 200);
      assert.equal(healthRes.data.configured, true);
      assert.equal(healthRes.data.model, "test-model");
      assert.ok(!JSON.stringify(healthRes.data).includes(FAKE_KEY));
    });
  }

  test("health and status never call Gemini", async (t) => {
    if (!dbReady) return t.skip("MongoDB not reachable");
    stub(() => respond({}));
    await api("GET", "/ai/health");
    await api("GET", "/ai/status");
    assert.equal(calls, 0);
  });

  test("status reports AI off after a config failure, so the UI hides it", async (t) => {
    if (!dbReady) return t.skip("MongoDB not reachable");
    stub(FAILURES["auth error (403)"]);
    await api("POST", "/ai/search", { body: { query: "status check" } });
    const status = await api("GET", "/ai/status");
    assert.equal(status.data.enabled, false);
    const searchAgain = await api("POST", "/ai/search", { body: { query: "another query" } });
    assert.equal(searchAgain.data.mode, "keyword");
    assert.equal(calls, 1);
  });

  test("a valid AI search is cached and turned into filters", async (t) => {
    if (!dbReady) return t.skip("MongoDB not reachable");
    stub(() => respond({ skills: ["React"], workModes: ["Remote"], minSalaryLPA: 12, maxExperienceYears: 1 }));
    const first = await api("POST", "/ai/search", { body: { query: "remote React roles over 12 LPA for freshers" } });
    const second = await api("POST", "/ai/search", { body: { query: "Remote React roles over 12 LPA for freshers" } });
    assert.equal(first.data.mode, "ai");
    assert.equal(second.data.cached, true);
    assert.equal(calls, 1);
    const { skills, workModes, minSalary, maxExperience } = first.data.filters;
    const qs = new URLSearchParams({ skills, workModes, minSalary, maxExperience });
    const jobs = await api("GET", `/job/get?${qs}`);
    assert.ok(jobs.data.jobs.some((j) => j.title.includes("New Grad")));
  });

  test("match scores are cached per profile version", async (t) => {
    if (!dbReady) return t.skip("MongoDB not reachable");
    stub(() => respond({ matches: [{ ref: "J1", score: 77, reasons: ["React overlap"], missingSkills: ["Jest"] }] }));
    const candidate = await demo("student");
    const list = await api("GET", "/job/get?limit=1");
    const jobIds = [list.data.jobs[0]._id];
    const first = await api("POST", "/ai/match", { token: candidate, body: { jobIds } });
    const second = await api("POST", "/ai/match", { token: candidate, body: { jobIds } });
    assert.equal(first.data.matches[0].score, 77);
    assert.equal(second.data.matches[0].score, 77);
    assert.equal(calls, 1);
    await api("POST", "/user/profile/update", { token: candidate, body: { skills: "React, Jest" } });
    await api("POST", "/ai/match", { token: candidate, body: { jobIds } });
    assert.equal(calls, 2);
  });

  test("rate limits return 429 with Retry-After and search still falls back", async (t) => {
    if (!dbReady) return t.skip("MongoDB not reachable");
    stub(() => respond({ skills: ["Go"] }));
    let last;
    for (let i = 0; i < 9; i += 1) last = await api("POST", "/ai/search", { body: { query: `go roles ${i}` } });
    assert.equal(last.data.mode, "keyword");
    assert.equal(last.data.reason, "AI_RATE_LIMITED");
    const candidate = await demo("student");
    const list = await api("GET", "/job/get?limit=2");
    const res = await fetch(`${base}/ai/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "t", Authorization: `Bearer ${candidate}` },
      body: JSON.stringify({ jobIds: [list.data.jobs[1]._id] }),
    });
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) > 0);
  });
});
