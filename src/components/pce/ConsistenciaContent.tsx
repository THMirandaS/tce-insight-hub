import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MAX_TEXTO = 4000;

type ItemLinha = {
  letra: string;
  descricao: string;
  valor: number;
};

type SubAba = {
  key: string;
  label: string;
  itens: ItemLinha[];
  diferenca: number;
  // Descrição exibida na linha "Diferença" destacada.
  diferencaDescricao: string;
};

// Mocks na casa de milhões, formato brasileiro.
// Sub-abas 1, 3 e 4 conformes (diferença zero); sub-aba 2 não conforme.
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
        valor: 150_000_000,
      },
    ],
    diferenca: 0,
    diferencaDescricao: "Diferença = c - d",
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
        valor: 48_000_000,
      },
    ],
    diferenca: 2_000_000,
    diferencaDescricao: "Diferença = c - d",
  },
  {
    key: "receita",
    label: "Receita orçamentária",
    itens: [
      { letra: "a", descricao: "Receita orçamentária (balanço financeiro)", valor: 1_200_000_000 },
      { letra: "b", descricao: "Receita orçamentária (balanço orçamentário)", valor: 1_200_000_000 },
    ],
    diferenca: 0,
    diferencaDescricao: "Diferença = a - b",
  },
  {
    key: "despesa",
    label: "Despesa orçamentária",
    itens: [
      { letra: "a", descricao: "Despesa orçamentária (balanço financeiro)", valor: 1_150_000_000 },
      { letra: "b", descricao: "Despesa orçamentária (balanço orçamentário)", valor: 1_150_000_000 },
    ],
    diferenca: 0,
    diferencaDescricao: "Diferença = a - b",
  },
];

function AvaliacaoInconformidade({ subAbaLabel }: { subAbaLabel: string }) {
  const [providencias, setProvidencias] = useState("");
  return (
    <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <h3 className="text-base font-semibold text-red-800">
            Avaliação da Inconformidade
          </h3>
          <p className="mt-1 text-sm text-red-800">
            Inconsistência identificada em "{subAbaLabel}": a diferença apurada é
            diferente de zero.
          </p>
        </div>
      </div>
      <Label className="text-sm font-semibold text-red-900">
        Providências / Justificativas:
      </Label>
      <textarea
        value={providencias}
        onChange={(e) => setProvidencias(e.target.value.slice(0, MAX_TEXTO))}
        maxLength={MAX_TEXTO}
        rows={4}
        className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <div className="text-right text-xs text-red-700">
        {MAX_TEXTO - providencias.length} caracteres restantes
      </div>
    </div>
  );
}

function ConsideracoesAdicionais({ idSuffix }: { idSuffix: string }) {
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  return (
    <div className="mt-6 space-y-2">
      <Label className="text-sm font-semibold">Considerações adicionais:</Label>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, MAX_TEXTO))}
        maxLength={MAX_TEXTO}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
      />
      <div className="text-right text-xs text-muted-foreground">
        {MAX_TEXTO - texto.length} caracteres restantes
      </div>
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id={`consistencia-incluir-${idSuffix}`}
          checked={incluir}
          onCheckedChange={(c) => setIncluir(c === true)}
        />
        <Label
          htmlFor={`consistencia-incluir-${idSuffix}`}
          className="text-sm leading-tight"
        >
          O texto complementar deverá constar no relatório de conclusão do processo.
        </Label>
      </div>
    </div>
  );
}

function SubAbaPainel({ subAba }: { subAba: SubAba }) {
  const naoConforme = subAba.diferenca !== 0;

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
              <tr key={r.letra} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-3 py-2">{r.letra}</td>
                <td className="px-3 py-2">{r.descricao}</td>
                <td className="px-3 py-2 text-right">{fmtBRL(r.valor)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr
              className={`font-semibold ${
                naoConforme ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
              }`}
            >
              <td className="px-3 py-2" colSpan={2}>
                Diferença ({subAba.diferencaDescricao})
              </td>
              <td className="px-3 py-2 text-right">{fmtBRL(subAba.diferenca)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {naoConforme && <AvaliacaoInconformidade subAbaLabel={subAba.label} />}

      <ConsideracoesAdicionais idSuffix={subAba.key} />
    </>
  );
}

export function ConsistenciaContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const [subAbaKey, setSubAbaKey] = useState<string>(SUB_ABAS[0].key);
  const subAba = SUB_ABAS.find((s) => s.key === subAbaKey) ?? SUB_ABAS[0];

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
        {SUB_ABAS.map((t) => {
          const isActive = subAbaKey === t.key;
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
