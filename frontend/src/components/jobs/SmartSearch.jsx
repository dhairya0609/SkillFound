import { useState } from "react";
import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiStatus } from "@/hooks/useAiStatus";
import { EXAMPLE_QUERIES, interpretQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

const SmartSearch = ({ defaultValue = "", onResult, size = "default", examples = false, className, autoFocus }) => {
  const ai = useAiStatus();
  const [query, setQuery] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const large = size === "lg";

  const run = async (value) => {
    const q = value.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      onResult(await interpretQuery(q, ai.enabled));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className={cn(
          "group flex items-center gap-2 rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20",
          large ? "p-1.5 pl-4" : "p-1 pl-3"
        )}
      >
        {ai.enabled ? (
          <Sparkles className={cn("shrink-0 text-brand", large ? "size-5" : "size-4")} aria-hidden="true" />
        ) : (
          <Search className={cn("shrink-0 text-muted-foreground", large ? "size-5" : "size-4")} aria-hidden="true" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
          autoFocus={autoFocus}
          aria-label={ai.enabled ? "Describe the job you want" : "Search jobs"}
          placeholder={ai.enabled ? "Describe the job you want, in plain English" : "Search by role, skill or city"}
          className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/80", large ? "h-11 text-base" : "h-8 text-[15px] sm:text-sm")}
        />
        <Button type="submit" size={large ? "lg" : "sm"} variant={ai.enabled ? "brand" : "default"} disabled={loading} aria-label="Search">
          {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          <span className="hidden sm:inline">{loading && ai.enabled ? "Reading" : "Search"}</span>
        </Button>
      </form>
      {examples && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try</span>
          {EXAMPLE_QUERIES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuery(ex);
                run(ex);
              }}
              className="rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
