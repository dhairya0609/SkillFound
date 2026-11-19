import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Globe, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import EmptyState from "@/components/common/EmptyState";
import LoadError from "@/components/common/LoadError";
import Field from "@/components/common/Field";
import PageHeader from "@/components/common/PageHeader";
import { useCompanies } from "@/hooks/useCompanies";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorMessage } from "@/lib/api";

const NewCompanyDialog = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/company/register", { companyName: name });
      toast.success(data.message);
      navigate(`/admin/companies/${data.company._id}`);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't create the company."));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
          <DialogDescription>You can add a logo, description and website next.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Company name" htmlFor="company-name">
            <Input id="company-name" autoFocus required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="animate-spin" />} Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Companies = () => {
  useDocumentTitle("Companies");
  const { companies, error } = useCompanies();
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Companies"
        description="The companies you hire for. Each job post belongs to one."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> New company
          </Button>
        }
      />
      <div className="mt-8">
        {error ? (
          <LoadError error={error} onRetry={() => window.location.reload()} />
        ) : !companies ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState icon={Building2} title="No companies yet" action={<Button onClick={() => setCreating(true)}>Add your company</Button>}>
            Add the company you're hiring for, then post jobs under it.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c._id} to={`/admin/companies/${c._id}`} className="group flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-brand/40">
                <div className="flex items-center gap-3">
                  <CompanyLogo company={c} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    {c.isSeed && <p className="text-xs text-muted-foreground">Sample company</p>}
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{c.description || "No description yet."}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {c.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {c.location}
                    </span>
                  )}
                  {c.website && (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Globe className="size-3.5 shrink-0" /> <span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {creating && <NewCompanyDialog open={creating} onOpenChange={setCreating} />}
    </div>
  );
};

export default Companies;
