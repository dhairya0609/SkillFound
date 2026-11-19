import { useEffect, useMemo, useState } from "react";
import { api, errorCode } from "@/lib/api";
import { markAiUnavailable, useAiStatus } from "./useAiStatus";
import { useAuth } from "./useAuth";

const cache = new Map();
const inflight = new Map();

const cacheKey = (user, jobId) => `${user._id}:${user.profileVersion}:${jobId}`;

const fetchBatch = (user, ids) => {
  const key = `${user._id}:${user.profileVersion}:${ids.join(",")}`;
  if (!inflight.has(key)) {
    inflight.set(
      key,
      api
        .post("/ai/match", { jobIds: ids })
        .then(({ data }) => {
          for (const m of data.matches) cache.set(cacheKey(user, m.jobId), m);
          return null;
        })
        .catch((error) => {
          const code = errorCode(error);
          if (code === "AI_UNAVAILABLE" || code === "AI_DISABLED") markAiUnavailable();
          return code || "ERROR";
        })
        .finally(() => inflight.delete(key))
    );
  }
  return inflight.get(key);
};

export const useMatches = (jobIds) => {
  const { user, isCandidate } = useAuth();
  const ai = useAiStatus();
  const enabled = Boolean(isCandidate && ai.enabled && user);
  const idsKey = jobIds.join(",");
  const [version, setVersion] = useState(0);
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    if (!enabled || !idsKey) return;
    const missing = idsKey.split(",").filter((id) => !cache.has(cacheKey(user, id)));
    if (!missing.length) return;
    let cancelled = false;
    const batches = [];
    for (let i = 0; i < missing.length; i += 10) batches.push(missing.slice(i, i + 10));
    (async () => {
      for (const batch of batches) {
        const code = await fetchBatch(user, batch);
        if (cancelled) return;
        setVersion((v) => v + 1);
        if (code) {
          setIssue(code);
          return;
        }
      }
      setIssue(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey, user]);

  return useMemo(() => {
    void version;
    const matches = {};
    if (enabled) {
      for (const id of idsKey.split(",")) {
        const m = cache.get(cacheKey(user, id));
        if (m) matches[id] = m;
      }
    }
    const pending = enabled && !issue && idsKey.split(",").some((id) => id && !matches[id]);
    return { enabled, matches, pending, issue };
  }, [enabled, idsKey, user, version, issue]);
};
