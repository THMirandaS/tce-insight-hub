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

// Status de um processo enquanto ainda NÃO foi consolidado. Quando a
// consolidação conclui, o processo deixa esta lista e sua análise inicial
// passa a aparecer em /analises com situação "Não Iniciado".
export type ConsolPendenteStatus = "Pendente" | "Processando" | "Erro";

export type ProcessoConsolidacao = {
  numero: string;
  orgao: string;
  exercicio: string;
  relator: string;
  dataAutuacao: string;
  status: ConsolPendenteStatus;
};

// Mock: 3 processos pendentes de consolidação e 1 com erro.
// Usamos análises iniciais de ALL_ROWS como base para manter coerência de
// órgão/exercício/relator com a listagem de Análises.
const PEND_INDICES = [10, 22, 30];
const ERRO_INDICES = [16];

const fmtAutuacao = (i: number) =>
  new Date(2026, 0, 5 + (i % 25)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function buildInitial(): ProcessoConsolidacao[] {
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

const INITIAL = buildInitial();
const INITIAL_PENDENTE_NUMEROS = new Set(INITIAL.map((p) => p.numero));

type ConsolidacaoContextValue = {
  // Processos ainda não consolidados (Pendente | Processando | Erro).
  pendentes: ProcessoConsolidacao[];
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
  const [pendentes, setPendentes] = useState<ProcessoConsolidacao[]>(INITIAL);

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
        // Concluída: sai da lista de pendências e surge em /analises.
        setPendentes((prev) => prev.filter((p) => p.numero !== numero));
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
      pendenteCount: pendentes.length,
      isConsolidado: (numero) => !pendentesNumeros.has(numero),
      wasPendente: (numero) => INITIAL_PENDENTE_NUMEROS.has(numero),
      consolidar,
    };
  }, [pendentes, consolidar]);

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
