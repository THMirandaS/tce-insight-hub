import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AUDITORES } from "@/lib/pce-data";
import { ALL_ROWS } from "@/routes/analises";

// Perfis do sistema. "Executor" e "Revisor" trabalham os processos;
// o "Coordenador" atribui, valida e tramita (papel de validador).
export type Perfil = "Coordenador" | "Executor" | "Revisor";

export type Atribuicao = {
  executor: string | null;
  revisor: string | null;
};

type AtribuicoesContextValue = {
  perfil: Perfil;
  usuario: string;
  atribuicoes: Record<string, Atribuicao>;
  getAtribuicao: (id: string) => Atribuicao;
  setAtribuicao: (id: string, next: Atribuicao) => void;
};

const VAZIO: Atribuicao = { executor: null, revisor: null };

// Ids de processos que iniciam SEM atribuição (mock: 2 processos).
const SEM_ATRIBUICAO = new Set(
  ALL_ROWS.slice(4, 6).map((r) => r.id)
);

function buildInitial(): Record<string, Atribuicao> {
  const map: Record<string, Atribuicao> = {};
  ALL_ROWS.forEach((r, i) => {
    if (SEM_ATRIBUICAO.has(r.id)) {
      map[r.id] = { ...VAZIO };
      return;
    }
    const executor = AUDITORES[i % AUDITORES.length];
    let revisor = AUDITORES[(i + 2) % AUDITORES.length];
    if (revisor === executor) revisor = AUDITORES[(i + 3) % AUDITORES.length];
    map[r.id] = { executor, revisor };
  });
  return map;
}

const AtribuicoesContext = createContext<AtribuicoesContextValue | null>(null);

export function AtribuicoesProvider({ children }: { children: ReactNode }) {
  // Perfil/usuário logados (mock). Coordenador mantém todas as permissões.
  const [perfil] = useState<Perfil>("Coordenador");
  const [usuario] = useState<string>("Coordenador 01");
  const [atribuicoes, setAtribuicoes] = useState<Record<string, Atribuicao>>(
    buildInitial
  );

  const value = useMemo<AtribuicoesContextValue>(
    () => ({
      perfil,
      usuario,
      atribuicoes,
      getAtribuicao: (id) => atribuicoes[id] ?? VAZIO,
      setAtribuicao: (id, next) =>
        setAtribuicoes((prev) => ({ ...prev, [id]: next })),
    }),
    [perfil, usuario, atribuicoes]
  );

  return (
    <AtribuicoesContext.Provider value={value}>
      {children}
    </AtribuicoesContext.Provider>
  );
}

export function useAtribuicoes(): AtribuicoesContextValue {
  const ctx = useContext(AtribuicoesContext);
  if (!ctx) {
    throw new Error("useAtribuicoes must be used within AtribuicoesProvider");
  }
  return ctx;
}
