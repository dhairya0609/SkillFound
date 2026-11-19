import { Link, useLocation } from "react-router-dom";
import { CloudOff, Lock, SearchX, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "./EmptyState";

const ICONS = { network: CloudOff, server: ServerCrash, auth: Lock, forbidden: Lock, notfound: SearchX };

const LoadError = ({ error, onRetry, className }) => {
  const location = useLocation();
  if (!error) return null;
  const Icon = ICONS[error.kind] || CloudOff;
  let action = null;
  if (error.kind === "auth") {
    action = (
      <Button asChild>
        <Link to="/login" state={{ from: location.pathname + location.search }}>
          Log in
        </Link>
      </Button>
    );
  } else if (error.kind === "notfound" || error.kind === "forbidden") {
    action = (
      <Button asChild variant="outline">
        <Link to="/jobs">Browse jobs</Link>
      </Button>
    );
  } else if (onRetry) {
    action = <Button onClick={onRetry}>Try again</Button>;
  }
  return (
    <EmptyState icon={Icon} title={error.title} action={action} className={className}>
      {error.message}
    </EmptyState>
  );
};

export default LoadError;
