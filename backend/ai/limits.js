import { ai as cfg } from "../config/env.js";
import { AiError } from "./errors.js";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const MAX_TRACKED_KEYS = 10000;

const buckets = new Map();
let day = { key: "", count: 0 };
let upstreamCooldownUntil = 0;

const todayKey = () => new Date().toISOString().slice(0, 10);

const recent = (key, windowMs, now) => {
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  buckets.set(key, hits);
  return hits;
};

const retryAfterFor = (hits, windowMs, now) =>
  Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));

const secondsUntilTomorrowUtc = (now) => {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.ceil((next - now) / 1000);
};

export const consume = ({ ip, userId }) => {
  const now = Date.now();
  if (day.key !== todayKey()) day = { key: todayKey(), count: 0 };

  if (now < upstreamCooldownUntil) {
    throw new AiError("AI_RATE_LIMITED", {
      scope: "upstream",
      retryAfter: Math.ceil((upstreamCooldownUntil - now) / 1000),
    });
  }
  if (day.count >= cfg.dailyCap) {
    throw new AiError("AI_RATE_LIMITED", {
      scope: "daily",
      message: "The free AI quota for today is used up. It resets at 00:00 UTC.",
      retryAfter: secondsUntilTomorrowUtc(now),
    });
  }

  const checks = [
    { key: "global", windowMs: MINUTE, limit: cfg.globalPerMinute, scope: "global" },
    ip && { key: `ip:${ip}`, windowMs: HOUR, limit: cfg.perIpPerHour, scope: "ip" },
    userId && { key: `user:${userId}`, windowMs: HOUR, limit: cfg.perUserPerHour, scope: "user" },
  ].filter(Boolean);

  for (const check of checks) {
    const hits = recent(check.key, check.windowMs, now);
    if (hits.length >= check.limit) {
      throw new AiError("AI_RATE_LIMITED", {
        scope: check.scope,
        message:
          check.scope === "global"
            ? "Lots of people are using AI right now. Try again in a minute."
            : "You've hit the AI limit for now. Try again a bit later.",
        retryAfter: retryAfterFor(hits, check.windowMs, now),
      });
    }
  }

  for (const check of checks) buckets.get(check.key).push(now);
  day.count += 1;
  if (buckets.size > MAX_TRACKED_KEYS) prune(now);
};

export const noteUpstreamLimited = (ms = MINUTE) => {
  upstreamCooldownUntil = Math.max(upstreamCooldownUntil, Date.now() + ms);
};

const prune = (now) => {
  for (const [key, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > HOUR) buckets.delete(key);
  }
};

setInterval(() => prune(Date.now()), 10 * MINUTE).unref();

export const usage = () => ({
  today: day.key === todayKey() ? day.count : 0,
  dailyCap: cfg.dailyCap,
});

export const resetLimitsForTests = () => {
  buckets.clear();
  day = { key: "", count: 0 };
  upstreamCooldownUntil = 0;
};
