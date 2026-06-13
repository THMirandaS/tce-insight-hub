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
  // Lista bruta de registros explícitos por (jurisdicionado, ano).
  registros: JurisdicionadoExercicio[];
  // Atributos efetivos de um jurisdicionado em um ano (com herança).
  getAtributos: (jurisdicionado: string, ano: string) => AtributosResult;
  // Registro explícito (se existir) de um jurisdicionado em um ano.
  getRegistro: (
    jurisdicionado: string,
    ano: string
  ) => JurisdicionadoExercicio | undefined;
  // Salva/atualiza os atributos de um jurisdicionado em um ano específico.
  // Vale para TODOS os processos daquele órgão naquele exercício.
  // Ao salvar, o registro deixa de estar pendente de confirmação.
  setAtributos: (
    jurisdicionado: string,
    ano: string,
    attrs: AtributosExercicio
  ) => void;
  // Copia, para o ano informado, os atributos do exercício anterior de
  // todos os jurisdicionados que ainda não possuem cadastro nesse ano.
  // Os registros criados ficam marcados como pendentes de confirmação.
  // Retorna a quantidade de registros copiados.
  copiarExercicioAnterior: (ano: string) => number;
  // Confirma um registro pendente (remove a marca de pendência).
  confirmar: (jurisdicionado: string, ano: string) => void;
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

  const getRegistro = useCallback(
    (jurisdicionado: string, ano: string) =>
      registros.find(
        (r) => r.jurisdicionado === jurisdicionado && r.ano === ano
      ),
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
          pendente: false,
        };
        if (idx >= 0) next[idx] = registro;
        else next.push(registro);
        return next;
      });
    },
    []
  );

  const copiarExercicioAnterior = useCallback(
    (ano: string): number => {
      const anoAnterior = String(Number(ano) - 1);
      let copiados = 0;
      setRegistros((prev) => {
        const existentes = new Set(
          prev
            .filter((r) => r.ano === ano)
            .map((r) => r.jurisdicionado)
        );
        const origem = prev.filter((r) => r.ano === anoAnterior);
        const novos: JurisdicionadoExercicio[] = origem
          .filter((r) => !existentes.has(r.jurisdicionado))
          .map((r) => ({
            jurisdicionado: r.jurisdicionado,
            ano,
            grupoEntidade: r.grupoEntidade,
            entidadePrevidenciaria: r.entidadePrevidenciaria,
            poder: r.poder,
            pendente: true,
          }));
        copiados = novos.length;
        if (!novos.length) return prev;
        return [...prev, ...novos];
      });
      return copiados;
    },
    []
  );

  const confirmar = useCallback((jurisdicionado: string, ano: string) => {
    setRegistros((prev) =>
      prev.map((r) =>
        r.jurisdicionado === jurisdicionado && r.ano === ano
          ? { ...r, pendente: false }
          : r
      )
    );
  }, []);

  const value = useMemo<JurisdicionadosContextValue>(
    () => ({
      registros,
      getAtributos,
      getRegistro,
      setAtributos,
      copiarExercicioAnterior,
      confirmar,
    }),
    [
      registros,
      getAtributos,
      getRegistro,
      setAtributos,
      copiarExercicioAnterior,
      confirmar,
    ]
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
