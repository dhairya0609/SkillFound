import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { signedIn, signedOut } from "@/redux/authSlice";

export const useAuth = () => {
  const user = useSelector((s) => s.auth.user);
  return {
    user,
    isCandidate: user?.role === "student",
    isRecruiter: user?.role === "recruiter",
  };
};

export const homeFor = (user) => (user?.role === "recruiter" ? "/admin/jobs" : "/jobs");

export const useDemoLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);

  const start = useCallback(
    async (role, next) => {
      setPending(role);
      try {
        const { data } = await api.post("/user/demo", { role });
        dispatch(signedIn({ user: data.user, token: data.token }));
        toast.success(data.message, {
          description: role === "recruiter" ? "Shared demo account: anything you create is visible to other visitors." : "Shared demo account: profile edits are visible to other visitors.",
        });
        navigate(next || homeFor(data.user));
      } catch (error) {
        toast.error(errorMessage(error, "Couldn't start the demo."));
      } finally {
        setPending(null);
      }
    },
    [dispatch, navigate]
  );

  return { start, pending };
};

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return useCallback(async () => {
    try {
      await api.post("/user/logout");
    } catch {
      // The local session is cleared either way.
    }
    navigate("/", { replace: true, flushSync: true });
    dispatch(signedOut());
    toast.success("Logged out");
  }, [dispatch, navigate]);
};
