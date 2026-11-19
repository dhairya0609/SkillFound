import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const REASONS = [
  { id: "scam", label: "Asks for money or personal documents" },
  { id: "fake", label: "Fake job or company" },
  { id: "closed", label: "Job is no longer open" },
  { id: "misleading", label: "Misleading salary or description" },
  { id: "discriminatory", label: "Discriminatory or offensive" },
  { id: "other", label: "Something else" },
];

const ReportJobDialog = ({ job, open, onOpenChange }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSending(true);
    try {
      const { data } = await api.post(`/job/${job._id}/report`, { reason, details });
      toast.success(data.message);
      onOpenChange(false);
      setReason("");
      setDetails("");
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't send the report."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !sending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this job</DialogTitle>
          <DialogDescription>Tell us what's wrong with “{job.title}”. Reports are reviewed and never shared with the employer.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <fieldset className="grid gap-1.5">
            <legend className="sr-only">Reason</legend>
            {REASONS.map((r) => (
              <label
                key={r.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
                  reason === r.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                )}
              >
                <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="size-4 accent-[var(--primary)]" />
                {r.label}
              </label>
            ))}
          </fieldset>
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Anything else we should know (optional)"
            aria-label="Details (optional)"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!reason || sending}>
              {sending && <Loader2 className="animate-spin" />} Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportJobDialog;
