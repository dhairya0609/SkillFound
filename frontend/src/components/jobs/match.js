export const matchTier = (score) => {
  if (score >= 80) return { label: "Strong match", tone: "text-success", bg: "bg-success/12", stroke: "stroke-success" };
  if (score >= 60) return { label: "Good match", tone: "text-brand", bg: "bg-brand-soft", stroke: "stroke-brand" };
  if (score >= 40) return { label: "Partial match", tone: "text-warning", bg: "bg-warning/14", stroke: "stroke-warning" };
  return { label: "Low match", tone: "text-muted-foreground", bg: "bg-muted", stroke: "stroke-muted-foreground" };
};
