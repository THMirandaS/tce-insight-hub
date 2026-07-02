import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
  RefreshCcw,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtribuicoes, type Perfil } from "@/lib/atribuicoes";
import { useConsolidacao } from "@/lib/consolidacao-store";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Perfil[];
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/usuarios", label: "Usuários", icon: Users, roles: ["Coordenador"] },
  { to: "/consolidacao", label: "Consolidação", icon: RefreshCcw },
  { to: "/analises", label: "Análises", icon: Search },
];

export function AppSidebar({ user }: { user?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { perfil, usuarios, usuarioAtivoId, setUsuarioAtivo } =
    useAtribuicoes();
  const { pendenteCount } = useConsolidacao();

  const items = NAV.filter((i) => !i.roles || i.roles.includes(perfil));
  const usuariosAtivos = usuarios.filter((u) => u.ativo);

  const forcedCollapsed = /^\/analises\/[^/]+/.test(pathname);
  const isCollapsed = collapsed || forcedCollapsed;
  const width = isCollapsed ? "w-[68px]" : "w-[220px]";

  return (
    <aside
      className={`${width} sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/5 bg-[#0D1B2A] text-white transition-[width] duration-200`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
        <img
          src={pceLogo}
          alt="PCE — Prestação de Contas Estaduais"
          className="h-9 w-9 shrink-0 object-contain"
          width={36}
          height={36}
        />
        {!isCollapsed && (
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
            const badge = to === "/consolidacao" ? pendenteCount : 0;
            return (
              <li key={to}>
                <Link
                  to={to}
                  title={isCollapsed ? label : undefined}
                  className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#1A56DB] text-white shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-5 w-5" />
                    {badge > 0 && isCollapsed && (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold text-[#0D1B2A]">
                        {badge}
                      </span>
                    )}
                  </span>
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{label}</span>
                  )}
                  {!isCollapsed && badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F59E0B] px-1.5 text-[11px] font-bold text-[#0D1B2A]">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 space-y-2">
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-white/50">
              Usuário ativo
            </p>
            <Select value={usuarioAtivoId} onValueChange={setUsuarioAtivo}>
              <SelectTrigger className="h-auto w-full border-white/10 bg-white/5 py-2 text-left text-white hover:bg-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {usuariosAtivos.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome} — {u.perfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md bg-white/5 text-xs font-semibold text-[#00C2CB]"
            title={`Perfil: ${perfil}`}
          >
            {perfil.slice(0, 1)}
          </div>
        )}

        <Link
          to="/"
          title="Sair"
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sair</span>}
        </Link>

        {!forcedCollapsed && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white ${
              isCollapsed ? "justify-center" : ""
            }`}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
