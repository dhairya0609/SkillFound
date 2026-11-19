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

const SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1,000", "1,000+"];

const CompanySetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [input, setInput] = useState({ name: "", description: "", website: "", location: "", tagline: "", industry: "", size: "", founded: "", locations: "" });
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
          tagline: data.company.tagline || "",
          industry: data.company.industry || "",
          size: data.company.size || "",
          founded: data.company.founded ? String(data.company.founded) : "",
          locations: (data.company.locations || []).join(", "),
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
              <Field label="Tagline" htmlFor="c-tag" hint="One line candidates see under your name.">
                <Input id="c-tag" maxLength={140} value={input.tagline} onChange={set("tagline")} placeholder="Payments infrastructure for small businesses" />
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
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Industry" htmlFor="c-ind">
                  <Input id="c-ind" maxLength={60} value={input.industry} onChange={set("industry")} placeholder="Fintech" />
                </Field>
                <Field label="Company size" htmlFor="c-size">
                  <select
                    id="c-size"
                    value={input.size}
                    onChange={set("size")}
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
                  >
                    <option value="">Select</option>
                    {SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} employees
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Founded" htmlFor="c-founded">
                  <Input id="c-founded" type="number" min="1800" max={new Date().getFullYear()} inputMode="numeric" value={input.founded} onChange={set("founded")} placeholder="2019" />
                </Field>
              </div>
              <Field label="Office locations" htmlFor="c-locs" hint="Separate with commas.">
                <Input id="c-locs" value={input.locations} onChange={set("locations")} placeholder="Bengaluru, Remote (India)" />
              </Field>
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
