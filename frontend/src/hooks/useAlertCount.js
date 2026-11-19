import { useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./useAuth";

let state = { userId: null, count: 0, fetchedAt: 0 };
const listeners = new Set();
const emit = (next) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

export const refreshAlertCount = async () => {
  if (!state.userId) return;
  try {
    const { data } = await api.get("/me/alerts");
    emit({ count: data.alerts.reduce((sum, a) => sum + a.newCount, 0), fetchedAt: Date.now() });
  } catch {
    // The badge is a nicety; failures leave the last known count.
  }
};

export const useAlertCount = () => {
  const { user, isCandidate } = useAuth();
  const snap = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
  useEffect(() => {
    if (!isCandidate || !user?._id) {
      if (state.userId) emit({ userId: null, count: 0, fetchedAt: 0 });
      return;
    }
    if (state.userId !== user._id || Date.now() - state.fetchedAt > 120000) {
      emit({ userId: user._id });
      refreshAlertCount();
    }
  }, [isCandidate, user?._id]);
  return snap.count;
};
