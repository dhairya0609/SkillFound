import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Briefcase, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Field from "@/components/common/Field";
import { homeFor, useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import AuthShell from "./AuthShell";

const ROLES = [
  { id: "student", label: "I'm looking for a job", icon: UserRound },
  { id: "recruiter", label: "I'm hiring", icon: Briefcase },
];

const Signup = () => {
  useDocumentTitle("Sign up");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState({ fullName: "", email: "", phoneNumber: "", password: "", role: "student" });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user)} replace />;

  const set = (key) => (e) => setInput({ ...input, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(input).forEach(([k, v]) => body.append(k, v));
      if (photo) body.append("profilePhoto", photo);
      const { data } = await api.post("/user/register", body);
      toast.success(data.message);
      navigate("/login");
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't create your account."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Takes under a minute. Candidates and recruiters both welcome."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={input.role === r.id}
              onClick={() => setInput({ ...input, role: r.id })}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm transition-colors",
                input.role === r.id ? "border-brand/60 bg-brand-soft" : "hover:border-foreground/20"
              )}
            >
              <r.icon className={cn("size-4", input.role === r.id ? "text-brand" : "text-muted-foreground")} />
              {r.label}
            </button>
          ))}
        </div>
        <Field label="Full name" htmlFor="name">
          <Input id="name" autoComplete="name" required value={input.fullName} onChange={set("fullName")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={input.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" autoComplete="tel" required value={input.phoneNumber} onChange={set("phoneNumber")} />
          </Field>
        </div>
        <Field label="Password" htmlFor="password" hint="At least 6 characters">
          <Input id="password" type="password" autoComplete="new-password" minLength={6} required value={input.password} onChange={set("password")} />
        </Field>
        <Field label="Photo (optional)" htmlFor="photo">
          <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
        </Field>
        <Button type="submit" size="lg" className="mt-1" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
    </AuthShell>
  );
};

export default Signup;
