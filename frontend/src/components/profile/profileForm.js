export const profileToForm = (user, overrides = {}) => ({
  headline: user?.profile?.headline || "",
  bio: user?.profile?.bio || "",
  skills: (user?.profile?.skills || []).join(", "),
  experienceSummary: user?.profile?.experienceSummary || "",
  yearsOfExperience: user?.profile?.yearsOfExperience ?? "",
  location: user?.profile?.location || "",
  ...overrides,
});

export const appendProfileFields = (formData, form) => {
  for (const key of ["headline", "bio", "skills", "experienceSummary", "location"]) {
    formData.append(key, form[key] ?? "");
  }
  if (form.yearsOfExperience !== "" && form.yearsOfExperience != null) {
    formData.append("yearsOfExperience", String(form.yearsOfExperience));
  }
};
