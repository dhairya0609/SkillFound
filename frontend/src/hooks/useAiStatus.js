import { useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/api";

let state = { loading: true, enabled: false, quotaExhausted: false };
let request = null;
const listeners = new Set();

const setState = (next) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const load = () => {
  request ??= api
    .get("/ai/status")
    .then(({ data }) => setState({ loading: false, enabled: Boolean(data.enabled), quotaExhausted: Boolean(data.quotaExhausted) }))
    .catch(() => setState({ loading: false, enabled: false }))
    .finally(() => setTimeout(() => (request = null), 60000));
  return request;
};

export const markAiUnavailable = () => setState({ enabled: false });

export const useAiStatus = () => {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state
  );
  useEffect(() => {
    load();
  }, []);
  return snapshot;
};
