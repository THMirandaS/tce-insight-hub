import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ALL_ROWS } from "@/routes/analises";
import {
  consolidarProcesso,
  type ConsolidacaoStatus,
} from "@/lib/consolidacao";

type ConsolidacaoContextValue = {
  getStatus: (id: string) => ConsolidacaoStatus;
  consolidar: (id: string) => Promise<void>;
};

// Mock inicial: 2 processos pendentes de consolidação e 1 com erro para teste.
// Os demais já chegam consolidados (Concluída).
const PENDENTES = new Set(
  [ALL_ROWS[10]?.id, ALL_ROWS[22]?.id].filter(Boolean) as string[]
);
const ERROS = new Set([ALL_ROWS[16]?.id].filter(Boolean) as string[]);

function buildInitial(): Record<string, ConsolidacaoStatus> {
  const map: Record<string, ConsolidacaoStatus> = {};
  ALL_ROWS.forEach((r) => {
    map[r.id] = PENDENTES.has(r.id)
      ? "Pendente"
      : ERROS.has(r.id)
        ? "Erro"
        : "Concluída";
  });
  return map;
}

const ConsolidacaoContext = createContext<ConsolidacaoContextValue | null>(null);

export function ConsolidacaoProvider({ children }: { children: ReactNode }) {
  const [statusMap, setStatusMap] = useState<
    Record<string, ConsolidacaoStatus>
  >(buildInitial);

  const getStatus = useCallback(
    (id: string): ConsolidacaoStatus => statusMap[id] ?? "Concluída",
    [statusMap]
  );

  const consolidar = useCallback(async (id: string) => {
    setStatusMap((prev) => ({ ...prev, [id]: "Processando" }));
    try {
      await consolidarProcesso(id);
      setStatusMap((prev) => ({ ...prev, [id]: "Concluída" }));
    } catch {
      setStatusMap((prev) => ({ ...prev, [id]: "Erro" }));
    }
  }, []);

  return (
    <ConsolidacaoContext.Provider value={{ getStatus, consolidar }}>
      {children}
    </ConsolidacaoContext.Provider>
  );
}

export function useConsolidacao(): ConsolidacaoContextValue {
  const ctx = useContext(ConsolidacaoContext);
  if (!ctx) {
    throw new Error(
      "useConsolidacao must be used within ConsolidacaoProvider"
    );
  }
  return ctx;
}
