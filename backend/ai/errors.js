const MESSAGES = {
  AI_DISABLED: "AI features aren't enabled on this server.",
  AI_UNAVAILABLE: "AI features are temporarily unavailable.",
  AI_RATE_LIMITED: "AI is taking a breather. Please try again shortly.",
  AI_TIMEOUT: "The AI took too long to respond. Please try again.",
  AI_UPSTREAM: "The AI service is unavailable right now. Please try again.",
  AI_BAD_OUTPUT: "The AI returned something unexpected. Please try again.",
  NOT_A_RESUME: "That PDF doesn't look like a resume.",
};

const STATUS = {
  AI_DISABLED: 503,
  AI_UNAVAILABLE: 503,
  AI_RATE_LIMITED: 429,
  AI_TIMEOUT: 504,
  AI_UPSTREAM: 502,
  AI_BAD_OUTPUT: 502,
  NOT_A_RESUME: 422,
};

export class AiError extends Error {
  constructor(code, { message, retryAfter, scope } = {}) {
    super(message || MESSAGES[code] || "AI request failed.");
    this.name = "AiError";
    this.code = code;
    this.status = STATUS[code] || 500;
    this.retryAfter = retryAfter;
    this.scope = scope;
  }
}
