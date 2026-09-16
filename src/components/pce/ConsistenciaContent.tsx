import { useState } from "react";
import { Label } from "@/components/ui/label";
import { ConsideracoesAdicionais } from "@/components/pce/ConsideracoesAdicionais";
import { ConclusaoItemRadios } from "@/components/pce/ConclusaoItemRadios";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Poder } from "@/lib/pce-data";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ItemLinha = {
  letra: string;
  descricao: string;
  valor: number;
  // Destaca a linha em negrito (ex.: totais).
  bold?: boolean;
};

type SubAba = {
  key: string;
  label: string;
  itens: ItemLinha[];
  // Conclusão pré-calculada (regras variam por sub-aba).
  naoConforme: boolean;
  // Linha final destacada (ex.: "Diferença"). Opcional para sub-abas sem diferença.
  rodape?: { descricao: string; valor: number };
  // Mensagem específica exibida na avaliação da inconformidade.
  inconformidadeMsg?: string;
  // Quando true, só aparece para jurisdicionados do Poder Executivo.
  soExecutivo?: boolean;
};

// Mocks na casa de milhões, formato brasileiro.
// Maioria conforme; não conformes para demonstração: "RPNP – BF x BO",
// "Receita orçamentária" (diferença ≠ 0) e "Caixa – Valores a receber" (saldo ≠ 0).
const SUB_ABAS: SubAba[] = [
  {
    key: "rpnp",
    label: "RPNP – BF x BO",
    itens: [
      { letra: "a", descricao: "Despesas empenhadas (balanço orçamentário)", valor: 500_000_000 },
      { letra: "b", descricao: "Despesas liquidadas (balanço orçamentário)", valor: 350_000_000 },
      { letra: "c", descricao: "(c) = a - b", valor: 150_000_000 },
      {
        letra: "d",
        descricao: "Inscrição restos a pagar não processados (balanço financeiro)",
        valor: 147_350_000,
      },
    ],
    naoConforme: true,
    rodape: { descricao: "Diferença (c - d)", valor: 2_650_000 },
    inconformidadeMsg:
      "A inscrição de restos a pagar não processados no balanço financeiro diverge do resultado da execução orçamentária (empenhada − liquidada) no balanço orçamentário.",
  },
  {
    key: "rpp",
    label: "RPP – BF x BO",
    itens: [
      { letra: "a", descricao: "Despesas liquidadas (balanço orçamentário)", valor: 350_000_000 },
      { letra: "b", descricao: "Despesas pagas (balanço orçamentário)", valor: 300_000_000 },
      { letra: "c", descricao: "(c) = a - b", valor: 50_000_000 },
      {
        letra: "d",
        descricao: "Inscrição restos a pagar processados (balanço financeiro)",
        valor: 50_000_000,
      },
    ],
    naoConforme: false,
    rodape: { descricao: "Diferença (c - d)", valor: 0 },
  },
  {
    key: "receita",
    label: "Receita orçamentária",
    itens: [
      { letra: "a", descricao: "Receita orçamentária (balanço financeiro)", valor: 1_200_000_000 },
      { letra: "b", descricao: "Receita orçamentária (balanço orçamentário)", valor: 1_198_700_000 },
    ],
    naoConforme: true,
    rodape: { descricao: "Diferença (a - b)", valor: 1_300_000 },
    inconformidadeMsg:
      "A receita orçamentária registrada no balanço financeiro difere da apurada no balanço orçamentário.",
  },
  {
    key: "despesa",
    label: "Despesa orçamentária",
    itens: [
      { letra: "a", descricao: "Despesa orçamentária (balanço financeiro)", valor: 1_150_000_000 },
      { letra: "b", descricao: "Despesa orçamentária (balanço orçamentário)", valor: 1_150_000_000 },
    ],
    naoConforme: false,
    rodape: { descricao: "Diferença (a - b)", valor: 0 },
  },
  // 5 — Caixa e equivalentes – BF x BP (conforme)
  {
    key: "caixa-equivalentes",
    label: "Caixa e equivalentes – BF x BP",
    itens: [
      { letra: "a", descricao: "Caixa e equivalentes de caixa (balanço financeiro)", valor: 800_000_000 },
      { letra: "b", descricao: "Caixa e equivalentes de caixa (balanço patrimonial)", valor: 800_000_000 },
    ],
    naoConforme: false,
    rodape: { descricao: "Diferença (a - b)", valor: 0 },
  },
  // 6 — Caixa – Valores a receber (não conforme; só Poder Executivo)
  {
    key: "caixa-valores-receber",
    label: "Caixa – Valores a receber",
    itens: [
      {
        letra: "a",
        descricao: "1.1.1.1.2.01.01 – Recursos de contas arrecadadoras",
        valor: 15_430.22,
      },
      {
        letra: "b",
        descricao: "1.1.1.1.2.01.02 – Contas de movimentação interna CMI/CET",
        valor: 0,
      },
    ],
    // Regra específica: não conforme se qualquer conta tiver saldo ≠ 0.
    naoConforme: true,
    inconformidadeMsg:
      "Há contas com saldo diferente de zero. As contas de recursos de terceiros / movimentação interna devem apresentar saldo zerado ao final do exercício.",
    soExecutivo: true,
  },
  // 7 — Resultado do exercício (conforme)
  {
    key: "resultado-exercicio",
    label: "Resultado do exercício",
    itens: [
      { letra: "a", descricao: "Superávit ou déficit do exercício (balanço patrimonial)", valor: 200_000_000 },
      { letra: "b", descricao: "Resultado patrimonial (DVP)", valor: 200_000_000 },
    ],
    naoConforme: false,
    rodape: { descricao: "Diferença (a - b)", valor: 0 },
  },
  // 8 — Saldos devedores e credores (conforme; linhas c e g em negrito)
  {
    key: "saldos-devedores-credores",
    label: "Saldos devedores e credores",
    itens: [
      { letra: "a", descricao: "Ativo (balanço patrimonial)", valor: 2_000_000_000 },
      { letra: "b", descricao: "Variações patrimoniais diminutivas (DVP)", valor: 500_000_000 },
      { letra: "c", descricao: "Total dos saldos devedores = a + b", valor: 2_500_000_000, bold: true },
      { letra: "d", descricao: "Passivo + PL (balanço patrimonial)", valor: 2_300_000_000 },
      { letra: "e", descricao: "Variações patrimoniais aumentativas (DVP)", valor: 300_000_000 },
      { letra: "f", descricao: "Resultado patrimonial (DVP)", valor: 100_000_000 },
      { letra: "g", descricao: "Total dos saldos credores = d + e - f", valor: 2_500_000_000, bold: true },
    ],
    naoConforme: false,
    rodape: { descricao: "Diferença (c - g)", valor: 0 },
  },
];







function SubAbaPainel({ subAba }: { subAba: SubAba }) {
  const naoConforme = subAba.naoConforme;

  return (
    <>
      {/* Conclusão automática no topo */}
      <div
        className={`mb-4 flex items-center gap-3 rounded-md border p-3 ${
          naoConforme
            ? "border-red-300 bg-red-50 text-red-800"
            : "border-green-300 bg-green-50 text-green-800"
        }`}
      >
        {naoConforme ? (
          <AlertTriangle className="h-5 w-5 shrink-0" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0" />
        )}
        <p className="text-sm font-semibold">
          Consistência: {naoConforme ? "NÃO CONFORME" : "CONFORME"}
        </p>
      </div>

      <h2 className="mt-6 text-lg font-semibold text-foreground">
        <span className="border-b-2 border-[#0D1B2A] pb-1">{subAba.label}</span>
      </h2>

      <div className="mt-3 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-left">Descrição</th>
              <th className="px-3 py-2 text-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {subAba.itens.map((r, i) => (
              <tr
                key={r.letra}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                  r.bold ? "font-bold" : ""
                }`}
              >
                <td className="px-3 py-2">{r.letra}</td>
                <td className="px-3 py-2">{r.descricao}</td>
                <td className="px-3 py-2 text-right">{fmtBRL(r.valor)}</td>
              </tr>
            ))}
          </tbody>
          {subAba.rodape && (
            <tfoot>
              <tr
                className={`font-semibold ${
                  naoConforme ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
              >
                <td className="px-3 py-2" colSpan={2}>
                  {subAba.rodape.descricao}
                </td>
                <td className="px-3 py-2 text-right">{fmtBRL(subAba.rodape.valor)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <ConclusaoItemRadios scope={`consistencia:${subAba.key}`} />

      <ConsideracoesAdicionais printTitle={`Considerações adicionais — ${subAba.label}`} />

    </>
  );
}

export function ConsistenciaContent({
  processo,
  orgao,
  poder,
}: {
  processo: string;
  orgao: string;
  poder: Poder;
}) {
  // Sub-aba 6 só aparece para o Poder Executivo.
  const subAbas = SUB_ABAS.filter(
    (s) => !s.soExecutivo || poder === "PODER EXECUTIVO"
  );

  const [subAbaKey, setSubAbaKey] = useState<string>(subAbas[0].key);
  const subAba = subAbas.find((s) => s.key === subAbaKey) ?? subAbas[0];

  return (
    <>
      <h1 className="text-center text-2xl font-semibold text-foreground">
        Processo: {processo}
      </h1>

      <div className="mx-auto mt-4 max-w-3xl space-y-2 text-center text-sm">
        <p>
          <span className="font-semibold">Grupo:</span> ÓRGÃOS DOS PODERES
          LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA
          PÚBLICA
        </p>
        <p>
          <span className="font-semibold">Órgão:</span> {orgao}
        </p>
      </div>

      <div className="my-6 border-t border-border" />

      {/* Sub-abas internas */}
      <div className="mb-6 flex flex-wrap gap-6 border-b border-border" data-pdf-hide>
        {subAbas.map((t) => {
          const isActive = subAba.key === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubAbaKey(t.key)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-[#1A56DB] text-[#1A56DB]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <SubAbaPainel subAba={subAba} />
    </>
  );
}
