import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { classifyLoadError } from "@/lib/loadError";

let cached = null;

export const useOverview = () => {
  const [state, setState] = useState(() => ({ data: cached, error: null }));
  const load = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
    api
      .get("/job/overview")
      .then(({ data }) => {
        cached = data;
        setState({ data, error: null });
      })
      .catch((error) => setState({ data: cached, error: classifyLoadError(error, { subject: "companies" }) }));
  }, []);
  useEffect(load, [load]);
  return { ...state, loading: !state.data && !state.error, reload: load };
};
