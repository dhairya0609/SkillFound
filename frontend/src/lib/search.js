import { api } from "@/lib/api";
import { emptyFilters, fromApiFilters } from "@/lib/filters";

export const EXAMPLE_QUERIES = [
  "remote React roles over 12 LPA for freshers",
  "data jobs in Pune",
  "design internships",
  "backend roles with 3+ years experience",
];

export const interpretQuery = async (query, aiEnabled) => {
  if (!aiEnabled) return { filters: { ...emptyFilters(), text: query }, mode: "keyword", notice: null, query };
  try {
    const { data } = await api.post("/ai/search", { query });
    return { filters: fromApiFilters(data.filters), mode: data.mode, notice: data.notice || null, query };
  } catch {
    return {
      filters: { ...emptyFilters(), text: query },
      mode: "keyword",
      notice: "AI search couldn't be reached, so these are keyword matches.",
      query,
    };
  }
};
