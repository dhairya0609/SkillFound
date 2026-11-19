import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const NotFound = () => {
  useDocumentTitle("Page not found");
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        action={
          <>
            <Button asChild>
              <Link to="/jobs">Browse jobs</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Home</Link>
            </Button>
          </>
        }
      >
        The link may be old, or the job may have been removed.
      </EmptyState>
    </div>
  );
};

export default NotFound;
