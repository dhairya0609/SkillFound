import { GoogleGenAI } from "@google/genai";
import { ai as cfg } from "../config/env.js";
import { AiError } from "./errors.js";
import { noteUpstreamLimited } from "./limits.js";
import { validate } from "./schema.js";

const CONFIG_FAILURE_COOLDOWN_MS = 10 * 60 * 1000;

let client;
let lastFailure = null;
let lastModel = null;
let disabledUntil = 0;

const getClient = () => {
  client ??= new GoogleGenAI({ apiKey: cfg.apiKey });
  return client;
};

export const __setClientForTests = (fake) => {
  client = fake;
  skipUntil.clear();
  lastFailure = null;
  disabledUntil = 0;
};

export const isConfigured = () => Boolean(cfg.apiKey);
export const isAvailable = () => isConfigured() && Date.now() >= disabledUntil;
const models = () => [cfg.model, ...cfg.fallbackModels.filter((m) => m !== cfg.model)];

// Models that just failed are skipped for a few minutes so later requests go straight to one that works.
const MODEL_SKIP_MS = 3 * 60 * 1000;
const MIN_ATTEMPT_MS = 4000;
const RETRY_PAUSE_MS = Number(process.env.AI_RETRY_PAUSE_MS ?? 1200);
const skipUntil = new Map();
const liveChain = () => {
  const up = models().filter((m) => (skipUntil.get(m) || 0) <= Date.now());
  return up.length ? up : models();
};

export const health = () => ({
  configured: isConfigured(),
  model: cfg.model,
  fallbackModels: models().slice(1),
  lastModel,
  available: isAvailable(),
  unavailableUntil: disabledUntil > Date.now() ? new Date(disabledUntil).toISOString() : null,
  lastFailure,
});

// Google's error text says why (overloaded, region, quota); keep a short, key-free copy for /ai/health.
const safeMessage = (error) =>
  String(error?.message || "")
    .split(cfg.apiKey || "\u0000").join("[key]")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[key]")
    .slice(0, 240) || null;

const recordFailure = (task, kind, status, error) => {
  lastFailure = { task, kind, status: status ?? null, message: error ? safeMessage(error) : null, at: new Date().toISOString() };
};

// A wrong key or model id fails every request the same way, so stop calling
// Gemini for a while and let the UI fall back instead of erroring per request.
const classify = (error) => {
  const status = error?.status;
  const message = String(error?.message || "");
  if (status === 429 || /RESOURCE_EXHAUSTED/.test(message)) return { kind: "RATE_LIMITED", status };
  if (status === 401 || status === 403 || /API key/i.test(message)) return { kind: "AUTH", status, config: true };
  if (status === 404) return { kind: "MODEL_NOT_FOUND", status, config: true };
  if (status === 400) return { kind: "BAD_REQUEST", status };
  return { kind: "UPSTREAM", status };
};

export const generateJson = async ({ task, system, parts, schema, timeoutMs = cfg.timeoutMs, temperature = 0.2 }) => {
  if (!isConfigured()) throw new AiError("AI_DISABLED");
  if (!isAvailable()) throw new AiError("AI_UNAVAILABLE");

  const started = Date.now();
  const deadline = started + timeoutMs;
  const elapsed = () => Date.now() - started;
  const minAttempt = Math.min(MIN_ATTEMPT_MS, Math.floor(timeoutMs / 3));

  const call = (model, budgetMs) => {
    const controller = new AbortController();
    let timer;
    const aborted = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      }, budgetMs);
    });
    const request = getClient().models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature,
        maxOutputTokens: 8192,
        abortSignal: controller.signal,
        httpOptions: { timeout: budgetMs, retryOptions: { attempts: 1 } },
      },
    });
    request.catch(() => {});
    return Promise.race([request, aborted]).finally(() => clearTimeout(timer));
  };

  let response;
  try {
    let chain = liveChain();
    let round = 0;
    for (let i = 0; ; i++) {
      const model = chain[i];
      const last = i === chain.length - 1;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Object.assign(new Error("deadline"), { name: "AbortError" });
      // Leave time for the next model if this one hangs.
      const budget = last ? remaining : Math.min(remaining, Math.max(minAttempt, Math.floor(remaining * 0.45)));
      try {
        response = await call(model, budget);
        lastModel = model;
        skipUntil.delete(model);
        break;
      } catch (error) {
        const timedOut = error?.name === "AbortError";
        const { kind, status } = timedOut ? { kind: "TIMEOUT" } : classify(error);
        // A different model may be up when this one is overloaded, throttled, slow or not served on this key.
        const retryable = timedOut || ["UPSTREAM", "RATE_LIMITED", "MODEL_NOT_FOUND"].includes(kind);
        if (retryable) skipUntil.set(model, Date.now() + MODEL_SKIP_MS);
        // Google sheds free-tier load in short spikes: when every model is busy, pause and go round once more.
        if ((kind === "UPSTREAM" || kind === "RATE_LIMITED") && last && round === 0 && deadline - Date.now() > minAttempt + RETRY_PAUSE_MS) {
          console.warn(`[ai] task=${task} all models busy, retrying in ${RETRY_PAUSE_MS}ms`);
          await new Promise((r) => setTimeout(r, RETRY_PAUSE_MS));
          round = 1;
          chain = models();
          i = -1;
          continue;
        }
        if (!retryable || last || deadline - Date.now() < minAttempt / 2) throw error;
        console.warn(`[ai] task=${task} model=${model} failed kind=${kind} status=${status ?? "-"}, trying ${chain[i + 1]}`);
      }
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      recordFailure(task, "TIMEOUT");
      console.warn(`[ai] task=${task} timeout ms=${elapsed()}`);
      throw new AiError("AI_TIMEOUT");
    }
    const { kind, status, config } = classify(error);
    recordFailure(task, kind, status, error);
    console.warn(`[ai] task=${task} failed kind=${kind} status=${status ?? "-"} ms=${elapsed()}`);
    if (kind === "RATE_LIMITED") {
      noteUpstreamLimited();
      throw new AiError("AI_RATE_LIMITED", { scope: "upstream", retryAfter: 60 });
    }
    if (config) {
      disabledUntil = Date.now() + CONFIG_FAILURE_COOLDOWN_MS;
      throw new AiError("AI_UNAVAILABLE");
    }
    throw new AiError("AI_UPSTREAM");
  }

  let text;
  try {
    text = response?.text;
  } catch {
    text = undefined;
  }
  const finish = response?.candidates?.[0]?.finishReason;
  if (!text || (finish && finish !== "STOP")) {
    recordFailure(task, "EMPTY_OR_TRUNCATED");
    console.warn(`[ai] task=${task} bad-output finish=${finish || "none"} ms=${elapsed()}`);
    throw new AiError("AI_BAD_OUTPUT");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    recordFailure(task, "INVALID_JSON");
    console.warn(`[ai] task=${task} invalid-json ms=${elapsed()}`);
    throw new AiError("AI_BAD_OUTPUT");
  }

  const result = validate(schema, parsed);
  if (!result.ok) {
    recordFailure(task, "SCHEMA_MISMATCH");
    console.warn(`[ai] task=${task} schema-mismatch at=${result.error.split(":")[0]} ms=${elapsed()}`);
    throw new AiError("AI_BAD_OUTPUT");
  }

  console.log(`[ai] task=${task} ok ms=${elapsed()}`);
  return result.value;
};
