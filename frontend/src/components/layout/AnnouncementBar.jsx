import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth, useDemoLogin } from "@/hooks/useAuth";

const STORAGE_KEY = "sf-demo-bar-dismissed";

const readDismissed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const DemoLink = ({ role, pending, start, children }) => (
  <button
    type="button"
    disabled={Boolean(pending)}
    onClick={() => start(role)}
    className="inline-flex items-center gap-1 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground disabled:opacity-60"
  >
    {pending === role && <Loader2 className="size-3 animate-spin" />}
    {children}
  </button>
);

const AnnouncementBar = () => {
  const { user } = useAuth();
  const { start, pending } = useDemoLogin();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || (user && !user.isDemo)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Without storage the bar simply comes back on the next visit.
    }
  };

  const otherRole = user?.role === "recruiter" ? "student" : "recruiter";

  return (
    <div className="relative border-b bg-muted/60 text-[13px] text-muted-foreground" role="region" aria-label="Demo accounts">
      <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-x-1.5 px-10 py-1.5 text-center">
        {user ? (
          <p>
            You're in the shared demo {user.role === "recruiter" ? "recruiter" : "candidate"} account.{" "}
            <DemoLink role={otherRole} pending={pending} start={start}>
              Switch to {otherRole === "recruiter" ? "recruiter" : "candidate"}
            </DemoLink>
          </p>
        ) : (
          <p>
            Exploring SkillFound? Try it with a demo account:{" "}
            <DemoLink role="student" pending={pending} start={start}>
              Candidate
            </DemoLink>
            <span aria-hidden="true"> · </span>
            <DemoLink role="recruiter" pending={pending} start={start}>
              Recruiter
            </DemoLink>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss demo banner"
        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md hover:bg-accent hover:text-foreground sm:right-4"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};

export default AnnouncementBar;
