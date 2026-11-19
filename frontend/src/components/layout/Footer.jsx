import { Link } from "react-router-dom";
import { Github } from "lucide-react";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Find work",
    links: [
      { to: "/jobs", label: "Browse jobs" },
      { to: "/jobs?category=remote", label: "Remote jobs" },
      { to: "/jobs?category=internships", label: "Internships" },
      { to: "/companies", label: "Companies" },
    ],
  },
  {
    title: "Your account",
    links: [
      { to: "/signup", label: "Create an account" },
      { to: "/my-jobs", label: "My jobs" },
      { to: "/profile", label: "Profile" },
    ],
  },
  {
    title: "Employers",
    links: [
      { to: "/employers", label: "Hire with SkillFound" },
      { to: "/signup?role=recruiter", label: "Post a job" },
      { to: "/admin/jobs", label: "Employer dashboard" },
    ],
  },
  {
    title: "SkillFound",
    links: [
      { to: "/about", label: "About" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { href: "https://github.com/dhairya0609/SkillFound", label: "GitHub" },
    ],
  },
];

const Footer = () => (
  <footer className="border-t bg-card/30">
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Jobs with the salary shown and a clear read on how your skills match. Free for job seekers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-medium">{col.title}</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <a href={l.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                        <Github className="size-3.5" /> {l.label}
                      </a>
                    ) : (
                      <Link to={l.to} className="text-muted-foreground hover:text-foreground">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SkillFound</p>
        <p>Companies and jobs listed here are sample data.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
