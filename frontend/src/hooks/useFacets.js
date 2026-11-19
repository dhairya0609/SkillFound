import { useEffect, useState } from "react";
import { api } from "@/lib/api";

let cached = null;

export const useFacets = () => {
  const [facets, setFacets] = useState(cached);
  useEffect(() => {
    if (cached) return;
    api
      .get("/job/facets")
      .then(({ data }) => {
        cached = data;
        setFacets(data);
      })
      .catch(() => {});
  }, []);
  return facets;
};
