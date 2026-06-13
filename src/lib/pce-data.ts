export const SITUACOES = [
  "Concluído",
  "Revisado",
  "Validado",
  "Em Correção",
  "Disponível",
  "Em Andamento",
] as const;

export const TIPOS_ORGAO = [
  "Poder Executivo",
  "Poder Legislativo",
  "Poder Judiciário",
  "Autarquias",
  "Fundações",
];

export const ANOS = ["2021", "2022", "2023", "2024", "2025"];

// ---------------------------------------------------------------------------
// Jurisdicionados (RF02) — cadastro de atributos
// ---------------------------------------------------------------------------

export const GRUPOS_ENTIDADE = [
  "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA",
  "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO",
  "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS",
  "FUNDOS ESTADUAIS",
] as const;

export type GrupoEntidade = (typeof GRUPOS_ENTIDADE)[number];

export const PODERES = [
  "PODER EXECUTIVO",
  "PODER LEGISLATIVO",
  "PODER JUDICIÁRIO",
  "MINISTÉRIO PÚBLICO",
  "DEFENSORIA PÚBLICA",
] as const;

export type Poder = (typeof PODERES)[number];

// Identidade do jurisdicionado — estável entre exercícios.
export type Jurisdicionado = {
  nome: string;
  sigla: string;
};

// Atributos que podem variar de um exercício para outro.
export type AtributosExercicio = {
  grupoEntidade: GrupoEntidade;
  entidadePrevidenciaria: boolean;
  poder: Poder;
};

// Atributos de um jurisdicionado em um ano de exercício específico.
export type JurisdicionadoExercicio = AtributosExercicio & {
  jurisdicionado: string; // nome do jurisdicionado
  ano: string;
};

// Resultado de getAtributos: inclui o ano efetivo e, quando os atributos
// foram herdados de outro exercício, qual foi a origem.
export type AtributosResult = AtributosExercicio & {
  ano: string;
  herdadoDe?: string;
};

// Rótulo curto do grupo de entidade, para badges.
export const GRUPO_ABREVIADO: Record<GrupoEntidade, string> = {
  "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA":
    "Órgão de Poder",
  "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO": "Adm. Direta",
  "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS": "Autarquia/Fundação",
  "FUNDOS ESTADUAIS": "Fundo",
};

export const JURISDICIONADOS: Jurisdicionado[] = [
  { nome: "Secretaria de Estado de Fazenda (SEF)", sigla: "SEF" },
  { nome: "Secretaria de Estado de Saúde (SES)", sigla: "SES" },
  { nome: "Secretaria de Estado de Educação (SEE)", sigla: "SEE" },
  { nome: "Secretaria de Estado de Infraestrutura (SEINFRA)", sigla: "SEINFRA" },
  { nome: "Secretaria de Estado de Segurança Pública (SSP)", sigla: "SSP" },
  { nome: "Secretaria de Estado de Meio Ambiente (SEMAD)", sigla: "SEMAD" },
  { nome: "Assembleia Legislativa de MG (ALMG)", sigla: "ALMG" },
  { nome: "Tribunal de Justiça de MG (TJMG)", sigla: "TJMG" },
  { nome: "Defensoria Pública do Estado de MG", sigla: "DPMG" },
  { nome: "Fundação João Pinheiro (FJP)", sigla: "FJP" },
  { nome: "Instituto Estadual de Florestas (IEF)", sigla: "IEF" },
  { nome: "FHEMIG — Fundação Hospitalar do Estado de MG", sigla: "FHEMIG" },
  { nome: "IPSEMG — Instituto de Previdência dos Servidores de MG", sigla: "IPSEMG" },
  { nome: "Fundo Estadual de Saúde de MG (FES)", sigla: "FES" },
];

// Lista de nomes (compatível com o uso anterior de ORGAOS como string[]).
export const ORGAOS = JURISDICIONADOS.map((j) => j.nome);

export function getJurisdicionado(nome: string): Jurisdicionado {
  return (
    JURISDICIONADOS.find((j) => j.nome === nome) ?? { nome, sigla: "" }
  );
}

// ---------------------------------------------------------------------------
// Atributos POR ANO DE EXERCÍCIO (RF02). Os atributos podem mudar entre os
// exercícios — por isso são mantidos por (jurisdicionado, ano).
// Mock com 2 anos (2024 e 2025). A FHEMIG mudou de grupo entre os anos
// (Autarquia/Fundação em 2024 → Adm. Direta em 2025) para teste.
// ---------------------------------------------------------------------------

const ATRIBUTOS_2025: Record<string, AtributosExercicio> = {
  "Secretaria de Estado de Fazenda (SEF)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Secretaria de Estado de Saúde (SES)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Secretaria de Estado de Educação (SEE)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Secretaria de Estado de Infraestrutura (SEINFRA)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Secretaria de Estado de Segurança Pública (SSP)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Secretaria de Estado de Meio Ambiente (SEMAD)": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Assembleia Legislativa de MG (ALMG)": { grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "PODER LEGISLATIVO" },
  "Tribunal de Justiça de MG (TJMG)": { grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "PODER JUDICIÁRIO" },
  "Defensoria Pública do Estado de MG": { grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "DEFENSORIA PÚBLICA" },
  "Fundação João Pinheiro (FJP)": { grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "Instituto Estadual de Florestas (IEF)": { grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  // FHEMIG: em 2025 passou a Administração Direta.
  "FHEMIG — Fundação Hospitalar do Estado de MG": { grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  "IPSEMG — Instituto de Previdência dos Servidores de MG": { grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: true, poder: "PODER EXECUTIVO" },
  "Fundo Estadual de Saúde de MG (FES)": { grupoEntidade: "FUNDOS ESTADUAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
};

export const ATRIBUTOS_EXERCICIO: JurisdicionadoExercicio[] = [
  // 2025
  ...Object.entries(ATRIBUTOS_2025).map(([jurisdicionado, attrs]) => ({
    jurisdicionado,
    ano: "2025",
    ...attrs,
  })),
  // 2024 — igual a 2025, exceto a FHEMIG, que era Autarquia/Fundação.
  ...Object.entries(ATRIBUTOS_2025).map(([jurisdicionado, attrs]) => ({
    jurisdicionado,
    ano: "2024",
    ...attrs,
    ...(jurisdicionado === "FHEMIG — Fundação Hospitalar do Estado de MG"
      ? { grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS" as GrupoEntidade }
      : {}),
  })),
];

const ATRIBUTOS_DEFAULT: AtributosExercicio = {
  grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO",
  entidadePrevidenciaria: false,
  poder: "PODER EXECUTIVO",
};

// Retorna os atributos de um jurisdicionado para um ano de exercício.
// Se não houver atributos cadastrados para o ano, herda do exercício mais
// próximo disponível (preferindo o anterior) e marca herdadoDe.
export function getAtributos(
  jurisdicionado: string,
  ano: string,
  fonte: JurisdicionadoExercicio[] = ATRIBUTOS_EXERCICIO
): AtributosResult {
  const exato = fonte.find(
    (a) => a.jurisdicionado === jurisdicionado && a.ano === ano
  );
  if (exato) {
    const { grupoEntidade, entidadePrevidenciaria, poder } = exato;
    return { grupoEntidade, entidadePrevidenciaria, poder, ano };
  }

  const candidatos = fonte
    .filter((a) => a.jurisdicionado === jurisdicionado)
    .sort((a, b) => {
      const da = Math.abs(Number(a.ano) - Number(ano));
      const db = Math.abs(Number(b.ano) - Number(ano));
      if (da !== db) return da - db;
      // Em caso de empate, prefere o exercício anterior.
      return Number(a.ano) - Number(b.ano);
    });

  if (candidatos.length) {
    const c = candidatos[0];
    const { grupoEntidade, entidadePrevidenciaria, poder } = c;
    return { grupoEntidade, entidadePrevidenciaria, poder, ano, herdadoDe: c.ano };
  }

  return { ...ATRIBUTOS_DEFAULT, ano };
}

export const RELATORES = [
  "CONS. JOÃO DA SILVA",
  "CONS. EM EXERC. PEDRO SOUZA",
  "CONS. SUBST. CARLOS OLIVEIRA",
  "CONS. ANTONIO SANTOS",
  "CONS. EM EXERC. PAULO FERREIRA",
];

export const AUDITORES = [
  "Analista 01",
  "Analista 02",
  "Analista 03",
  "Analista 04",
  "Analista 05",
  "Analista 06",
];

export const situacaoData = [
  { situacao: "Concluído", quantidade: 142 },
  { situacao: "Revisado", quantidade: 98 },
  { situacao: "Validado", quantidade: 76 },
  { situacao: "Em Correção", quantidade: 54 },
  { situacao: "Disponível", quantidade: 121 },
  { situacao: "Em Andamento", quantidade: 89 },
];

export const autuacaoData = TIPOS_ORGAO.map((t, i) => ({
  tipo: t,
  disponivel: [42, 18, 12, 26, 14][i],
  autuado: [88, 32, 24, 51, 27][i],
}));

export const consolidacaoData = [
  { situacao: "Pronto p/ Consolidar", quantidade: 38, destaque: true },
  { situacao: "Em Análise", quantidade: 64, destaque: false },
  { situacao: "Em Revisão", quantidade: 27, destaque: false },
  { situacao: "Aguardando Doc.", quantidade: 19, destaque: false },
  { situacao: "Validado", quantidade: 45, destaque: false },
];

export const orgaosPorTipoData = TIPOS_ORGAO.map((t, i) => ({
  tipo: t,
  total: [12, 4, 3, 18, 9][i],
}));

export const prazoMedioData = SITUACOES.map((s, i) => ({
  situacao: s,
  dias: [12, 18, 9, 32, 6, 24][i],
}));

export const pendenciasData = [
  { tipo: "Documentação", quantidade: 47 },
  { tipo: "Prazo", quantidade: 31 },
  { tipo: "Diligência", quantidade: 22 },
  { tipo: "Análise Técnica", quantidade: 38 },
];

const stackedFor = (names: string[]) =>
  names.map((nome) => {
    const row: Record<string, string | number> = { nome };
    SITUACOES.forEach((s) => {
      row[s] = Math.floor(Math.random() * 25) + 3;
    });
    return row;
  });

export const relatoresData = stackedFor(RELATORES);
export const auditoresData = stackedFor(AUDITORES);

export const SITUACAO_COLORS: Record<string, string> = {
  "Concluído": "var(--chart-1)",
  "Revisado": "var(--chart-2)",
  "Validado": "var(--chart-3)",
  "Em Correção": "var(--destructive)",
  "Disponível": "var(--chart-4)",
  "Em Andamento": "var(--chart-5)",
};
