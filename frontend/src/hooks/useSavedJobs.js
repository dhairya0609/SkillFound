import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "./useAuth";

let state = { userId: null, ids: new Set(), loaded: false };
const listeners = new Set();
const emit = (next) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const load = async (userId) => {
  if (state.userId === userId && state.loaded) return;
  emit({ userId, ids: new Set(), loaded: false });
  try {
    const { data } = await api.get("/me/saved/ids");
    if (state.userId === userId) emit({ ids: new Set(data.ids), loaded: true });
  } catch {
    if (state.userId === userId) emit({ loaded: true });
  }
};

export const useSavedJobs = () => {
  const { user, isCandidate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );

  useEffect(() => {
    if (isCandidate && user?._id) load(user._id);
    else if (state.userId) emit({ userId: null, ids: new Set(), loaded: false });
  }, [isCandidate, user?._id]);

  const toggle = useCallback(
    async (job) => {
      if (!user) {
        toast("Sign in to save jobs", { description: "Saved jobs follow you across devices." });
        navigate("/login", { state: { from: location.pathname + location.search } });
        return;
      }
      if (!isCandidate) {
        toast("Saving jobs is for candidate accounts.");
        return;
      }
      const id = String(job._id);
      const wasSaved = state.ids.has(id);
      const next = new Set(state.ids);
      if (wasSaved) next.delete(id);
      else next.add(id);
      emit({ ids: next });
      try {
        if (wasSaved) await api.delete(`/me/saved/${id}`);
        else await api.put(`/me/saved/${id}`);
        toast.success(wasSaved ? "Removed from saved jobs" : "Saved", {
          description: wasSaved ? undefined : job.title,
          action: wasSaved ? undefined : { label: "View saved", onClick: () => navigate("/my-jobs?tab=saved") },
        });
      } catch (error) {
        const reverted = new Set(state.ids);
        if (wasSaved) reverted.add(id);
        else reverted.delete(id);
        emit({ ids: reverted });
        toast.error(errorMessage(error, "Couldn't update saved jobs."));
      }
    },
    [user, isCandidate, navigate, location]
  );

  return { isSaved: (id) => snapshot.ids.has(String(id)), toggle, count: snapshot.ids.size };
};
