import { useEffect } from "react";

export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · SkillFound` : "SkillFound · AI-assisted job search";
  }, [title]);
};
