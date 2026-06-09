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

export type Jurisdicionado = {
  nome: string;
  sigla: string;
  grupoEntidade: GrupoEntidade;
  entidadePrevidenciaria: boolean;
  poder: Poder;
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
  { nome: "Secretaria de Estado de Fazenda (SEF)", sigla: "SEF", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Secretaria de Estado de Saúde (SES)", sigla: "SES", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Secretaria de Estado de Educação (SEE)", sigla: "SEE", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Secretaria de Estado de Infraestrutura (SEINFRA)", sigla: "SEINFRA", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Secretaria de Estado de Segurança Pública (SSP)", sigla: "SSP", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Secretaria de Estado de Meio Ambiente (SEMAD)", sigla: "SEMAD", grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Assembleia Legislativa de MG (ALMG)", sigla: "ALMG", grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "PODER LEGISLATIVO" },
  { nome: "Tribunal de Justiça de MG (TJMG)", sigla: "TJMG", grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "PODER JUDICIÁRIO" },
  { nome: "Defensoria Pública do Estado de MG", sigla: "DPMG", grupoEntidade: "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA", entidadePrevidenciaria: false, poder: "DEFENSORIA PÚBLICA" },
  { nome: "Fundação João Pinheiro (FJP)", sigla: "FJP", grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "Instituto Estadual de Florestas (IEF)", sigla: "IEF", grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "FHEMIG — Fundação Hospitalar do Estado de MG", sigla: "FHEMIG", grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
  { nome: "IPSEMG — Instituto de Previdência dos Servidores de MG", sigla: "IPSEMG", grupoEntidade: "ENTIDADES AUTÁRQUICAS E FUNDACIONAIS", entidadePrevidenciaria: true, poder: "PODER EXECUTIVO" },
  { nome: "Fundo Estadual de Saúde de MG (FES)", sigla: "FES", grupoEntidade: "FUNDOS ESTADUAIS", entidadePrevidenciaria: false, poder: "PODER EXECUTIVO" },
];

// Lista de nomes (compatível com o uso anterior de ORGAOS como string[]).
export const ORGAOS = JURISDICIONADOS.map((j) => j.nome);

const JURISDICIONADO_DEFAULT: Jurisdicionado = {
  nome: "—",
  sigla: "",
  grupoEntidade: "ÓRGÃOS DA ADMINISTRAÇÃO DIRETA DO PODER EXECUTIVO",
  entidadePrevidenciaria: false,
  poder: "PODER EXECUTIVO",
};

export function getJurisdicionado(nome: string): Jurisdicionado {
  return (
    JURISDICIONADOS.find((j) => j.nome === nome) ?? {
      ...JURISDICIONADO_DEFAULT,
      nome,
    }
  );
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
