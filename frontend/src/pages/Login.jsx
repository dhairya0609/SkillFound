import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DemoButtons from "@/components/common/DemoButtons";
import Field from "@/components/common/Field";
import { homeFor, useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorMessage } from "@/lib/api";
import { signedIn } from "@/redux/authSlice";
import AuthShell from "./AuthShell";

const Login = () => {
  useDocumentTitle("Log in");
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [input, setInput] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={state?.from || homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/user/login", input);
      dispatch(signedIn({ user: data.user, token: data.token }));
      toast.success(data.message);
      navigate(state?.from || homeFor(data.user), { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't log you in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to apply, track your applications or manage your job posts."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={input.email} onChange={(e) => setInput({ ...input, email: e.target.value })} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={input.password} onChange={(e) => setInput({ ...input, password: e.target.value })} />
        </Field>
        <Button type="submit" size="lg" className="mt-1" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Log in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <div>
        <p className="mb-3 text-sm font-medium">Continue with a demo account</p>
        <DemoButtons size="default" className="[&>button]:flex-1" next={state?.from} />
        <p className="mt-2.5 text-xs text-muted-foreground">Shared accounts with sample data. No sign-up needed.</p>
      </div>
    </AuthShell>
  );
};

export default Login;
