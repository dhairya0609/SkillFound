import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfileFields from "@/components/profile/ProfileFields";
import { appendProfileFields, profileToForm } from "@/components/profile/profileForm";
import { markAiUnavailable, useAiStatus } from "@/hooks/useAiStatus";
import { useAuth } from "@/hooks/useAuth";
import { api, errorCode, errorMessage } from "@/lib/api";
import { setUser } from "@/redux/authSlice";
import { AiLabel, AiUnavailableNote } from "./AiMark";

const MAX_BYTES = 4 * 1024 * 1024;

const ResumeAutofill = () => {
  const ai = useAiStatus();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(null);
  const [attach, setAttach] = useState(true);
  const [dragging, setDragging] = useState(false);

  const read = async (pdf) => {
    if (!pdf) return;
    if (pdf.type !== "application/pdf") return toast.error("Please choose a PDF file.");
    if (pdf.size > MAX_BYTES) return toast.error("That PDF is over 4 MB.");
    setFile(pdf);
    setPhase("reading");
    try {
      const body = new FormData();
      body.append("resume", pdf);
      const { data } = await api.post("/ai/resume", body, { timeout: 60000 });
      const d = data.draft;
      setForm(
        profileToForm(user, {
          headline: d.headline || user?.profile?.headline || "",
          bio: d.bio || user?.profile?.bio || "",
          skills: d.skills?.length ? d.skills.join(", ") : (user?.profile?.skills || []).join(", "),
          experienceSummary: d.experienceSummary || user?.profile?.experienceSummary || "",
          yearsOfExperience: d.yearsOfExperience ?? "",
          location: d.location || user?.profile?.location || "",
        })
      );
      setPhase("review");
    } catch (error) {
      const code = errorCode(error);
      if (code === "AI_UNAVAILABLE" || code === "AI_DISABLED") markAiUnavailable();
      toast.error(errorMessage(error, "Couldn't read that resume."), {
        description: "You can still fill in your profile by hand.",
      });
      setPhase("idle");
    }
  };

  const useSample = async () => {
    try {
      const res = await fetch("/sample-resume.pdf");
      const blob = await res.blob();
      read(new File([blob], "sample-resume.pdf", { type: "application/pdf" }));
    } catch {
      toast.error("Couldn't load the sample resume.");
    }
  };

  const save = async () => {
    setPhase("saving");
    try {
      const body = new FormData();
      appendProfileFields(body, form);
      if (attach && file) body.append("file", file);
      const { data } = await api.post("/user/profile/update", body);
      dispatch(setUser(data.user));
      toast.success("Profile updated from your resume");
      setPhase("idle");
      setForm(null);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't save your profile."));
      setPhase("review");
    }
  };

  if (!ai.loading && !ai.enabled) {
    return <AiUnavailableNote>Resume autofill needs AI, which is switched off right now. You can still edit your profile by hand.</AiUnavailableNote>;
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          read(e.dataTransfer.files?.[0]);
        }}
        className={`relative overflow-hidden rounded-xl border p-5 transition-colors ${dragging ? "border-brand bg-brand-soft" : "bg-card"}`}
      >
        <div className="pointer-events-none absolute inset-0 glow opacity-70" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              {phase === "reading" ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-medium">Fill your profile from a resume</h2>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {phase === "reading"
                  ? `Reading ${file?.name}…`
                  : "Drop a PDF here. You'll review everything before it's saved."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" size="sm" disabled={phase === "reading"} onClick={useSample}>
              <FileText /> Use sample
            </Button>
            <Button variant="brand" size="sm" disabled={phase === "reading"} onClick={() => inputRef.current?.click()}>
              <Upload /> Upload PDF
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            read(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <Dialog open={phase === "review" || phase === "saving"} onOpenChange={(open) => !open && phase !== "saving" && setPhase("idle")}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Review your profile <AiLabel>Drafted by AI</AiLabel>
            </DialogTitle>
            <DialogDescription>Check and edit each field. Nothing is saved until you confirm.</DialogDescription>
          </DialogHeader>
          {form && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ProfileFields form={form} setForm={setForm} idPrefix="ai" />
              <label className="mt-4 flex items-start gap-2.5 text-sm">
                <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
                <span className="min-w-0 break-words">
                  Also attach <span className="font-medium">{file?.name}</span> as my resume
                </span>
              </label>
            </motion.div>
          )}
          <DialogFooter>
            <Button variant="ghost" disabled={phase === "saving"} onClick={() => setPhase("idle")}>
              Discard
            </Button>
            <Button onClick={save} disabled={phase === "saving"}>
              {phase === "saving" && <Loader2 className="animate-spin" />} Save to profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResumeAutofill;
