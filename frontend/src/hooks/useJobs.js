import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";

export const useJobs = (filters, { sort = "recent", limit = 12, featured = false } = {}) => {
  const key = filtersToParams(filters, { sort, limit, featured: featured || undefined }).toString();
  const [state, setState] = useState({ key: null, jobs: [], total: 0, pages: 1, page: 1, error: null, loadingMore: false });

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/job/get?${key}`)
      .then(({ data }) => {
        if (!cancelled) setState({ key, jobs: data.jobs, total: data.total, pages: data.pages, page: 1, error: null, loadingMore: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, jobs: [], total: 0, pages: 1, page: 1, error: errorMessage(error, "Couldn't load jobs."), loadingMore: false });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loadMore = async () => {
    const nextPage = state.page + 1;
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const { data } = await api.get(`/job/get?${key}&page=${nextPage}`);
      setState((s) => (s.key === key ? { ...s, jobs: [...s.jobs, ...data.jobs], page: nextPage, loadingMore: false } : s));
    } catch {
      setState((s) => ({ ...s, loadingMore: false }));
    }
  };

  return {
    ...state,
    loading: state.key !== key,
    hasMore: state.page < state.pages,
    loadMore,
  };
};
