import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { classifyLoadError } from "@/lib/loadError";

export const useCompanies = () => {
  const [state, setState] = useState({ companies: null, error: null });
  const load = useCallback(() => {
    api
      .get("/company/get")
      .then(({ data }) => setState({ companies: data.companies, error: null }))
      .catch((error) => setState({ companies: null, error: classifyLoadError(error, { subject: "your companies" }) }));
  }, []);
  useEffect(load, [load]);
  return { ...state, reload: load };
};
