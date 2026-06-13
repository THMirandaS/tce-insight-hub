import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_ROWS } from "@/routes/analises";
import { consolidarProcesso } from "@/lib/consolidacao";

// Status enquanto o processo ainda NÃO foi consolidado. Quando a consolidação
// conclui, o processo passa a ter status "Concluída" e sua análise inicial
// aparece em /analises.
export type ConsolPendenteStatus = "Pendente" | "Processando" | "Erro";
// Conjunto completo de status de consolidação (inclui o final "Concluída").
export type ConsolStatus = ConsolPendenteStatus | "Concluída";

export type ProcessoConsolidacao = {
  numero: string;
  orgao: string;
  exercicio: string;
  relator: string;
  dataAutuacao: string;
  status: ConsolStatus;
  // Preenchidos quando status === "Concluída".
  dataConsolidacao?: string;
  // Id da análise gerada em ALL_ROWS (para o link "Ver análise").
  analiseId?: string;
};

// Mock: 3 processos pendentes, 1 com erro e alguns já consolidados (demo).
// Usamos análises iniciais de ALL_ROWS como base para manter coerência de
// órgão/exercício/relator com a listagem de Análises.
const PEND_INDICES = [10, 22, 30];
const ERRO_INDICES = [16];
const CONCLUIDO_INDICES = [3, 7, 14, 25, 33];

const fmtData = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtAutuacao = (i: number) => fmtData(new Date(2026, 0, 5 + (i % 25)));
const fmtConsolidacao = (i: number) => fmtData(new Date(2026, 1, 12 + (i % 20)));

function buildPendentes(): ProcessoConsolidacao[] {
  const make = (
    i: number,
    status: ConsolPendenteStatus
  ): ProcessoConsolidacao | null => {
    const r = ALL_ROWS[i];
    if (!r) return null;
    return {
      numero: r.numero,
      orgao: r.orgao,
      exercicio: r.exercicio,
      relator: r.relator,
      dataAutuacao: fmtAutuacao(i),
      status,
    };
  };
  return [
    ...PEND_INDICES.map((i) => make(i, "Pendente")),
    ...ERRO_INDICES.map((i) => make(i, "Erro")),
  ].filter(Boolean) as ProcessoConsolidacao[];
}

function buildConcluidos(): ProcessoConsolidacao[] {
  return CONCLUIDO_INDICES.map((i) => {
    const r = ALL_ROWS[i];
    if (!r) return null;
    return {
      numero: r.numero,
      orgao: r.orgao,
      exercicio: r.exercicio,
      relator: r.relator,
      dataAutuacao: fmtAutuacao(i),
      status: "Concluída" as const,
      dataConsolidacao: fmtConsolidacao(i),
      analiseId: r.id,
    };
  }).filter(Boolean) as ProcessoConsolidacao[];
}

const INITIAL_PENDENTES = buildPendentes();
const INITIAL_CONCLUIDOS = buildConcluidos();
const INITIAL_PENDENTE_NUMEROS = new Set(INITIAL_PENDENTES.map((p) => p.numero));

type ConsolidacaoContextValue = {
  // Processos ainda não consolidados (Pendente | Processando | Erro).
  pendentes: ProcessoConsolidacao[];
  // Todos os processos (pendentes + concluídos) para a tela de Consolidação.
  processos: ProcessoConsolidacao[];
  // Contador da sidebar: apenas pendentes (não inclui concluídos).
  pendenteCount: number;
  // true se o processo já foi consolidado (logo, aparece em /analises).
  isConsolidado: (numero: string) => boolean;
  // true se o processo nasceu pendente de consolidação (para exibir a
  // situação inicial "Não Iniciado" quando recém consolidado).
  wasPendente: (numero: string) => boolean;
  consolidar: (numero: string) => Promise<void>;
};

const ConsolidacaoContext = createContext<ConsolidacaoContextValue | null>(null);

export function ConsolidacaoProvider({ children }: { children: ReactNode }) {
  const [pendentes, setPendentes] =
    useState<ProcessoConsolidacao[]>(INITIAL_PENDENTES);
  const [concluidos, setConcluidos] =
    useState<ProcessoConsolidacao[]>(INITIAL_CONCLUIDOS);

  const setStatus = useCallback(
    (numero: string, status: ConsolPendenteStatus) => {
      setPendentes((prev) =>
        prev.map((p) => (p.numero === numero ? { ...p, status } : p))
      );
    },
    []
  );

  const consolidar = useCallback(
    async (numero: string) => {
      setStatus(numero, "Processando");
      try {
        await consolidarProcesso(numero);
        // Concluída: sai da lista de pendências, vira concluído e surge em
        // /analises.
        setPendentes((prev) => {
          const alvo = prev.find((p) => p.numero === numero);
          if (alvo) {
            const concluido: ProcessoConsolidacao = {
              ...alvo,
              status: "Concluída",
              dataConsolidacao: fmtData(new Date()),
              analiseId: alvo.numero,
            };
            setConcluidos((c) => [concluido, ...c]);
          }
          return prev.filter((p) => p.numero !== numero);
        });
      } catch {
        setStatus(numero, "Erro");
      }
    },
    [setStatus]
  );

  const value = useMemo<ConsolidacaoContextValue>(() => {
    const pendentesNumeros = new Set(pendentes.map((p) => p.numero));
    return {
      pendentes,
      processos: [...pendentes, ...concluidos],
      pendenteCount: pendentes.length,
      isConsolidado: (numero) => !pendentesNumeros.has(numero),
      wasPendente: (numero) => INITIAL_PENDENTE_NUMEROS.has(numero),
      consolidar,
    };
  }, [pendentes, concluidos, consolidar]);

  return (
    <ConsolidacaoContext.Provider value={value}>
      {children}
    </ConsolidacaoContext.Provider>
  );
}

export function useConsolidacao(): ConsolidacaoContextValue {
  const ctx = useContext(ConsolidacaoContext);
  if (!ctx) {
    throw new Error("useConsolidacao must be used within ConsolidacaoProvider");
  }
  return ctx;
}
