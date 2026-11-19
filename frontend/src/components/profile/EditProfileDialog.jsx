import { useState } from "react";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Field from "@/components/common/Field";
import { api, errorMessage } from "@/lib/api";
import { setUser } from "@/redux/authSlice";
import ProfileFields from "./ProfileFields";
import { appendProfileFields, profileToForm } from "./profileForm";

const EditProfileDialog = ({ user, open, onOpenChange }) => {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => profileToForm(user));
  const [account, setAccount] = useState({ fullName: user.fullName, email: user.email, phoneNumber: user.phoneNumber });
  const [files, setFiles] = useState({ file: null, profilePhoto: null });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      appendProfileFields(body, form);
      if (!user.isDemo) for (const [k, v] of Object.entries(account)) body.append(k, v);
      if (files.file) body.append("file", files.file);
      if (files.profilePhoto) body.append("profilePhoto", files.profilePhoto);
      const { data } = await api.post("/user/profile/update", body);
      dispatch(setUser(data.user));
      toast.success("Profile saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          {user.isDemo && <DialogDescription>Name, email and phone are locked on the shared demo account.</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" htmlFor="e-name">
              <Input id="e-name" value={account.fullName} disabled={user.isDemo} required onChange={(e) => setAccount((a) => ({ ...a, fullName: e.target.value }))} />
            </Field>
            <Field label="Email" htmlFor="e-email">
              <Input id="e-email" type="email" value={account.email} disabled={user.isDemo} required onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))} />
            </Field>
            <Field label="Phone" htmlFor="e-phone">
              <Input id="e-phone" value={account.phoneNumber} disabled={user.isDemo} required onChange={(e) => setAccount((a) => ({ ...a, phoneNumber: e.target.value }))} />
            </Field>
          </div>
          <ProfileFields form={form} setForm={setForm} idPrefix="e" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Resume (PDF)" htmlFor="e-file">
              <Input id="e-file" type="file" accept="application/pdf" onChange={(e) => setFiles((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
            </Field>
            <Field label="Photo" htmlFor="e-photo">
              <Input id="e-photo" type="file" accept="image/*" onChange={(e) => setFiles((f) => ({ ...f, profilePhoto: e.target.files?.[0] || null }))} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
