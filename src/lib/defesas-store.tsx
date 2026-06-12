import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ALL_ROWS, type Row } from "@/routes/analises";

// RF23 — Um processo tem 1 análise inicial e pode ter VÁRIAS rodadas de
// defesa documental. As defesas criadas dinamicamente (ação "Nova defesa")
// ficam neste store; as defesas mockadas continuam em ALL_ROWS.

const fmt = (d: Date) =>
  d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

type DefesasContextValue = {
  // Defesas criadas dinamicamente.
  defesasExtra: Row[];
  // Todas as análises (iniciais + defesas mockadas + defesas criadas).
  allRows: Row[];
  getRow: (id: string) => Row | undefined;
  // Defesas (mock + criadas) de um número de processo, ordenadas por rodada.
  defesasDoProcesso: (numero: string) => Row[];
  // Cria a próxima rodada de defesa de um processo. Retorna o id criado.
  criarDefesa: (numero: string) => string | null;
};

const DefesasContext = createContext<DefesasContextValue | null>(null);

const CONCLUIDAS = new Set(["Concluído", "Validado"]);

export function DefesasProvider({ children }: { children: ReactNode }) {
  const [defesasExtra, setDefesasExtra] = useState<Row[]>([]);

  const value = useMemo<DefesasContextValue>(() => {
    const allRows = [...ALL_ROWS, ...defesasExtra];

    const defesasDoProcesso = (numero: string) =>
      allRows
        .filter(
          (r) => r.numero === numero && r.tipoAnalise === "Análise de Defesa"
        )
        .sort((a, b) => (a.nrDefesa ?? 0) - (b.nrDefesa ?? 0));

    return {
      defesasExtra,
      allRows,
      getRow: (id) => allRows.find((r) => r.id === id),
      defesasDoProcesso,
      criarDefesa: (numero) => {
        // Herda processo, órgão e relator da análise inicial.
        const inicial = ALL_ROWS.find(
          (r) => r.numero === numero && r.tipoAnalise === "Análise Inicial"
        );
        if (!inicial) return null;

        const defesas = defesasDoProcesso(numero);
        // Só pode haver 1 defesa em aberto: a anterior precisa estar concluída.
        const aberta = defesas.some((d) => !CONCLUIDAS.has(d.situacao));
        if (aberta) return null;

        const proxNr =
          defesas.reduce((m, d) => Math.max(m, d.nrDefesa ?? 0), 0) + 1;
        const id = `${numero}-D${proxNr}`;
        const hoje = new Date();
        const nova: Row = {
          ...inicial,
          id,
          tipoAnalise: "Análise de Defesa",
          nrDefesa: proxNr,
          situacao: "Em Análise",
          dtCriacao: fmt(hoje),
          dtConclusao: "—",
        };
        setDefesasExtra((prev) => [...prev, nova]);
        return id;
      },
    };
  }, [defesasExtra]);

  return (
    <DefesasContext.Provider value={value}>{children}</DefesasContext.Provider>
  );
}

export function useDefesas(): DefesasContextValue {
  const ctx = useContext(DefesasContext);
  if (!ctx) {
    throw new Error("useDefesas must be used within DefesasProvider");
  }
  return ctx;
}
