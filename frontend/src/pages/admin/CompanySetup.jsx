import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CompanyLogo from "@/components/common/CompanyLogo";
import Field from "@/components/common/Field";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { api, errorMessage } from "@/lib/api";

const CompanySetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [input, setInput] = useState({ name: "", description: "", website: "", location: "" });
  const [logo, setLogo] = useState(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle(company?.name || "Company");

  useEffect(() => {
    api
      .get(`/company/get/${id}`)
      .then(({ data }) => {
        setCompany(data.company);
        setInput({
          name: data.company.name || "",
          description: data.company.description || "",
          website: data.company.website || "",
          location: data.company.location || "",
        });
      })
      .catch((error) => {
        toast.error(errorMessage(error, "Couldn't load the company."));
        navigate("/admin/companies");
      });
  }, [id, navigate]);

  const locked = company?.isSeed && user?.isDemo;
  const set = (key) => (e) => setInput({ ...input, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(input).forEach(([k, v]) => body.append(k, v));
      if (logo) body.append("file", logo);
      const { data } = await api.put(`/company/update/${id}`, body);
      toast.success(data.message);
      navigate("/admin/companies");
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't save the company."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/admin/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Companies
      </Link>
      {!company ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4">
            <CompanyLogo company={company} className="size-14 rounded-xl" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              <p className="text-sm text-muted-foreground">Company details shown on your job posts</p>
            </div>
          </div>
          {locked && (
            <p className="mt-6 flex items-start gap-2 rounded-xl border bg-card p-3.5 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" />
              Sample companies are read-only on the shared demo account. Create your own company to try editing.
            </p>
          )}
          <form onSubmit={submit} className="mt-6 grid gap-4 rounded-xl border bg-card p-5 sm:p-6">
            <fieldset disabled={locked} className="grid gap-4 disabled:opacity-70">
              <Field label="Name" htmlFor="c-name">
                <Input id="c-name" required maxLength={80} value={input.name} onChange={set("name")} />
              </Field>
              <Field label="Description" htmlFor="c-desc">
                <Textarea id="c-desc" rows={4} maxLength={2000} value={input.description} onChange={set("description")} placeholder="What the company does, team size, stage" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Website" htmlFor="c-web">
                  <Input id="c-web" type="url" placeholder="https://" value={input.website} onChange={set("website")} />
                </Field>
                <Field label="Location" htmlFor="c-loc">
                  <Input id="c-loc" value={input.location} onChange={set("location")} placeholder="Bengaluru" />
                </Field>
              </div>
              <Field label="Logo" htmlFor="c-logo" hint="PNG, JPG or SVG up to 5 MB">
                <Input id="c-logo" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </Field>
            </fieldset>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/companies")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || locked}>
                {saving && <Loader2 className="animate-spin" />} Save company
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default CompanySetup;
