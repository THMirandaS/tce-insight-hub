import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { History, Plus, Trash2 } from "lucide-react";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const CATEGORIAS_ECONOMICAS = [
  "Despesas Correntes",
  "Despesas de Capital",
];

const GRUPOS_DESPESA = [
  "Outras Despesas Correntes",
  "Pessoal e Encargos Sociais",
  "Inversões Financeiras",
  "Investimentos",
];

type ModalidadeLinha = {
  id: string;
  programa: string;
  categoria: string;
  grupo: string;
  modalidade: string;
  valorPago: number;
};

const MODALIDADE_1 = "APLICAÇÕES DIRETAS";
const MODALIDADE_2 = "APLICAÇÃO DIRETA DECORRENTE DE OPERAÇÕES ENTRE ÓRGÃOS, FUNDOS E ENTIDADES";
const MODALIDADE_3 = "OUTRAS APLICAÇÕES";

const LINHAS_MOCK: ModalidadeLinha[] = [
  { id: "ma1", programa: "47", categoria: "Despesas Correntes", grupo: "Outras Despesas Correntes", modalidade: MODALIDADE_1, valorPago: 850_000_000 },
  { id: "ma2", programa: "55", categoria: "Despesas Correntes", grupo: "Pessoal e Encargos Sociais", modalidade: MODALIDADE_1, valorPago: 920_000_000 },
  { id: "ma3", programa: "47", categoria: "Despesas Correntes", grupo: "Pessoal e Encargos Sociais", modalidade: MODALIDADE_1, valorPago: 310_000_000 },
  { id: "ma4", programa: "55", categoria: "Despesas Correntes", grupo: "Outras Despesas Correntes", modalidade: MODALIDADE_1, valorPago: 480_000_000 },
  { id: "ma5", programa: "68", categoria: "Despesas de Capital", grupo: "Investimentos", modalidade: MODALIDADE_1, valorPago: 1_050_000_000 },
  { id: "ma6", programa: "88", categoria: "Despesas de Capital", grupo: "Inversões Financeiras", modalidade: MODALIDADE_1, valorPago: 720_000_000 },
  { id: "ma7", programa: "47", categoria: "Despesas Correntes", grupo: "Outras Despesas Correntes", modalidade: MODALIDADE_2, valorPago: 290_000_000 },
  { id: "ma8", programa: "55", categoria: "Despesas Correntes", grupo: "Pessoal e Encargos Sociais", modalidade: MODALIDADE_2, valorPago: 440_000_000 },
  { id: "ma9", programa: "68", categoria: "Despesas de Capital", grupo: "Investimentos", modalidade: MODALIDADE_2, valorPago: 580_000_000 },
  { id: "ma10", programa: "88", categoria: "Despesas de Capital", grupo: "Inversões Financeiras", modalidade: MODALIDADE_2, valorPago: 210_000_000 },
  { id: "ma11", programa: "47", categoria: "Despesas Correntes", grupo: "Pessoal e Encargos Sociais", modalidade: MODALIDADE_2, valorPago: 150_000_000 },
  { id: "ma12", programa: "88", categoria: "Despesas de Capital", grupo: "Investimentos", modalidade: MODALIDADE_3, valorPago: 95_000_000 },
];

function groupByModalidade(linhas: ModalidadeLinha[]) {
  const grupos = new Map<string, ModalidadeLinha[]>();
  for (const l of linhas) {
    const arr = grupos.get(l.modalidade) ?? [];
    arr.push(l);
    grupos.set(l.modalidade, arr);
  }
  return grupos;
}

function ConsideracoesAdicionais() {
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const MAX = 4000;
  return (
    <div className="mt-6 space-y-2">
      <Label className="text-sm font-semibold">Considerações adicionais:</Label>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
        maxLength={MAX}
        rows={6}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
      />
      <div className="text-right text-xs text-muted-foreground">
        {MAX - texto.length} caracteres restantes
      </div>
      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="modalidade-incluir"
          checked={incluir}
          onCheckedChange={(c) => setIncluir(c === true)}
        />
        <Label htmlFor="modalidade-incluir" className="text-sm leading-tight">
          O texto complementar deverá constar no relatório de conclusão do processo.
        </Label>
      </div>
    </div>
  );
}

export function ModalidadeAplicacaoContent({
  processo,
  orgao,
  tab,
  onTabChange,
}: {
  processo: string;
  orgao: string;
  tab: "principal" | "memoria";
  onTabChange: (t: "principal" | "memoria") => void;
}) {
  const [memoria, setMemoria] = useState<ModalidadeLinha[]>(LINHAS_MOCK);
  const [historyOpen, setHistoryOpen] = useState(false);

  function updateLinha(id: string, patch: Partial<ModalidadeLinha>) {
    setMemoria((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLinha() {
    setMemoria((arr) => [
      ...arr,
      {
        id: `ma${Date.now()}`,
        programa: "",
        categoria: CATEGORIAS_ECONOMICAS[0],
        grupo: GRUPOS_DESPESA[0],
        modalidade: MODALIDADE_1,
        valorPago: 0,
      },
    ]);
  }
  function removeLinha(id: string) {
    setMemoria((arr) => arr.filter((l) => l.id !== id));
  }

  const totalGeral = memoria.reduce((s, l) => s + l.valorPago, 0);
  const grupos = groupByModalidade(memoria);

  return (
    <>
      <h1 className="text-center text-2xl font-semibold text-foreground">
        Processo: {processo}
      </h1>
      <div className="mx-auto mt-4 max-w-3xl space-y-2 text-center text-sm">
        <p>
          <span className="font-semibold">Grupo:</span> ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA
        </p>
        <p>
          <span className="font-semibold">Órgão:</span> {orgao}
        </p>
      </div>

      <div className="my-6 border-t border-border" />

      {/* Abas */}
      <div className="mb-6 flex gap-6 border-b border-border" data-pdf-hide>
        {([
          { k: "principal", label: "Modalidade de aplicação" },
          { k: "memoria", label: "Memória de cálculo" },
        ] as const).map((t) => {
          const isActive = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => onTabChange(t.k)}
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

      {tab === "principal" ? (
        <>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Grupo</th>
                  <th className="px-3 py-2 text-left">Modalidade</th>
                  <th className="px-3 py-2 text-right">Valor pago (R$)</th>
                </tr>
              </thead>
              <tbody>
                {/* TOTAL geral no topo */}
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td colSpan={4} className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalGeral)}</td>
                </tr>
                {Array.from(grupos.entries()).flatMap(([modalidade, linhas]) => {
                  const subtotal = linhas.reduce((s, l) => s + l.valorPago, 0);
                  const rows: JSX.Element[] = [];
                  linhas.forEach((l, i) => {
                    rows.push(
                      <tr
                        key={l.id}
                        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-3 py-2">{l.programa}</td>
                        <td className="px-3 py-2">{l.categoria}</td>
                        <td className="px-3 py-2">{l.grupo}</td>
                        <td className="px-3 py-2">{l.modalidade}</td>
                        <td className="px-3 py-2 text-right">{fmtBRL(l.valorPago)}</td>
                      </tr>
                    );
                  });
                  rows.push(
                    <tr key={`sub-${modalidade}`} className="bg-[#F4F5F7] font-semibold">
                      <td colSpan={4} className="px-3 py-2">SUBTOTAL — {modalidade}</td>
                      <td className="px-3 py-2 text-right">{fmtBRL(subtotal)}</td>
                    </tr>
                  );
                  return rows;
                })}
              </tbody>
            </table>
          </div>
          <ConsideracoesAdicionais />
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">Memória de cálculo</span>
            </h2>
            <div className="flex items-center gap-2" data-pdf-hide>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
                title="Histórico de alterações"
              >
                <History className="h-4 w-4" /> Histórico
              </button>
              <Button
                type="button"
                onClick={addLinha}
                className="gap-1 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
              >
                <Plus className="h-4 w-4" /> Adicionar linha
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-left">Categoria</th>
                  <th className="px-3 py-2 text-left">Grupo</th>
                  <th className="px-3 py-2 text-left">Modalidade</th>
                  <th className="px-3 py-2 text-right">Valor pago (R$)</th>
                  <th className="px-3 py-2 text-center" data-pdf-hide>Ações</th>
                </tr>
              </thead>
              <tbody>
                {memoria.map((l, i) => (
                  <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-2 py-1.5">
                      <Input
                        value={l.programa}
                        onChange={(e) => updateLinha(l.id, { programa: e.target.value })}
                        className="h-8"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={l.categoria}
                        onChange={(e) => updateLinha(l.id, { categoria: e.target.value })}
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm"
                      >
                        {CATEGORIAS_ECONOMICAS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={l.grupo}
                        onChange={(e) => updateLinha(l.id, { grupo: e.target.value })}
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm"
                      >
                        {GRUPOS_DESPESA.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={l.modalidade}
                        onChange={(e) => updateLinha(l.id, { modalidade: e.target.value })}
                        className="h-8"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={l.valorPago}
                        onChange={(e) => updateLinha(l.id, { valorPago: Number(e.target.value) || 0 })}
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center" data-pdf-hide>
                      <button
                        type="button"
                        onClick={() => removeLinha(l.id)}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td colSpan={4} className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalGeral)}</td>
                  <td data-pdf-hide />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Modal histórico (placeholder visual) */}
          {historyOpen && (
            <div className="mt-4 rounded-md border border-border bg-white p-4 text-sm text-muted-foreground">
              <p>Histórico de alterações da memória de cálculo.</p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="mt-2 text-[#1A56DB] hover:underline"
              >
                Fechar
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
