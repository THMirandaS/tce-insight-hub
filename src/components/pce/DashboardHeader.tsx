import { ShieldCheck, UserCircle2 } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              PCE — Prestação de Contas Estaduais
            </h1>
            <p className="text-xs text-sidebar-foreground/70">
              Tribunal de Contas do Estado · Painel do Auditor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">Carla M. Tavares</p>
            <p className="text-xs text-sidebar-foreground/70">Auditora de Controle Externo</p>
          </div>
          <UserCircle2 className="h-9 w-9 text-sidebar-primary" />
        </div>
      </div>
    </header>
  );
}
