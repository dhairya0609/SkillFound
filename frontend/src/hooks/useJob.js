import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { classifyLoadError } from "@/lib/loadError";
import { useAuth } from "./useAuth";

export const useJob = (id) => {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, job: null, application: null, error: null });
  const key = `${id}|${user?._id || ""}|${attempt}`;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    api
      .get(`/job/get/${id}`)
      .then(({ data }) => !cancelled && setState({ key, job: data.job, application: data.viewerApplication, error: null }))
      .catch((error) => !cancelled && setState({ key, job: null, application: null, error: classifyLoadError(error, { subject: "this job" }) }));
    return () => {
      cancelled = true;
    };
  }, [id, key]);

  const setApplication = useCallback(
    (application) =>
      setState((s) => ({ ...s, application, job: s.job && { ...s.job, applicantCount: (s.job.applicantCount || 0) + 1 } })),
    []
  );

  return {
    ...state,
    loading: state.key !== key,
    retry: () => setAttempt((a) => a + 1),
    setApplication,
  };
};

const similarCache = new Map();

export const useSimilarJobs = (id) => {
  const [jobs, setJobs] = useState(() => similarCache.get(id) || null);
  useEffect(() => {
    if (!id) return;
    if (similarCache.has(id)) {
      setJobs(similarCache.get(id));
      return;
    }
    let cancelled = false;
    setJobs(null);
    api
      .get(`/job/${id}/similar`)
      .then(({ data }) => {
        similarCache.set(id, data.jobs);
        if (!cancelled) setJobs(data.jobs);
      })
      .catch(() => !cancelled && setJobs([]));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return jobs;
};
