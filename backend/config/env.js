import dotenv from "dotenv";

dotenv.config();

const intFromEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const isProduction =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

// The retired skillfound-frontend site still auto-deploys from main and now calls this API, so old links keep working.
const DEFAULT_FRONTENDS = ["https://skillfound-jobs.onrender.com", "https://skillfound-frontend.onrender.com"];

export const allowedOrigins = Array.from(
  new Set(
    [...DEFAULT_FRONTENDS, ...(process.env.FRONTEND_URL || "").split(",")]
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean)
  )
);

export const cloudinaryConfigured = Boolean(
  process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET
);

export const publicBaseUrl = (
  process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`
).replace(/\/$/, "");

export const ai = {
  apiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  // Tried in order when a model is overloaded, rate-limited or missing on this key.
  fallbackModels: (process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.6-flash,gemini-3.5-flash-lite")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean),
  timeoutMs: intFromEnv("AI_TIMEOUT_MS", 20000),
  resumeTimeoutMs: intFromEnv("AI_RESUME_TIMEOUT_MS", 30000),
  dailyCap: intFromEnv("AI_DAILY_CAP", 200),
  globalPerMinute: intFromEnv("AI_GLOBAL_RPM", 8),
  perIpPerHour: intFromEnv("AI_IP_HOURLY", 30),
  perUserPerHour: intFromEnv("AI_USER_HOURLY", 40),
};

export const aiEnabled = () => Boolean(ai.apiKey);
