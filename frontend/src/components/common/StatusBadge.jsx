import { Badge } from "@/components/ui/badge";

const STYLES = {
  applied: { variant: "outline", label: "Applied" },
  viewed: { variant: "secondary", label: "Viewed" },
  shortlisted: { variant: "brand", label: "Shortlisted" },
  interview: { variant: "brand", label: "Interview" },
  offered: { variant: "success", label: "Offer" },
  rejected: { variant: "destructive", label: "Not selected" },
};

const StatusBadge = ({ status }) => {
  const s = STYLES[status] || STYLES.applied;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default StatusBadge;
