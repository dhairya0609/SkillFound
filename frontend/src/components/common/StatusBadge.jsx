import { Badge } from "@/components/ui/badge";

const STYLES = {
  applied: { variant: "outline", label: "Applied" },
  shortlisted: { variant: "brand", label: "Shortlisted" },
  offered: { variant: "success", label: "Offered" },
  rejected: { variant: "destructive", label: "Not selected" },
};

const StatusBadge = ({ status }) => {
  const s = STYLES[status] || STYLES.applied;
  return <Badge variant={s.variant}>{s.label}</Badge>;
};

export default StatusBadge;
