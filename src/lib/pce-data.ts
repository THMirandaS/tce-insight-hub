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

export const ORGAOS = [
  "Secretaria da Fazenda",
  "Secretaria da Educação",
  "Assembleia Legislativa",
  "Tribunal de Justiça",
  "DETRAN",
  "Fundação Cultural",
  "Secretaria da Saúde",
  "Universidade Estadual",
];

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
