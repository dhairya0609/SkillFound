import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";

export const useCompanies = () => {
  const [state, setState] = useState({ companies: null, error: null });
  const load = useCallback(() => {
    api
      .get("/company/get")
      .then(({ data }) => setState({ companies: data.companies, error: null }))
      .catch((error) => setState({ companies: [], error: errorMessage(error, "Couldn't load companies.") }));
  }, []);
  useEffect(load, [load]);
  return { ...state, reload: load };
};
