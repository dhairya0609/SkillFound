import { api } from "@/lib/api";
import { emptyFilters, fromApiFilters } from "@/lib/filters";

export const EXAMPLE_QUERIES = [
  "remote React roles over 12 LPA for freshers",
  "data jobs in Pune",
  "design internships",
  "backend roles with 3+ years experience",
];

const keyword = (text, place, notice = null) => ({
  filters: { ...emptyFilters(), text, locations: place ? [place] : [] },
  mode: "keyword",
  notice,
});

export const interpretQuery = async (rawQuery, aiEnabled, location = "") => {
  const query = rawQuery.trim();
  const place = location.trim();
  const meta = { query, location: place };
  if (!aiEnabled || !query) return { ...keyword(query, place), ...meta };
  try {
    const { data } = await api.post("/ai/search", { query: place ? `${query} in ${place}` : query });
    if (data.mode !== "ai") return { ...keyword(query, place, data.notice || null), ...meta };
    return { filters: fromApiFilters(data.filters), mode: "ai", notice: null, ...meta };
  } catch {
    return { ...keyword(query, place, "AI search couldn't be reached, so these are keyword matches."), ...meta };
  }
};
