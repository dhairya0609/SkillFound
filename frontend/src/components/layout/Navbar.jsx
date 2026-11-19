import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Briefcase, Building2, FileText, LayoutDashboard, LogOut, Menu, Search, UserRound, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/common/UserAvatar";
import { useAlertCount } from "@/hooks/useAlertCount";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const linksFor = (user) => {
  if (user?.role === "recruiter") {
    return [
      { to: "/admin/jobs", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/jobs/create", label: "Post a job", icon: FileText },
      { to: "/admin/companies", label: "Your companies", icon: Building2 },
      { to: "/jobs", label: "Job board", icon: Search },
    ];
  }
  const links = [
    { to: "/jobs", label: "Jobs", icon: Search },
    { to: "/companies", label: "Companies", icon: Building2 },
  ];
  if (user) links.push({ to: "/my-jobs", label: "My jobs", icon: Briefcase, badge: true });
  return links;
};

const navClass = ({ isActive }) =>
  cn(
    "relative inline-flex h-14 items-center gap-1.5 px-3 text-sm transition-colors",
    "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full",
    isActive ? "font-medium text-foreground after:bg-primary" : "text-muted-foreground hover:text-foreground"
  );

const CountBadge = ({ count }) =>
  count > 0 ? (
    <span className="min-w-5 rounded-full bg-primary px-1.5 text-center text-[11px] leading-5 font-semibold text-primary-foreground tabular-nums">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> new matches</span>
    </span>
  ) : null;

const Navbar = () => {
  const { user } = useAuth();
  const logout = useLogout();
  const alertCount = useAlertCount();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const links = linksFor(user);
  const accountLinks = user?.role === "student" ? [{ to: "/profile", label: "Profile", icon: UserRound }, ...links.filter((l) => l.to === "/my-jobs")] : links;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
        <Logo to={user?.role === "recruiter" ? "/admin/jobs" : "/"} />
        <nav className="ml-6 hidden items-center md:flex" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={navClass}>
              {l.label}
              {l.badge && <CountBadge count={alertCount} />}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {!user && (
            <Link
              to="/employers"
              className="mr-2 hidden text-sm text-muted-foreground transition-colors hover:text-foreground lg:inline"
            >
              For employers
            </Link>
          )}
          <ThemeToggle />
          {!user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login" state={{ from: pathname + search }}>
                  Sign in
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link to="/signup">Join</Link>
              </Button>
            </>
          ) : (
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
                    <Badge variant="brand">Shared demo account</Badge>
                  </div>
                )}
                <div className="my-1 h-px bg-border" />
                {accountLinks.map((l) => (
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
                  Sign out
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
            {[...links, ...(user?.role === "student" ? [{ to: "/profile", label: "Profile", icon: UserRound }] : [])].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px]", isActive ? "bg-accent font-medium" : "hover:bg-accent")}
              >
                <l.icon className="size-4 text-muted-foreground" />
                {l.label}
                {l.badge && <CountBadge count={alertCount} />}
              </NavLink>
            ))}
          </nav>
          {!user && (
            <div className="grid gap-2 border-t pt-4">
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={() => setMenuOpen(false)}>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild onClick={() => setMenuOpen(false)}>
                  <Link to="/signup">Join</Link>
                </Button>
              </div>
              <Link to="/employers" onClick={() => setMenuOpen(false)} className="py-2 text-center text-sm text-muted-foreground hover:text-foreground">
                For employers
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Navbar;
