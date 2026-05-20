import { Link, useLocation } from "@tanstack/react-router";
import { ShieldCheck, LayoutDashboard, FileStack, FolderOpen, BarChart3, UserCircle2 } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/autuacao", label: "Autuação", icon: FileStack },
  { to: "/processos", label: "Processos", icon: FolderOpen },
  { to: "/analises", label: "Análises", icon: BarChart3 },
] as const;

export function TopNav({ perfil = "Coordenador", user = "Carla M. Tavares" }: { perfil?: string; user?: string }) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">PCE — Prestação de Contas Estaduais</h1>
            <p className="text-xs text-sidebar-foreground/70">Tribunal de Contas do Estado</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-full bg-sidebar-primary/15 px-2.5 py-1 text-xs font-semibold text-sidebar-primary ring-1 ring-sidebar-primary/30">
            Perfil: {perfil}
          </span>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user}</p>
            <p className="text-xs text-sidebar-foreground/70">{perfil}</p>
          </div>
          <UserCircle2 className="h-9 w-9 text-sidebar-primary" />
        </div>
      </div>
    </header>
  );
}
