import Field from "@/components/common/Field";
import { Input, Textarea } from "@/components/ui/input";

const ProfileFields = ({ form, setForm, idPrefix = "p" }) => {
  const bind = (name) => ({
    id: `${idPrefix}-${name}`,
    name,
    value: form[name],
    onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })),
  });
  return (
    <div className="grid gap-4">
      <Field label="Headline" htmlFor={`${idPrefix}-headline`}>
        <Input {...bind("headline")} maxLength={120} placeholder="Frontend developer · React, TypeScript" />
      </Field>
      <Field label="About you" htmlFor={`${idPrefix}-bio`}>
        <Textarea {...bind("bio")} maxLength={600} rows={3} />
      </Field>
      <Field label="Skills" htmlFor={`${idPrefix}-skills`} hint="Separate with commas">
        <Textarea {...bind("skills")} rows={2} className="min-h-16" placeholder="React, Node.js, SQL" />
      </Field>
      <Field label="Experience" htmlFor={`${idPrefix}-experienceSummary`}>
        <Textarea {...bind("experienceSummary")} maxLength={1200} rows={4} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Years of experience" htmlFor={`${idPrefix}-yearsOfExperience`}>
          <Input {...bind("yearsOfExperience")} type="number" min="0" max="50" step="0.5" inputMode="decimal" />
        </Field>
        <Field label="Location" htmlFor={`${idPrefix}-location`}>
          <Input {...bind("location")} maxLength={80} placeholder="Pune" />
        </Field>
      </div>
    </div>
  );
};

export default ProfileFields;
