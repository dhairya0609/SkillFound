export const CATEGORIES = [
  { id: "engineering", label: "Software engineering", titles: ["engineer", "developer"] },
  { id: "data", label: "Data & machine learning", titles: ["data", "machine learning", "AI"] },
  { id: "design", label: "Design", titles: ["design"] },
  { id: "product", label: "Product & operations", titles: ["product manager", "operations", "content writer"] },
  { id: "remote", label: "Remote", workModes: ["Remote"] },
  { id: "internships", label: "Internships", jobTypes: ["Internship"] },
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
