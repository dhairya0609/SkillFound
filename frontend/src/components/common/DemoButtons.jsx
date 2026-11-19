import { Briefcase, Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoLogin } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const DemoButtons = ({ size = "lg", className, next, stacked = false, only }) => {
  const { start, pending } = useDemoLogin();
  return (
    <div className={cn("flex gap-2.5", stacked ? "flex-col" : "flex-col sm:flex-row", className)}>
      {only !== "recruiter" && (
        <Button size={size} variant="outline" disabled={Boolean(pending)} onClick={() => start("student", next)}>
          {pending === "student" ? <Loader2 className="animate-spin" /> : <UserRound />}
          Candidate
        </Button>
      )}
      {only !== "student" && (
        <Button size={size} variant="outline" disabled={Boolean(pending)} onClick={() => start("recruiter")}>
          {pending === "recruiter" ? <Loader2 className="animate-spin" /> : <Briefcase />}
          Recruiter
        </Button>
      )}
    </div>
  );
};

export default DemoButtons;
