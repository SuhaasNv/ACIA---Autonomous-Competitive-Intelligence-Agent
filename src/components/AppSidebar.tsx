import { NavLink as RouterNavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard", label: "Competitors", icon: Users },
  { to: "/report", label: "Reports", icon: FileText },
];

const AppSidebar = () => {
  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border/50 bg-sidebar h-screen sticky top-0">
      <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
        <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center">
          <div className="h-3 w-3 rounded-sm bg-primary" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <RouterNavLink
            key={link.label}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </RouterNavLink>
        ))}
      </nav>

      <div className="border-t border-border/50 p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Free Plan</p>
          <p className="text-xs text-muted-foreground mt-1">3 of 5 competitors used</p>
          <div className="mt-2 h-1 w-full rounded-full bg-muted">
            <div className="h-1 w-3/5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
