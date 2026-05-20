import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  History,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ALL_ROWS } from "./analises";
import { ResumoIA } from "@/components/pce/ResumoIA";

export const Route = createFileRoute("/analises/$id")({
  component: AnaliseDetalhePage,
});

type SubItem = { key: string; label: string; hasActions?: boolean };
type SubGroup = { key: string; label: string; items: SubItem[] };

const PCE_ITEMS: SubItem[] = [
  { key: "responsavel", label: "Responsável", hasActions: true },
  { key: "consid-gerais", label: "Consid. Gerais", hasActions: true },
  { key: "receitas", label: "Receitas", hasActions: true },
  { key: "credito-inicial", label: "Crédito inicial autorizado" },
  { key: "programas", label: "Programas", hasActions: true },
  { key: "credito-despesas-prg", label: "Crédito e Despesas por prg" },
  { key: "dsp-dotacao", label: "Dsp por dot. Orçamentária" },
  { key: "restos-pagar", label: "Restos a pagar", hasActions: true },
  { key: "controle-interno", label: "Controle Interno" },
  { key: "outras-inconformidades", label: "Outras Incoformidades" },
  { key: "conclusao", label: "Conclusão" },
];

const GROUPS: SubGroup[] = [
  { key: "anteriores", label: "PCE's Anteriores", items: [] },
  { key: "demais", label: "Demais Processos", items: [] },
  { key: "pce", label: "PCE", items: PCE_ITEMS },
];

function AnaliseDetalhePage() {
  const { id } = Route.useParams();
  const [active, setActive] = useState<string>("anteriores");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    anteriores: false,
    demais: false,
    pce: true,
  });

  const row = useMemo(
    () => ALL_ROWS.find((r) => r.numero === id),
    [id]
  );

  const processoLabel = id;
  const orgao = row?.orgao ?? "—";
  const relator = "CONS. JOÃO DA SILVA";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Submenu lateral PCE (dark) */}
      <aside className="sticky top-0 z-20 flex h-screen w-[220px] shrink-0 flex-col overflow-y-auto bg-[#0D1B2A] text-white">
        <nav className="flex-1">
          <ul className="py-2">
            {GROUPS.map((g) => {
              const open = expanded[g.key];
              const isGroupActive = g.items.length === 0 && active === g.key;
              return (
                <li key={g.key} className="px-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (g.items.length === 0) {
                        setActive(g.key);
                      } else {
                        setExpanded((p) => ({ ...p, [g.key]: !p[g.key] }));
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                      isGroupActive
                        ? "bg-[#1A56DB] text-white hover:bg-[#1A56DB]"
                        : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{g.label}</span>
                    {g.items.length > 0 &&
                      (open ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                  </button>
                  {open && g.items.length > 0 && (
                    <ul className="mb-2 space-y-0.5 border-l border-white/10 pl-2">
                      {g.items.map((it) => {
                        const isActive = active === it.key;
                        return (
                          <li key={it.key}>
                            <button
                              type="button"
                              onClick={() => setActive(it.key)}
                              className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-[#1A56DB] font-medium text-white"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span className="truncate">{it.label}</span>

                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho fixo do processo */}
        <header className="sticky top-0 z-30 border-b-2 border-[#1A56DB] bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3 text-sm">
            <Link
              to="/analises"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-[#0D1B2A] shadow-sm hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <Divider />
            <InfoCell label="Processo" value={processoLabel} />
            <Divider />
            <InfoCell label="Órgão" value={orgao} />
            <Divider />
            <InfoCell label="Relator" value={relator} />
            <Divider />
            <InfoCell label="Auditor" value="Auditor 01" />
          </div>
        </header>

        <section className="min-w-0 flex-1 px-6 py-6 pb-28">
          {active === "responsavel" ? (
            <ResponsavelContent processo={processoLabel} orgao={orgao} />
          ) : active === "anteriores" ? (
            <AnterioresContent processo={processoLabel} orgao={orgao} />
          ) : active === "demais" ? (
            <DemaisContent orgao={orgao} />
          ) : (
            <PlaceholderContent
              label={
                GROUPS.find((g) => g.key === active)?.label ??
                PCE_ITEMS.find((i) => i.key === active)?.label ??
                ""
              }
            />
          )}
        </section>


        {/* Rodapé fixo de ações */}
        <footer className="sticky bottom-0 z-30 border-t border-border bg-white shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap justify-end gap-2 px-6 py-3">
            {active !== "anteriores" && active !== "demais" && (
              <>
                <Button
                  type="button"
                  className="gap-2 bg-gray-500 text-white hover:bg-gray-600"
                >
                  <Save className="h-4 w-4" /> Salvar
                </Button>
                <Button
                  type="button"
                  className="gap-2 bg-yellow-500 text-[#0D1B2A] hover:bg-yellow-600"
                >
                  <AlertTriangle className="h-4 w-4" /> Correção
                </Button>
                <Button
                  type="button"
                  className="gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Concluir
                </Button>
              </>
            )}
            <Button
              type="button"
              className="gap-2 bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
            >
              <FileText className="h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}


const MAX = 4000;

function ResponsavelContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const restantes = MAX - texto.length;

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

      <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
        <span className="border-b-2 border-[#0D1B2A] pb-1">Responsáveis:</span>
      </h2>

      <ResponsaveisTable />

      <p className="mt-2 text-xs italic text-muted-foreground">
        Dados buscados automaticamente via integração com IA na consolidação.
      </p>

      <div className="my-6 border-t border-border" />

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
          maxLength={MAX}
          rows={10}
          className="block w-full resize-y overflow-y-auto rounded-md border border-border bg-white p-3 text-sm text-foreground shadow-inner outline-none focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]"
          placeholder="Digite aqui o texto complementar do responsável..."
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          {restantes.toLocaleString("pt-BR")} caracteres restantes
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="incluir"
          checked={incluir}
          onCheckedChange={(v) => setIncluir(Boolean(v))}
          className="mt-0.5"
        />
        <label
          htmlFor="incluir"
          className="cursor-pointer text-sm text-foreground"
        >
          O texto complementar deverá constar no relatório de conclusão do
          processo.
        </label>
      </div>
    </>
  );
}

type Responsavel = {
  id: string;
  gestor: string;
  inicio: string; // yyyy-mm-dd
  fim: string;
};

type AuditEntry = {
  ts: string;
  usuario: string;
  acao: "Inclusão" | "Edição" | "Exclusão";
  detalhe: string;
};

const USUARIO_ATUAL = "Auditor 01";

function toBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function nowStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ResponsaveisTable() {
  const [rows, setRows] = useState<Responsavel[]>([
    { id: "r1", gestor: "Gestor 01", inicio: "2025-01-01", fim: "2025-10-31" },
    { id: "r2", gestor: "Gestor 01", inicio: "2025-11-01", fim: "2025-12-31" },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Responsavel | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Responsavel | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const log = (e: Omit<AuditEntry, "ts" | "usuario">) =>
    setAudit((a) => [
      { ts: nowStamp(), usuario: USUARIO_ATUAL, ...e },
      ...a,
    ]);

  const startEdit = (r: Responsavel) => {
    setEditingId(r.id);
    setDraft({ ...r });
  };
  const confirmEdit = () => {
    if (!draft) return;
    const existing = rows.find((r) => r.id === draft.id);
    const isNew = !existing || (existing.gestor === "" && existing.inicio === "");
    setRows((rs) =>
      rs.map((r) => (r.id === draft.id ? { ...draft } : r))
    );
    if (isNew) {
      log({
        acao: "Inclusão",
        detalhe: `${draft.gestor} (${toBR(draft.inicio)} a ${toBR(draft.fim)})`,
      });
    } else if (existing) {
      log({
        acao: "Edição",
        detalhe: `De: ${existing.gestor} (${toBR(existing.inicio)} a ${toBR(existing.fim)}) → Para: ${draft.gestor} (${toBR(draft.inicio)} a ${toBR(draft.fim)})`,
      });
    }
    setEditingId(null);
    setDraft(null);
  };
  const addNew = () => {
    const id = `r${Date.now()}`;
    const novo: Responsavel = { id, gestor: "", inicio: "", fim: "" };
    setRows((rs) => [...rs, novo]);
    setEditingId(id);
    setDraft(novo);
  };
  const doDelete = () => {
    if (!confirmDelete) return;
    setRows((rs) => rs.filter((r) => r.id !== confirmDelete.id));
    log({
      acao: "Exclusão",
      detalhe: `${confirmDelete.gestor} (${toBR(confirmDelete.inicio)} a ${toBR(confirmDelete.fim)})`,
    });
    setConfirmDelete(null);
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setHistoryOpen(true)}
          title="Histórico de Alterações"
          aria-label="Histórico de Alterações"
          className="h-9 w-9"
        >
          <History className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          onClick={addNew}
          disabled={editingId !== null}
          className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
        >
          <Plus className="h-4 w-4" /> Incluir Responsável
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col style={{ width: "45%" }} />
            <col style={{ width: "40%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Gestor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                Período
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  Nenhum responsável cadastrado.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => {
              const isEditing = editingId === r.id && draft;
              const zebra = idx % 2 === 1 ? "bg-gray-50/60" : "bg-white";
              return (
                <tr key={r.id} className={zebra}>
                  {isEditing ? (
                    <>
                      <td className="px-4 py-3 align-middle">
                        <Input
                          value={draft!.gestor}
                          onChange={(e) =>
                            setDraft({ ...draft!, gestor: e.target.value })
                          }
                          placeholder="Nome do gestor"
                          className="h-9"
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={draft!.inicio}
                            onChange={(e) =>
                              setDraft({ ...draft!, inicio: e.target.value })
                            }
                            className="h-9"
                          />
                          <span className="text-xs text-muted-foreground">
                            a
                          </span>
                          <Input
                            type="date"
                            value={draft!.fim}
                            onChange={(e) =>
                              setDraft({ ...draft!, fim: e.target.value })
                            }
                            className="h-9"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            onClick={confirmEdit}
                            disabled={
                              !draft!.gestor.trim() ||
                              !draft!.inicio ||
                              !draft!.fim
                            }
                            className="h-8 w-8 bg-green-600 text-white hover:bg-green-700"
                            title="Confirmar"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              // remove if it was a brand-new empty row
                              setRows((rs) =>
                                rs.filter(
                                  (x) =>
                                    !(x.id === r.id && x.gestor === "" && x.inicio === "")
                                )
                              );
                              setEditingId(null);
                              setDraft(null);
                            }}
                            className="h-8 w-8"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 align-middle">{r.gestor}</td>
                      <td className="px-4 py-3 align-middle text-muted-foreground">
                        {toBR(r.inicio)} a {toBR(r.fim)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(r)}
                            disabled={editingId !== null}
                            className="h-8 w-8 text-[#1A56DB] hover:bg-blue-50 hover:text-[#1A56DB]"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDelete(r)}
                            disabled={editingId !== null}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir responsável</DialogTitle>
            <DialogDescription>
              Deseja excluir este responsável?
            </DialogDescription>
          </DialogHeader>
          {confirmDelete && (
            <div className="rounded-md border border-border bg-gray-50 p-3 text-sm">
              <div>
                <span className="font-semibold">Gestor:</span>{" "}
                {confirmDelete.gestor}
              </div>
              <div>
                <span className="font-semibold">Período:</span>{" "}
                {toBR(confirmDelete.inicio)} a {toBR(confirmDelete.fim)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={doDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Registro de auditoria das ações realizadas na tabela de
              responsáveis.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                    Data/Hora
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                    Usuário
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                    Ação
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                    Detalhe
                  </th>
                </tr>
              </thead>
              <tbody>
                {audit.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Nenhuma alteração registrada.
                    </td>
                  </tr>
                ) : (
                  audit.map((a, i) => (
                    <tr key={i} className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}>
                      <td className="px-3 py-2 align-top whitespace-nowrap">{a.ts}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">{a.usuario}</td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            a.acao === "Inclusão"
                              ? "bg-green-100 text-green-800"
                              : a.acao === "Edição"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.acao}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">{a.detalhe}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ConclusaoTipo = "aprovacao" | "ressalvas" | "rejeicao";

type ProcessoAnterior = {
  numero: string;
  conclusao: ConclusaoTipo;
  conclusaoLabel: string;
  incoformidades: string[];
  resumoIA?: string;
};

const ANTERIORES: ProcessoAnterior[] = [
  {
    numero: "0003/2024",
    conclusao: "aprovacao",
    conclusaoLabel: "Aprovação",
    incoformidades: [
      "Não foram encontradas incoformidades para o referido processo.",
    ],
  },
  {
    numero: "0002/2023",
    conclusao: "ressalvas",
    conclusaoLabel: "Aprovação com ressalvas",
    incoformidades: [
      "Inconsistências em dotações orçamentárias do exercício.",
      "Pendências na execução de restos a pagar processados.",
      "Divergências menores no controle interno do órgão.",
    ],
    resumoIA:
      "O processo apresentou ressalvas relacionadas a inconsistências em dotações orçamentárias e pendências em restos a pagar. A análise indicou que, apesar das falhas pontuais, não houve comprometimento material das contas, sendo recomendada a aprovação com ressalvas e o monitoramento das pendências no exercício seguinte.",
  },
  {
    numero: "0001/2022",
    conclusao: "rejeicao",
    conclusaoLabel: "Rejeição",
    incoformidades: [
      "Ausência de controle interno efetivo no exercício.",
      "Incoformidades graves em créditos autorizados.",
      "Despesas sem cobertura orçamentária regular.",
      "Restos a pagar inscritos sem disponibilidade financeira.",
    ],
    resumoIA:
      "O exercício analisado apresentou irregularidades graves, com destaque para a ausência de controle interno e incoformidades em créditos autorizados. Foram identificadas despesas sem cobertura orçamentária e inscrição irregular de restos a pagar, configurando comprometimento material da gestão e fundamentando a rejeição das contas.",
  },
];

function badgeClasses(tipo: ConclusaoTipo) {
  switch (tipo) {
    case "aprovacao":
      return "bg-green-100 text-green-800 border border-green-300";
    case "ressalvas":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "rejeicao":
      return "bg-red-100 text-red-800 border border-red-300";
  }
}

function AnterioresContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
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

      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          <span className="border-b-2 border-[#0D1B2A] pb-1">
            PCE's Anteriores
          </span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Decisões dos últimos 3 anos
        </p>
      </div>

      <div className="space-y-5">
        {ANTERIORES.map((p) => (
          <article
            key={p.numero}
            className="rounded-lg border border-border bg-white p-5 shadow-sm"
          >
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">
                Processo: {p.numero}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses(
                  p.conclusao
                )}`}
              >
                {p.conclusaoLabel}
              </span>
            </header>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-foreground">
                Incoformidades:
              </div>
              {p.conclusao === "aprovacao" ? (
                <p className="text-sm text-muted-foreground">
                  {p.incoformidades[0]}
                </p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {p.incoformidades.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>

            {p.resumoIA && (
              <ResumoIA texto={p.resumoIA} processo={p.numero} orgao={orgao} />
            )}
          </article>
        ))}
      </div>
    </>
  );
}



type DemaisSituacao = "analise" | "concluido" | "correcao";

type DemaisProcesso = {
  numero: string;
  tipo: string;
  dataAbertura: string;
  situacao: DemaisSituacao;
  situacaoLabel: string;
  incoformidades: string[];
  resumoIA?: string;
};

const DEMAIS_DATA_INICIO = "09/11/2024";
const DEMAIS_DATA_FIM = "27/10/2024";

const DEMAIS: DemaisProcesso[] = [
  {
    numero: "1208600",
    tipo: "Auditoria Operacional",
    dataAbertura: "15/10/2024",
    situacao: "analise",
    situacaoLabel: "Em Análise",
    incoformidades: [],
  },
  {
    numero: "1207320",
    tipo: "Inspeção Ordinária",
    dataAbertura: "03/07/2024",
    situacao: "concluido",
    situacaoLabel: "Concluído",
    incoformidades: [
      "Falhas no controle de benefícios",
      "Atraso no envio de demonstrativos",
    ],
    resumoIA:
      "Resumo das incoformidades encontradas na inspeção ordinária realizada no órgão, destacando as falhas no controle de benefícios previdenciários e o atraso recorrente no envio de demonstrativos exigidos pela fiscalização.",
  },
  {
    numero: "1206890",
    tipo: "Auditoria de Conformidade",
    dataAbertura: "12/03/2024",
    situacao: "concluido",
    situacaoLabel: "Concluído",
    incoformidades: [
      "Divergências em registros contábeis",
      "Ausência de documentação comprobatória",
    ],
    resumoIA:
      "Resumo das divergências contábeis e ausências documentais identificadas na auditoria de conformidade do órgão previdenciário, indicando necessidade de fortalecimento dos controles internos e da guarda de documentação suporte.",
  },
];

function situacaoBadge(s: DemaisSituacao) {
  switch (s) {
    case "analise":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "concluido":
      return "bg-green-100 text-green-800 border border-green-300";
    case "correcao":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }
}

function DemaisContent({ orgao }: { orgao: string }) {
  return (
    <>
      <h1 className="text-center text-2xl font-semibold text-foreground">
        Demais Processos
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Processos abertos entre {DEMAIS_DATA_INICIO} e {DEMAIS_DATA_FIM}
      </p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Órgão: <span className="font-medium text-foreground">{orgao}</span>
      </p>

      <div className="my-6 border-t border-border" />

      {DEMAIS.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center text-center text-sm text-muted-foreground">
          Nenhum processo encontrado no período de consolidação.
        </div>
      ) : (
        <div className="space-y-5">
          {DEMAIS.map((p) => (
            <article
              key={p.numero}
              className="rounded-lg border border-border bg-white p-5 shadow-sm"
            >
              <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Nº Processo: {p.numero}
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {p.tipo}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${situacaoBadge(
                    p.situacao
                  )}`}
                >
                  {p.situacaoLabel}
                </span>
              </header>

              <div className="mb-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-foreground">Tipo:</span>{" "}
                  <span className="text-muted-foreground">{p.tipo}</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    Data de abertura:
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {p.dataAbertura}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="text-sm font-semibold text-foreground">
                  Incoformidades encontradas:
                </div>
                {p.incoformidades.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    Sem incoformidades registradas até o momento.
                  </p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                    {p.incoformidades.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>

              {p.resumoIA && (
                <ResumoIA texto={p.resumoIA} processo={p.numero} orgao={orgao} />
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function PlaceholderContent({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-gray-50/60 p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Conteúdo deste submenu em construção.
        </p>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}:
      </span>
      <span className="truncate text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border" aria-hidden />;
}
