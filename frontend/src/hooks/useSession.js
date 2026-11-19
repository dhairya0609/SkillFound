import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { setUser } from "@/redux/authSlice";

export const useSessionRefresh = () => {
  const dispatch = useDispatch();
  const hasUser = useSelector((s) => Boolean(s.auth.user));
  const checked = useRef(false);

  useEffect(() => {
    if (!hasUser || checked.current) return;
    checked.current = true;
    api
      .get("/user/me")
      .then(({ data }) => dispatch(setUser(data.user)))
      .catch(() => {});
  }, [hasUser, dispatch]);
};

export const useServerWakeNotice = () => {
  useEffect(() => {
    let done = false;
    let toastId;
    const timer = setTimeout(() => {
      if (!done) {
        toastId = toast.loading("Waking up the server…", {
          description: "It sleeps when idle on free hosting. This takes up to a minute, once.",
        });
      }
    }, 2500);
    api
      .get("/health", { timeout: 90000 })
      .catch(() => {})
      .finally(() => {
        done = true;
        clearTimeout(timer);
        if (toastId) {
          toast.success("Server is up", { id: toastId, description: undefined, duration: 2000 });
        }
      });
    return () => clearTimeout(timer);
  }, []);
};
