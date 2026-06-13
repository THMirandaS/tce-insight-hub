import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ATRIBUTOS_EXERCICIO,
  getAtributos as getAtributosBase,
  type AtributosExercicio,
  type AtributosResult,
  type JurisdicionadoExercicio,
} from "@/lib/pce-data";

type JurisdicionadosContextValue = {
  // Atributos efetivos de um jurisdicionado em um ano (com herança).
  getAtributos: (jurisdicionado: string, ano: string) => AtributosResult;
  // Salva/atualiza os atributos de um jurisdicionado em um ano específico.
  // Vale para TODOS os processos daquele órgão naquele exercício.
  setAtributos: (
    jurisdicionado: string,
    ano: string,
    attrs: AtributosExercicio
  ) => void;
};

const JurisdicionadosContext =
  createContext<JurisdicionadosContextValue | null>(null);

export function JurisdicionadosProvider({ children }: { children: ReactNode }) {
  const [registros, setRegistros] = useState<JurisdicionadoExercicio[]>(() =>
    ATRIBUTOS_EXERCICIO.map((r) => ({ ...r }))
  );

  const getAtributos = useCallback(
    (jurisdicionado: string, ano: string): AtributosResult =>
      getAtributosBase(jurisdicionado, ano, registros),
    [registros]
  );

  const setAtributos = useCallback(
    (jurisdicionado: string, ano: string, attrs: AtributosExercicio) => {
      setRegistros((prev) => {
        const idx = prev.findIndex(
          (r) => r.jurisdicionado === jurisdicionado && r.ano === ano
        );
        const next = [...prev];
        const registro: JurisdicionadoExercicio = {
          jurisdicionado,
          ano,
          ...attrs,
        };
        if (idx >= 0) next[idx] = registro;
        else next.push(registro);
        return next;
      });
    },
    []
  );

  const value = useMemo<JurisdicionadosContextValue>(
    () => ({ getAtributos, setAtributos }),
    [getAtributos, setAtributos]
  );

  return (
    <JurisdicionadosContext.Provider value={value}>
      {children}
    </JurisdicionadosContext.Provider>
  );
}

export function useJurisdicionados(): JurisdicionadosContextValue {
  const ctx = useContext(JurisdicionadosContext);
  if (!ctx) {
    throw new Error(
      "useJurisdicionados must be used within JurisdicionadosProvider"
    );
  }
  return ctx;
}
