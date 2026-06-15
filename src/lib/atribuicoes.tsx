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

// Usuário do sistema. O perfil é único por usuário e global (não há
// vínculo de perfil com processo específico).
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

type AtribuicoesContextValue = {
  // Sessão (usuário/perfil ativo no app).
  perfil: Perfil;
  usuario: string;
  usuarioAtivoId: string;
  setUsuarioAtivo: (id: string) => void;
  // Cadastro de usuários e perfis.
  usuarios: Usuario[];
  addUsuario: (u: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, patch: Partial<Omit<Usuario, "id">>) => void;
  // Transferência de coordenação: o Coordenador atual passa a ter outro perfil
  // (Executor/Revisor) e indica quem assumirá a coordenação. Mantém apenas
  // 1 Coordenador ativo por vez.
  transferirCoordenacao: (
    coordenadorAtualId: string,
    novoPerfilAtual: Perfil,
    novoCoordenadorId: string
  ) => void;
  // Atribuição de executor/revisor por processo.
  atribuicoes: Record<string, Atribuicao>;
  getAtribuicao: (id: string) => Atribuicao;
  setAtribuicao: (id: string, next: Atribuicao) => void;
};

const VAZIO: Atribuicao = { executor: null, revisor: null };

// Ids de processos que iniciam SEM atribuição (mock: 2 processos).
const SEM_ATRIBUICAO = new Set(ALL_ROWS.slice(4, 6).map((r) => r.id));

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

function emailDe(nome: string): string {
  const slug = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@tce.gov.br`;
}

// Cadastro inicial (mock): um Coordenador + a lista de analistas distribuída
// entre Executor e Revisor. Todos vêm ativos (como se viessem do AD).
function buildUsuarios(): Usuario[] {
  const lista: Usuario[] = [
    {
      id: "u-coord-01",
      nome: "Coordenador 01",
      email: emailDe("Coordenador 01"),
      perfil: "Coordenador",
      ativo: true,
    },
  ];
  AUDITORES.forEach((nome, i) => {
    lista.push({
      id: `u-${i + 1}`,
      nome,
      email: emailDe(nome),
      perfil: i % 2 === 0 ? "Executor" : "Revisor",
      ativo: true,
    });
  });
  return lista;
}

const AtribuicoesContext = createContext<AtribuicoesContextValue | null>(null);

export function AtribuicoesProvider({ children }: { children: ReactNode }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(buildUsuarios);
  // Usuário logado (mock): inicia como o Coordenador.
  const [usuarioAtivoId, setUsuarioAtivoId] = useState<string>("u-coord-01");
  const [atribuicoes, setAtribuicoes] = useState<Record<string, Atribuicao>>(
    buildInitial
  );

  const value = useMemo<AtribuicoesContextValue>(() => {
    const ativo =
      usuarios.find((u) => u.id === usuarioAtivoId) ?? usuarios[0];
    return {
      perfil: ativo?.perfil ?? "Coordenador",
      usuario: ativo?.nome ?? "—",
      usuarioAtivoId: ativo?.id ?? usuarioAtivoId,
      setUsuarioAtivo: setUsuarioAtivoId,
      usuarios,
      addUsuario: (u) =>
        setUsuarios((prev) => [
          ...prev,
          { ...u, id: `u-${Date.now().toString(36)}` },
        ]),
      updateUsuario: (id, patch) =>
        setUsuarios((prev) =>
          prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
        ),
      transferirCoordenacao: (
        coordenadorAtualId,
        novoPerfilAtual,
        novoCoordenadorId
      ) =>
        setUsuarios((prev) =>
          prev.map((u) => {
            if (u.id === coordenadorAtualId) {
              return { ...u, perfil: novoPerfilAtual };
            }
            if (u.id === novoCoordenadorId) {
              return { ...u, perfil: "Coordenador" as Perfil };
            }
            return u;
          })
        ),
      atribuicoes,
      getAtribuicao: (id) => atribuicoes[id] ?? VAZIO,
      setAtribuicao: (id, next) =>
        setAtribuicoes((prev) => ({ ...prev, [id]: next })),
    };
  }, [usuarios, usuarioAtivoId, atribuicoes]);

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
