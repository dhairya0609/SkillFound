import { Github } from "lucide-react";
import Logo from "./Logo";

const Footer = () => (
  <footer className="border-t">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
      <div className="max-w-sm space-y-3">
        <Logo />
        <p className="text-sm text-muted-foreground">
          An AI-assisted job board built with MongoDB, Express, React and Node, with Google Gemini for resume parsing,
          match scores and search.
        </p>
        <p className="text-xs text-muted-foreground/80">Companies and jobs shown are fictional sample data.</p>
      </div>
      <div className="flex flex-col gap-2 text-sm sm:items-end">
        <a
          href="https://github.com/dhairya0609/SkillFound"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Github className="size-4" /> Source on GitHub
        </a>
        <p className="text-muted-foreground">Built by Dhairya Shah</p>
      </div>
    </div>
  </footer>
);

export default Footer;
