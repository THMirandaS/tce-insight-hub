// Serviço isolado de consolidação de processos.
//
// A consolidação NÃO é feita pela aplicação: os processos chegam prontos do
// SGAP. Este serviço simula a chamada a um endpoint que lê os PDFs do processo
// e devolve os dados consolidados dos tópicos. Quando a API real estiver
// disponível, basta trocar a implementação de `consolidarProcesso` mantendo a
// mesma assinatura — as telas não precisam ser alteradas.

export type ConsolidacaoStatus =
  | "Pendente"
  | "Processando"
  | "Concluída"
  | "Erro";

export type DadosConsolidados = {
  nrProcesso: string;
  consolidadoEm: string;
  // Dados consolidados dos tópicos (hoje já mockados nos componentes de
  // cada tópico). Estrutura genérica para acomodar a resposta real da API.
  topicos: Record<string, unknown>;
};

/**
 * Consolida um processo a partir do seu número.
 *
 * Mock: aguarda 2-3s simulando a leitura dos PDFs e retorna os dados
 * consolidados. Para integrar com a API real, substitua o corpo desta função
 * por uma chamada `fetch` ao endpoint correspondente.
 */
export async function consolidarProcesso(
  nrProcesso: string
): Promise<DadosConsolidados> {
  const delay = 2000 + Math.floor(Math.random() * 1000);
  await new Promise((resolve) => setTimeout(resolve, delay));

  return {
    nrProcesso,
    consolidadoEm: new Date().toISOString(),
    topicos: {},
  };
}
