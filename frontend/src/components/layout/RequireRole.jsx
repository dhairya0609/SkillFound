import { Navigate, useLocation } from "react-router-dom";
import { useAuth, homeFor } from "@/hooks/useAuth";

const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user)} replace />;
  return children;
};

export default RequireRole;
