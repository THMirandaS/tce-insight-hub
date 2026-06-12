import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { History, Plus, Trash2, ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type ElementoLinha = {
  id: string;
  codigo: string;
  nome: string;
  empenhado: number;
  liquidado: number;
  pago: number;
};

const ELEMENTOS_MOCK: ElementoLinha[] = [
  { id: "el1", codigo: "91", nome: "Sentenças Judiciais", empenhado: 950_000_000, liquidado: 920_000_000, pago: 900_000_000 },
  { id: "el2", codigo: "42", nome: "Auxílios", empenhado: 820_000_000, liquidado: 810_000_000, pago: 800_000_000 },
  { id: "el3", codigo: "51", nome: "Obras e Instalações", empenhado: 730_000_000, liquidado: 730_000_000, pago: 710_000_000 },
  { id: "el4", codigo: "11", nome: "Vencimentos", empenhado: 680_000_000, liquidado: 680_000_000, pago: 680_000_000 },
  { id: "el5", codigo: "39", nome: "Outros Serviços PJ", empenhado: 450_000_000, liquidado: 450_000_000, pago: 450_000_000 },
  { id: "el6", codigo: "93", nome: "Indenizações", empenhado: 150_000_000, liquidado: 180_000_000, pago: 140_000_000 },
  { id: "el7", codigo: "61", nome: "Aquisição de Imóveis", empenhado: 320_000_000, liquidado: 310_000_000, pago: 310_000_000 },
  { id: "el8", codigo: "37", nome: "Locação de Mão de Obra", empenhado: 210_000_000, liquidado: 210_000_000, pago: 210_000_000 },
];

const MAX_TEXTO = 4000;

function AvaliacaoInconformidadeElemento({
  tipo,
}: {
  tipo: "liquidado-empenhado" | "pago-liquidado";
}) {
  const [providencias, setProvidencias] = useState("");
  const titulo =
    tipo === "liquidado-empenhado"
      ? "Valor liquidado superior ao valor empenhado"
      : "Valor pago superior ao valor liquidado";
  return (
    <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-4">
      <div className="mb-3 flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div>
          <h3 className="text-base font-semibold text-red-800">
            Avaliação da Inconformidade
          </h3>
          <p className="mt-1 text-sm text-red-800">{titulo}.</p>
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

function ConsideracoesAdicionais() {
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
          id="despesa-elemento-incluir"
          checked={incluir}
          onCheckedChange={(c) => setIncluir(c === true)}
        />
        <Label htmlFor="despesa-elemento-incluir" className="text-sm leading-tight">
          O texto complementar deverá constar no relatório de conclusão do processo.
        </Label>
      </div>
    </div>
  );
}

export function DespesaElementoContent({
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
  const [dados] = useState<ElementoLinha[]>(
    [...ELEMENTOS_MOCK].sort((a, b) => b.empenhado - a.empenhado)
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [memoria, setMemoria] = useState<ElementoLinha[]>([...ELEMENTOS_MOCK]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalEmpenhado = dados.reduce((s, l) => s + l.empenhado, 0);
  const totalLiquidado = dados.reduce((s, l) => s + l.liquidado, 0);
  const totalPago = dados.reduce((s, l) => s + l.pago, 0);

  const naoConformeLiquidado = dados.some((l) => l.liquidado > l.empenhado);
  const naoConformePago = dados.some((l) => l.pago > l.liquidado);

  function updateMemoria(id: string, patch: Partial<ElementoLinha>) {
    setMemoria((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addMemoria() {
    setMemoria((arr) => [
      ...arr,
      { id: `el${Date.now()}`, codigo: "", nome: "", empenhado: 0, liquidado: 0, pago: 0 },
    ]);
  }
  function removeMemoria(id: string) {
    setMemoria((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

  const memTotalEmpenhado = memoria.reduce((s, l) => s + l.empenhado, 0);
  const memTotalLiquidado = memoria.reduce((s, l) => s + l.liquidado, 0);
  const memTotalPago = memoria.reduce((s, l) => s + l.pago, 0);

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

      {/* Abas */}
      <div className="mb-6 flex gap-6 border-b border-border" data-pdf-hide>
        {(
          [
            { k: "principal", label: "Despesa por elemento" },
            { k: "memoria", label: "Memória de cálculo" },
          ] as const
        ).map((t) => {
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
          {/* Conclusões automáticas no topo */}
          <div className="mb-4 space-y-2">
            <div
              className={`flex items-center gap-3 rounded-md border p-3 ${
                naoConformeLiquidado
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-green-300 bg-green-50 text-green-800"
              }`}
            >
              {naoConformeLiquidado ? (
                <AlertTriangle className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              )}
              <p className="text-sm font-semibold">
                Valor liquidado x valor empenhado:{" "}
                {naoConformeLiquidado ? "NÃO CONFORME" : "CONFORME"}
              </p>
            </div>
            <div
              className={`flex items-center gap-3 rounded-md border p-3 ${
                naoConformePago
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-green-300 bg-green-50 text-green-800"
              }`}
            >
              {naoConformePago ? (
                <AlertTriangle className="h-5 w-5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 shrink-0" />
              )}
              <p className="text-sm font-semibold">
                Valor pago x valor liquidado:{" "}
                {naoConformePago ? "NÃO CONFORME" : "CONFORME"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Despesa por elemento
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
              title="Histórico de alterações"
            >
              <History className="h-4 w-4" /> Histórico
            </button>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Elemento</th>
                  <th className="px-3 py-2 text-left">Nome elemento</th>
                  <th className="px-3 py-2 text-right">Valor empenhado</th>
                  <th className="px-3 py-2 text-right">Valor liquidado</th>
                  <th className="px-3 py-2 text-right">Valor pago</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((r, i) => (
                  <tr
                    key={r.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2">{r.codigo}</td>
                    <td className="px-3 py-2">{r.nome}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.empenhado)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.liquidado)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.pago)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalEmpenhado)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalLiquidado)}
                  </td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalPago)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {naoConformeLiquidado && (
            <AvaliacaoInconformidadeElemento tipo="liquidado-empenhado" />
          )}
          {naoConformePago && (
            <AvaliacaoInconformidadeElemento tipo="pago-liquidado" />
          )}

          <ConsideracoesAdicionais />
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Memória de cálculo
              </span>
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
                onClick={addMemoria}
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
                  <th className="px-3 py-2 text-left">Elemento</th>
                  <th className="px-3 py-2 text-left">Nome elemento</th>
                  <th className="px-3 py-2 text-right">Valor empenhado</th>
                  <th className="px-3 py-2 text-right">Valor liquidado</th>
                  <th className="px-3 py-2 text-right">Valor pago</th>
                  <th className="px-3 py-2 text-center" data-pdf-hide>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {memoria.map((l, i) => (
                  <tr
                    key={l.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-2 py-1.5">
                      <Input
                        value={l.codigo}
                        onChange={(e) =>
                          updateMemoria(l.id, { codigo: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        value={l.nome}
                        onChange={(e) =>
                          updateMemoria(l.id, { nome: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={l.empenhado}
                        onChange={(e) =>
                          updateMemoria(l.id, {
                            empenhado: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={l.liquidado}
                        onChange={(e) =>
                          updateMemoria(l.id, {
                            liquidado: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={l.pago}
                        onChange={(e) =>
                          updateMemoria(l.id, {
                            pago: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center" data-pdf-hide>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l.id)}
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
                  <td className="px-3 py-2" colSpan={2}>
                    TOTAL
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(memTotalEmpenhado)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(memTotalLiquidado)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(memTotalPago)}
                  </td>
                  <td data-pdf-hide />
                </tr>
              </tfoot>
            </table>
          </div>

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

          {confirmDelete && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p>Confirmar exclusão da linha?</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => removeMemoria(confirmDelete)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
