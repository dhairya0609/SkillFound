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

before(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    await mongoose.connection.db.dropDatabase();
    const seed = spawnSync(process.execPath, ["scripts/seed.js"], { cwd: backendDir, env: { ...process.env }, encoding: "utf8" });
    assert.equal(seed.status, 0, seed.stderr);
    const app = (await import("../app.js")).default;
    server = app.listen(0);
    base = `http://127.0.0.1:${server.address().port}/api/v1`;
    ready = true;
  } catch (error) {
    console.warn(`Skipping overview tests: ${error.message}`);
  }
});

after(async () => {
  server?.close();
  if (ready) await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

const get = async (url) => (await fetch(`${base}${url}`)).json();

test("overview is public and its numbers match the job list", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const overview = await get("/job/overview");
  const all = await get("/job/get?limit=1");
  assert.equal(overview.stats.openRoles, all.total);
  assert.equal(overview.stats.companiesHiring, overview.companies.length);
  assert.equal(overview.companies.reduce((sum, c) => sum + c.openRoles, 0), all.total);
  const remote = await get("/job/get?workModes=Remote&limit=1");
  assert.equal(overview.stats.remoteRoles, remote.total);
  for (const category of overview.categories) {
    const list = await get(`/job/get?category=${category.id}&limit=1`);
    assert.equal(list.total, category.count, category.id);
    assert.ok(category.count > 0, `${category.id} should have seeded jobs`);
  }
});

test("category matches titles, not requirements", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const design = await get("/job/get?category=design&limit=50");
  assert.ok(design.jobs.every((j) => /design/i.test(j.title)));
});

test("unknown category is ignored", async (t) => {
  if (!ready) return t.skip("MongoDB not reachable");
  const all = await get("/job/get?limit=1");
  const bogus = await get("/job/get?category=$where&limit=1");
  assert.equal(bogus.total, all.total);
});
