import { useEffect, useId, useState } from "react";
import { ArrowRight, Loader2, MapPin, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiStatus } from "@/hooks/useAiStatus";
import { api } from "@/lib/api";
import { interpretQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

let locationOptions = null;

const useLocationOptions = (enabled) => {
  const [options, setOptions] = useState(locationOptions || []);
  useEffect(() => {
    if (!enabled || locationOptions) return;
    api
      .get("/job/facets")
      .then(({ data }) => {
        locationOptions = ["Remote", ...data.locations.filter((l) => !/^remote/i.test(l))];
        setOptions(locationOptions);
      })
      .catch(() => {});
  }, [enabled]);
  return options;
};

const SmartSearch = ({
  defaultValue = "",
  defaultLocation = "",
  onResult,
  size = "default",
  withLocation = false,
  className,
}) => {
  const ai = useAiStatus();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [location, setLocation] = useState(defaultLocation);
  const [loading, setLoading] = useState(false);
  const options = useLocationOptions(withLocation);
  const large = size === "lg";

  const run = async (value, place = location) => {
    if ((!value.trim() && !place.trim()) || loading) return;
    setLoading(true);
    try {
      onResult(await interpretQuery(value, ai.enabled, withLocation ? place : ""));
    } finally {
      setLoading(false);
    }
  };

  const Icon = ai.enabled ? Sparkles : Search;

  return (
    <div className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className={cn(
          "flex flex-col gap-1.5 rounded-xl border bg-card shadow-sm transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 sm:flex-row sm:items-center sm:gap-0",
          large ? "p-1.5" : "p-1"
        )}
      >
        <label className={cn("flex min-w-0 flex-1 items-center gap-2.5", large ? "px-3" : "px-2.5")}>
          <Icon className={cn("shrink-0", ai.enabled ? "text-brand" : "text-muted-foreground", large ? "size-5" : "size-4")} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={200}
            aria-label={ai.enabled ? "Describe the job you want" : "Role, skill or keyword"}
            placeholder={ai.enabled ? "Role, skill, or describe the job you want" : "Role, skill or keyword"}
            className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/80", large ? "h-11 text-base" : "h-9 text-[15px] sm:text-sm")}
          />
        </label>
        {withLocation && (
          <label
            className={cn(
              "flex items-center gap-2.5 border-t pt-1.5 sm:w-56 sm:border-t-0 sm:border-l sm:pt-0",
              large ? "px-3" : "px-2.5"
            )}
          >
            <MapPin className={cn("shrink-0 text-muted-foreground", large ? "size-5" : "size-4")} aria-hidden="true" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              list={listId}
              maxLength={40}
              aria-label="Location (optional)"
              placeholder="City or remote"
              className={cn("min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/80", large ? "h-11 text-base" : "h-9 text-[15px] sm:text-sm")}
            />
            <datalist id={listId}>
              {options.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </label>
        )}
        <Button
          type="submit"
          size={large ? "lg" : "sm"}
          variant={ai.enabled ? "brand" : "default"}
          disabled={loading}
          className={cn("w-full sm:w-auto", large ? "sm:ml-1.5" : "sm:ml-1")}
        >
          {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          {loading && ai.enabled ? "Reading" : "Search"}
        </Button>
      </form>
    </div>
  );
};

export default SmartSearch;
