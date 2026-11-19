import { useEffect } from "react";

export const useDocumentTitle = (title) => {
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} · SkillFound` : "SkillFound · Jobs matched to your skills";
  }, [title]);
};
