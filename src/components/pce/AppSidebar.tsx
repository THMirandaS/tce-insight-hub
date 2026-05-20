import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileStack,
  Search,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
} from "lucide-react";

type Perfil = "Coordenador" | "Auditor";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Perfil[];
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/autuacao", label: "Autuação", icon: FileStack, roles: ["Coordenador"] },
  { to: "/analises", label: "Análises", icon: Search },
];

export function AppSidebar({
  user = "Coordenador 01",
  perfil = "Coordenador",
}: {
  user?: string;
  perfil?: Perfil;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  const items = NAV.filter((i) => !i.roles || i.roles.includes(perfil));

  const width = collapsed ? "w-[68px]" : "w-[220px]";

  return (
    <aside
      className={`${width} sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/5 bg-[#0D1B2A] text-white transition-[width] duration-200`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1A56DB]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <p className="truncate text-sm font-semibold">PCE</p>
            <p className="truncate text-[11px] text-white/60">
              Prestação de Contas
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#1A56DB] text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 space-y-2">
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <UserCircle2 className="h-8 w-8 shrink-0 text-[#00C2CB]" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{user}</p>
              <p className="truncate text-[11px] text-white/60">Perfil: {perfil}</p>
            </div>
          )}
        </div>

        <Link
          to="/"
          title="Sair"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
