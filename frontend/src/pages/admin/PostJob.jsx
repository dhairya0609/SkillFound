import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AiLabel, AiUnavailableNote } from "@/components/ai/AiMark";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import Field from "@/components/common/Field";
import PageHeader from "@/components/common/PageHeader";
import { markAiUnavailable, useAiStatus } from "@/hooks/useAiStatus";
import { useCompanies } from "@/hooks/useCompanies";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorCode, errorMessage } from "@/lib/api";
import { JOB_TYPES, WORK_MODES } from "@/lib/filters";

const INITIAL = {
  companyId: "",
  title: "",
  workMode: "Hybrid",
  location: "",
  jobType: "Full-time",
  experience: "",
  salary: "",
  salaryMax: "",
  position: "1",
  requirements: "",
  description: "",
};

const composeDescription = (draft) =>
  [draft.description, draft.responsibilities?.length ? `What you'll do\n${draft.responsibilities.map((r) => `• ${r}`).join("\n")}` : ""]
    .filter(Boolean)
    .join("\n\n");

const AiWriter = ({ input, companyName, onDraft }) => {
  const ai = useAiStatus();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ai.loading && !ai.enabled) return <AiUnavailableNote>The AI writer is switched off right now. Write the description yourself; posting works as usual.</AiUnavailableNote>;

  const generate = async () => {
    if (!input.title.trim()) return toast.error("Add a job title first.");
    if (notes.trim().length < 10) return toast.error("Add a few bullet points about the role.");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/job-description", {
        title: input.title,
        notes,
        companyName,
        location: input.location,
        workMode: input.workMode,
        jobType: input.jobType,
        experience: input.experience,
      });
      onDraft(data.draft);
      toast.success("Draft added to the form", { description: "Review and edit it before posting." });
    } catch (error) {
      const code = errorCode(error);
      if (code === "AI_UNAVAILABLE" || code === "AI_DISABLED") markAiUnavailable();
      toast.error(errorMessage(error, "Couldn't draft the description."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5">
      <div className="pointer-events-none absolute inset-0 glow opacity-70" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-medium">
            <Wand2 className="size-4 text-brand" /> Draft with AI
          </h2>
          <AiLabel />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">Jot a few bullets. AI writes a clear description and skill list you can edit.</p>
        <Textarea
          className="mt-4 bg-background"
          rows={5}
          maxLength={1500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={"- React + TypeScript\n- owns the merchant dashboard\n- small team, ships weekly"}
          aria-label="Notes about the role"
        />
        <Button type="button" variant="brand" className="mt-3 w-full" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />} {loading ? "Writing…" : "Generate draft"}
        </Button>
      </div>
    </div>
  );
};

const PostJob = () => {
  useDocumentTitle("Post a job");
  const navigate = useNavigate();
  const { companies, error: companiesError } = useCompanies();
  const [input, setInput] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [highlight, setHighlight] = useState(false);

  const set = (key) => (e) => setInput((s) => ({ ...s, [key]: e.target.value }));
  const companyName = companies?.find((c) => c._id === input.companyId)?.name;

  const submit = async (e) => {
    e.preventDefault();
    if (!input.companyId) return toast.error("Choose a company for this job.");
    setSaving(true);
    try {
      const { data } = await api.post("/job/post", input);
      toast.success(data.message);
      navigate("/admin/jobs");
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't post the job."));
    } finally {
      setSaving(false);
    }
  };

  const writer = (
    <AiWriter
      input={input}
      companyName={companyName}
      onDraft={(draft) => {
        setInput((s) => ({
          ...s,
          description: composeDescription(draft),
          requirements: draft.requirements?.length ? draft.requirements.join(", ") : s.requirements,
        }));
        setHighlight(true);
        setTimeout(() => setHighlight(false), 1600);
      }}
    />
  );

  if (companiesError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <LoadError error={companiesError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (companies && companies.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState icon={Building2} title="Add a company first" action={<Button asChild><Link to="/admin/companies">Go to companies</Link></Button>}>
          Every job belongs to a company. Create yours, then come back to post.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/admin/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <PageHeader className="mt-4" title="Post a job" description="Fill in the basics. AI can draft the description from your notes." />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="hidden lg:order-2 lg:block">
          <div className="sticky top-20">{writer}</div>
        </div>

        <form onSubmit={submit} className="grid gap-5 rounded-xl border bg-card p-5 sm:p-6 lg:order-1">
          {!companies ? (
            <Skeleton className="h-10" />
          ) : (
            <Field label="Company" htmlFor="j-company">
              <Select value={input.companyId} onValueChange={(v) => setInput((s) => ({ ...s, companyId: v }))}>
                <SelectTrigger id="j-company" className="h-10 w-full bg-card">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label="Job title" htmlFor="j-title">
            <Input id="j-title" required maxLength={120} value={input.title} onChange={set("title")} placeholder="Frontend Engineer (React)" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Work mode" htmlFor="j-mode">
              <Select value={input.workMode} onValueChange={(v) => setInput((s) => ({ ...s, workMode: v }))}>
                <SelectTrigger id="j-mode" className="h-10 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Job type" htmlFor="j-type">
              <Select value={input.jobType} onValueChange={(v) => setInput((s) => ({ ...s, jobType: v }))}>
                <SelectTrigger id="j-type" className="h-10 w-full bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Location" htmlFor="j-loc">
              <Input id="j-loc" required value={input.location} onChange={set("location")} placeholder={input.workMode === "Remote" ? "Remote (India)" : "Bengaluru"} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Min salary (LPA)" htmlFor="j-min">
              <Input id="j-min" type="number" min="0" step="0.5" required inputMode="decimal" value={input.salary} onChange={set("salary")} />
            </Field>
            <Field label="Max salary (LPA)" htmlFor="j-max">
              <Input id="j-max" type="number" min="0" step="0.5" inputMode="decimal" value={input.salaryMax} onChange={set("salaryMax")} />
            </Field>
            <Field label="Experience (yrs)" htmlFor="j-exp">
              <Input id="j-exp" type="number" min="0" max="40" required inputMode="numeric" value={input.experience} onChange={set("experience")} />
            </Field>
            <Field label="Openings" htmlFor="j-pos">
              <Input id="j-pos" type="number" min="1" required inputMode="numeric" value={input.position} onChange={set("position")} />
            </Field>
          </div>
          <Field label="Skills" htmlFor="j-req" hint="Separate with commas">
            <Input id="j-req" required value={input.requirements} onChange={set("requirements")} placeholder="React, TypeScript, Jest" />
          </Field>
          <div className="lg:hidden">{writer}</div>
          <Field label="Description" htmlFor="j-desc" hint="Plain text. Start lines with • for bullet points.">
            <Textarea
              id="j-desc"
              required
              rows={12}
              maxLength={8000}
              value={input.description}
              onChange={set("description")}
              className={highlight ? "border-brand ring-[3px] ring-brand/20" : ""}
            />
          </Field>
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => navigate("/admin/jobs")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Post job
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJob;
