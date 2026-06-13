import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RefreshCcw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAtribuicoes } from "@/lib/atribuicoes";
import {
  useConsolidacao,
  type ProcessoConsolidacao,
  type ConsolPendenteStatus,
} from "@/lib/consolidacao-store";

export const Route = createFileRoute("/consolidacao")({
  component: ConsolidacaoPage,
});

const STATUS_BADGE: Record<ConsolPendenteStatus, string> = {
  Pendente: "bg-gray-200 text-gray-800",
  Processando: "bg-blue-100 text-blue-800",
  Erro: "bg-red-100 text-red-800",
};

function ConsolidacaoPage() {
  const { pendentes, consolidar } = useConsolidacao();
  const { perfil } = useAtribuicoes();
  const podeConsolidar = perfil === "Executor" || perfil === "Coordenador";

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Consolidação</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Processos recebidos do SGAP aguardando consolidação dos dados. Após
          a consolidação ser concluída, a análise inicial correspondente passa
          a aparecer em Análises com a situação "Não Iniciado".
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th>Órgão</Th>
                <Th>Nº Processo</Th>
                <Th>Exercício</Th>
                <Th>Relator</Th>
                <Th>Data de Autuação</Th>
                <Th>Status da Consolidação</Th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {pendentes.map((p) => (
                <LinhaConsolidacao
                  key={p.numero}
                  p={p}
                  podeConsolidar={podeConsolidar}
                  onConsolidar={() => consolidar(p.numero)}
                />
              ))}
              {pendentes.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    Nenhum processo pendente de consolidação.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function LinhaConsolidacao({
  p,
  podeConsolidar,
  onConsolidar,
}: {
  p: ProcessoConsolidacao;
  podeConsolidar: boolean;
  onConsolidar: () => void;
}) {
  const processando = p.status === "Processando";

  return (
    <tr className="border-t border-border bg-white hover:bg-blue-50">
      <td className="px-3 py-2.5 font-medium text-foreground">{p.orgao}</td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-foreground">
        {p.numero}
      </td>
      <td className="px-3 py-2.5 text-foreground">{p.exercicio}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
        {p.relator}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
        {p.dataAutuacao}
      </td>
      <td className="px-3 py-2.5">
        {processando ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando
          </span>
        ) : (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}
          >
            {p.status}
          </span>
        )}
        {p.status === "Erro" && (
          <p className="mt-1 text-[11px] text-red-700">
            Falha ao consolidar os dados do processo.
          </p>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        {podeConsolidar ? (
          <Button
            size="sm"
            disabled={processando}
            onClick={onConsolidar}
            className="h-8 gap-1.5 bg-[#1A56DB] px-3 text-xs text-white hover:bg-[#1A56DB]/90 disabled:opacity-60"
          >
            {processando ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando
              </>
            ) : p.status === "Erro" ? (
              <>
                <RefreshCcw className="h-3.5 w-3.5" /> Tentar novamente
              </>
            ) : (
              <>
                <Layers className="h-3.5 w-3.5" /> Consolidar
              </>
            )}
          </Button>
        ) : (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground">—</span>
              </TooltipTrigger>
              <TooltipContent>
                Apenas Executor ou Coordenador podem consolidar.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </td>
    </tr>
  );
}
