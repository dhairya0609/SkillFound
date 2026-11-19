import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Briefcase, Building2, LayoutDashboard, LogOut, Menu, Plus, Search, UserRound, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/UserAvatar";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const linksFor = (user) => {
  if (user?.role === "recruiter") {
    return [
      { to: "/admin/jobs", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/companies", label: "Your companies", icon: Building2 },
      { to: "/jobs", label: "Job board", icon: Search },
    ];
  }
  const links = [
    { to: "/jobs", label: "Jobs", icon: Search },
    { to: "/companies", label: "Companies", icon: Building2 },
  ];
  if (user) links.push({ to: "/profile", label: "Profile", icon: UserRound });
  else links.push({ to: "/for-recruiters", label: "For recruiters", icon: Briefcase });
  return links;
};

const postJobPath = (user) => (user?.role === "recruiter" ? "/admin/jobs/create" : "/signup?role=recruiter");

const navClass = ({ isActive }) =>
  cn(
    "rounded-md px-3 py-1.5 text-sm transition-colors",
    isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
  );

const Navbar = () => {
  const { user, isCandidate } = useAuth();
  const logout = useLogout();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const links = linksFor(user);
  const showPostJob = !isCandidate;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo to={user?.role === "recruiter" ? "/admin/jobs" : "/"} />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={navClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {!user && (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/login" state={{ from: pathname }}>
                  Log in
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link to="/signup">Sign up</Link>
              </Button>
            </>
          )}
          {showPostJob && (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to={postJobPath(user)}>
                <Plus /> Post a job
              </Link>
            </Button>
          )}
          {user && (
            <Popover open={userOpen} onOpenChange={setUserOpen}>
              <PopoverTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" aria-label="Account menu">
                  <UserAvatar user={user} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 rounded-xl p-1.5">
                <div className="flex items-center gap-3 px-2.5 py-2">
                  <UserAvatar user={user} className="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {user.isDemo && (
                  <div className="mx-2.5 mb-1.5">
                    <Badge variant="brand">Demo {user.role === "recruiter" ? "recruiter" : "candidate"}</Badge>
                  </div>
                )}
                <div className="my-1 h-px bg-border" />
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                  >
                    <l.icon className="size-4 text-muted-foreground" />
                    {l.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setUserOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-accent"
                >
                  <LogOut className="size-4 text-muted-foreground" />
                  Log out
                </button>
              </PopoverContent>
            </Popover>
          )}
          <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
        </div>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 max-w-none translate-x-0 translate-y-0 rounded-none rounded-b-2xl border-x-0 border-t-0 p-4 sm:max-w-none data-[state=open]:slide-in-from-top-4 data-[state=open]:zoom-in-100"
        >
          <div className="flex items-center justify-between">
            <DialogTitle asChild>
              <div>
                <Logo />
              </div>
            </DialogTitle>
            <Button variant="ghost" size="icon-sm" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <X />
            </Button>
          </div>
          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px]", isActive ? "bg-accent" : "hover:bg-accent")
                }
              >
                <l.icon className="size-4 text-muted-foreground" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          {(!user || showPostJob) && (
            <div className="grid gap-2 border-t pt-4">
              {showPostJob && (
                <Button asChild onClick={() => setMenuOpen(false)}>
                  <Link to={postJobPath(user)}>
                    <Plus /> Post a job
                  </Link>
                </Button>
              )}
              {!user && (
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                    <Link to="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
