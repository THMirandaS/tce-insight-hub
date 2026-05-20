import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardHeader } from "@/components/pce/DashboardHeader";
import { GlobalFilters, type Filters } from "@/components/pce/GlobalFilters";
import { ChartCard } from "@/components/pce/ChartCard";
import {
  SituacaoChart, AutuacaoChart, ConsolidacaoChart, OrgaosPorTipoChart,
  PrazoMedioChart, PendenciasChart, StackedHorizontalChart,
  relatoresData, auditoresData,
} from "@/components/pce/charts";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [, setFilters] = useState<Filters>({
    ano: "all", orgao: "all", tipoOrgao: "all", relator: "all",
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto max-w-[1600px] space-y-5 px-6 py-6">
        <GlobalFilters onApply={setFilters} />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartCard
            title="Processos por situação"
            description="Quantidade absoluta e percentual"
          >
            <SituacaoChart />
          </ChartCard>
          <ChartCard
            title="Processos disponíveis para autuação"
            description="Disponível vs já autuados, por tipo de órgão"
            filterLabel="Tipo de órgão"
          >
            <AutuacaoChart />
          </ChartCard>
          <ChartCard
            title="Processos para consolidação e análise"
            description="Destaque: prontos para consolidar"
            filterLabel="Ano"
          >
            <ConsolidacaoChart />
          </ChartCard>
          <ChartCard
            title="Quantidade de órgãos por tipo"
            description="Total de órgãos por categoria"
            filterLabel="Tipo de órgão"
          >
            <OrgaosPorTipoChart />
          </ChartCard>
          <ChartCard
            title="Prazo médio de tramitação"
            description="Média de dias por situação (gargalos)"
            filterLabel="Ano"
          >
            <PrazoMedioChart />
          </ChartCard>
          <ChartCard
            title="Processos com pendências"
            description="Agrupado por tipo de pendência"
            filterLabel="Órgão"
          >
            <PendenciasChart />
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title="Processos por Relator e Situação"
            description="Barras horizontais empilhadas — distribuição por relator"
            filterLabel="Relator / Situação"
          >
            <StackedHorizontalChart data={relatoresData} />
          </ChartCard>
          <ChartCard
            title="Processos por Auditor do TCE e Situação"
            description="Barras horizontais empilhadas — distribuição por auditor"
            filterLabel="Auditor / Situação"
          >
            <StackedHorizontalChart data={auditoresData} />
          </ChartCard>
        </section>

        <footer className="pt-2 pb-6 text-center text-xs text-muted-foreground">
          PCE · Painel institucional do Tribunal de Contas do Estado · Uso interno
        </footer>
      </main>
    </div>
  );
}
