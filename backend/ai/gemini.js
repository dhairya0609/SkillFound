import { GoogleGenAI } from "@google/genai";
import { ai as cfg } from "../config/env.js";
import { AiError } from "./errors.js";
import { noteUpstreamLimited } from "./limits.js";
import { validate } from "./schema.js";

const CONFIG_FAILURE_COOLDOWN_MS = 10 * 60 * 1000;

let client;
let lastFailure = null;
let disabledUntil = 0;

const getClient = () => {
  client ??= new GoogleGenAI({ apiKey: cfg.apiKey });
  return client;
};

export const __setClientForTests = (fake) => {
  client = fake;
  lastFailure = null;
  disabledUntil = 0;
};

export const isConfigured = () => Boolean(cfg.apiKey);
export const isAvailable = () => isConfigured() && Date.now() >= disabledUntil;
export const health = () => ({
  configured: isConfigured(),
  model: cfg.model,
  available: isAvailable(),
  unavailableUntil: disabledUntil > Date.now() ? new Date(disabledUntil).toISOString() : null,
  lastFailure,
});

const recordFailure = (task, kind, status) => {
  lastFailure = { task, kind, status: status ?? null, at: new Date().toISOString() };
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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  const elapsed = () => Date.now() - started;

  let response;
  try {
    response = await Promise.race([
      getClient().models.generateContent({
        model: cfg.model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          temperature,
          maxOutputTokens: 8192,
          abortSignal: controller.signal,
          httpOptions: { timeout: timeoutMs, retryOptions: { attempts: 1 } },
        },
      }),
      new Promise((_, reject) =>
        controller.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))
      ),
    ]);
  } catch (error) {
    if (controller.signal.aborted || error?.name === "AbortError") {
      recordFailure(task, "TIMEOUT");
      console.warn(`[ai] task=${task} timeout ms=${elapsed()}`);
      throw new AiError("AI_TIMEOUT");
    }
    const { kind, status, config } = classify(error);
    recordFailure(task, kind, status);
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
  } finally {
    clearTimeout(timer);
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
