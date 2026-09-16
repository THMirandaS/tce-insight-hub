// Limites de despesa com pessoal (%) configuráveis por jurisdicionado.
// Somente Coordenador e Administrador (DTII) podem alterar; o valor é
// persistido para que a avaliação CONFORME/NÃO CONFORME use o limite vigente.

export type LimitesPessoal = {
  limiteLegal: number;
  limitePrudencial: number;
  limiteAlerta: number;
};

const KEY = "pce.limites-pessoal";

type Store = Record<string, Partial<LimitesPessoal>>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

export function getLimitesSalvos(sigla: string): Partial<LimitesPessoal> {
  return readStore()[sigla] ?? {};
}

export function salvarLimites(sigla: string, limites: LimitesPessoal): void {
  if (typeof window === "undefined") return;
  try {
    const store = readStore();
    store[sigla] = limites;
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // persistência indisponível: mantém apenas em memória
  }
}
