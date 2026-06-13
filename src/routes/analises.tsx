import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  X,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Plus,
  Eye,
  RotateCcw,
  RefreshCw,
  FileText,
  Layers,
  Info,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ORGAOS,
  getJurisdicionado,
} from "@/lib/pce-data";
import { useAtribuicoes } from "@/lib/atribuicoes";
import { useConsolidacao } from "@/lib/consolidacao-store";
import { useDefesas } from "@/lib/defesas-store";

export const Route = createFileRoute("/analises")({
  component: AnalisesRouteShell,
});

type Perfil = "Coordenador" | "Auditor";

const PERFIL: Perfil = "Coordenador";
const USUARIO_AUDITOR = "Analista 01";


const ANALISTAS = [
  "Analista 01", "Analista 02", "Analista 03", "Analista 04", "Analista 05",
  "Analista 06", "Analista 07", "Analista 08", "Analista 09",
];

const REVISORES = [
  "Revisor 01", "Revisor 02", "Revisor 03",
];

const RELATORES = [
  "CONS. JOÃO DA SILVA",
  "CONS. EM EXERC. PEDRO SOUZA",
  "CONS. SUBST. CARLOS OLIVEIRA",
  "CONS. ANTONIO SANTOS",
  "CONS. EM EXERC. PAULO FERREIRA",
];

const SITUACOES = [
  "Não Iniciado",
  "Disponível",
  "Em Análise",
  "Em Correção",
  "Revisado",
  "Validado",
  "Concluído",
] as const;
type Situacao = (typeof SITUACOES)[number];

const TIPOS = ["Análise Inicial", "Análise Documental"];
const EXERCICIOS = ["2021", "2022", "2023", "2024", "2025"];

export const TIPOS_ANALISE = ["Análise Inicial", "Análise de Defesa"] as const;
export type TipoAnalise = (typeof TIPOS_ANALISE)[number];

const PROC_BASE = [
  1207949, 1207950, 1207958, 1207959, 1208469, 1208470, 1208870, 1208871, 1209646,
];

export type Row = {
  id: string;
  orgao: string;
  numero: string;
  exercicio: string;
  tipo: string;
  tipoAnalise: TipoAnalise;
  // Número da rodada de defesa (1, 2, 3...). Indefinido em análises iniciais.
  nrDefesa?: number;
  dtConsol: string;
  dtCriacao: string;
  dtConclusao: string;
  situacao: Situacao;
  analista: string;
  revisor: string;
  relator: string;
};

const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];
const fmt = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function makeRows(): Row[] {
  const rows: Row[] = [];
  let n = 0;
  for (let i = 0; i < 64; i++) {
    const baseProc = pick(PROC_BASE, i) + Math.floor(i / PROC_BASE.length);
    const sit = pick(SITUACOES, i + 2);
    const criacao = new Date(2024, (i * 3) % 12, ((i * 7) % 27) + 1);
    const consol = new Date(criacao);
    consol.setDate(consol.getDate() + 10 + (i % 20));
    const conclusao = new Date(consol);
    conclusao.setDate(conclusao.getDate() + 15 + (i % 30));
    const concluida = sit === "Concluído" || sit === "Validado";
    const numero = String(baseProc + n++);
    rows.push({
      id: numero,
      orgao: pick(ORGAOS, i),
      numero,
      exercicio: pick(EXERCICIOS, i + 3),
      tipo: pick(TIPOS, i),
      tipoAnalise: "Análise Inicial",
      dtConsol: fmt(consol),
      dtCriacao: fmt(criacao),
      dtConclusao: concluida ? fmt(conclusao) : "—",
      situacao: sit,
      analista: pick(ANALISTAS, i),
      revisor: pick(REVISORES, i + 4),
      relator: pick(RELATORES, i + 1),
    });
  }

  // RF23 — Um processo tem 1 análise inicial e pode ter VÁRIAS defesas
  // documentais (rodadas). A defesa herda processo, órgão e relator.
  [rows[0], rows[1]].forEach((src) => {
    const criacao = new Date(2026, 4, 12);
    rows.push({
      ...src,
      id: `${src.numero}-D1`,
      tipoAnalise: "Análise de Defesa",
      nrDefesa: 1,
      situacao: "Em Análise",
      dtCriacao: fmt(criacao),
      dtConclusao: "—",
    });
  });

  // Mock — processo com 2 rodadas de defesa: nº 1 concluída, nº 2 em
  // andamento (testa o sequenciamento de rodadas).
  {
    const src = rows[2];
    const c1 = new Date(2026, 1, 10);
    const conc1 = new Date(2026, 2, 28);
    rows.push({
      ...src,
      id: `${src.numero}-D1`,
      tipoAnalise: "Análise de Defesa",
      nrDefesa: 1,
      situacao: "Concluído",
      dtCriacao: fmt(c1),
      dtConclusao: fmt(conc1),
    });
    const c2 = new Date(2026, 4, 12);
    rows.push({
      ...src,
      id: `${src.numero}-D2`,
      tipoAnalise: "Análise de Defesa",
      nrDefesa: 2,
      situacao: "Em Análise",
      dtCriacao: fmt(c2),
      dtConclusao: "—",
    });
  }

  return rows;
}

export const ALL_ROWS = makeRows();

const SIT_BADGE: Record<Situacao, string> = {
  "Não Iniciado": "bg-gray-200 text-gray-800",
  "Disponível": "bg-gray-200 text-gray-800",
  "Em Análise": "bg-blue-100 text-blue-800",
  "Em Correção": "bg-yellow-100 text-yellow-900",
  "Revisado": "bg-purple-100 text-purple-800",
  "Validado": "bg-green-100 text-green-800",
  "Concluído": "bg-emerald-700 text-white",
};

type Filters = {
  exercicios: string[];
  numero: string;
  orgao: string;
  analista: string;
  revisor: string;
  relator: string;
  situacao: string;
  tipo: string;
  tipoAnalise: string;
};

const EMPTY_FILTERS: Filters = {
  exercicios: [],
  numero: "",
  orgao: "all",
  analista: "all",
  revisor: "all",
  relator: "all",
  situacao: "all",
  tipo: "all",
  tipoAnalise: "all",
};

type SortKey = keyof Row;

function AnalisesRouteShell() {
  const { pathname } = useLocation();

  if (pathname !== "/analises") {
    return <Outlet />;
  }

  return <ProcessosPage />;
}

function ProcessosPage() {
  const navigate = useNavigate();
  const { getAtribuicao, setAtribuicao, perfil, usuario, usuarios } = useAtribuicoes();
  const usuariosAtivos = useMemo(
    () => usuarios.filter((u) => u.ativo).map((u) => u.nome),
    [usuarios]
  );
  const podeAtribuir = perfil === "Coordenador";
  const [erroAtrib, setErroAtrib] = useState<string | null>(null);
  const { isConsolidado, wasPendente } = useConsolidacao();
  const { allRows, criarDefesa, defesasDoProcesso } = useDefesas();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("dtCriacao");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [overrides, setOverrides] = useState<
    Record<string, { situacao?: Situacao }>
  >({});
  const [reinitTarget, setReinitTarget] = useState<Row | null>(null);




  const applyOverride = (r: Row): Row => {
    const o = overrides[r.id];
    if (!o) return r;
    return { ...r, ...(o.situacao ? { situacao: o.situacao } : {}) };
  };

  const base = useMemo(
    () =>
      (PERFIL === "Coordenador"
        ? allRows
        : allRows.filter((r) => r.analista === USUARIO_AUDITOR)
      )
        // Somente análises de processos já consolidados.
        .filter((r) => isConsolidado(r.numero))
        // Processo recém-consolidado começa com situação "Não Iniciado".
        .map((r) =>
          wasPendente(r.numero) && r.tipoAnalise === "Análise Inicial"
            ? { ...r, situacao: "Não Iniciado" as Situacao }
            : r
        )
        .map(applyOverride),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, allRows, isConsolidado, wasPendente]
  );


  const filtered = useMemo(() => {
    const f = applied;
    return base.filter((r) => {
      if (f.exercicios.length && !f.exercicios.includes(r.exercicio)) return false;
      if (f.numero && !r.numero.includes(f.numero.trim())) return false;
      if (f.orgao !== "all" && r.orgao !== f.orgao) return false;
      if (f.analista !== "all" && getAtribuicao(r.id).executor !== f.analista) return false;
      if (f.revisor !== "all" && getAtribuicao(r.id).revisor !== f.revisor) return false;
      if (f.relator !== "all" && r.relator !== f.relator) return false;
      if (f.situacao !== "all" && r.situacao !== f.situacao) return false;
      if (f.tipo !== "all" && r.tipo !== f.tipo) return false;
      if (f.tipoAnalise !== "all" && r.tipoAnalise !== f.tipoAnalise) return false;
      return true;
    });
  }, [applied, base, getAtribuicao]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, "pt-BR", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  // Situações iniciais (processo ainda sem análise iniciada).
  const ehInicial = (s: Situacao) =>
    s === "Disponível" || s === "Não Iniciado";
  const concluida = (s: Situacao) => s === "Concluído" || s === "Validado";

  // Permissões por linha — respeitam o responsável (executor) e o revisor
  // atribuídos. Visualização (Abrir) é liberada a todos os perfis.
  const podeReabrirRow = (r: Row) => {
    if (!concluida(r.situacao)) return false;
    const a = getAtribuicao(r.id);
    return (
      perfil === "Coordenador" ||
      (perfil === "Executor" && usuario === a.executor) ||
      (perfil === "Revisor" && usuario === a.revisor)
    );
  };
  const podeReinitRow = (r: Row) => {
    if (r.situacao === "Não Iniciado" || r.situacao === "Disponível")
      return false;
    const a = getAtribuicao(r.id);
    return (
      perfil === "Coordenador" || (perfil === "Executor" && usuario === a.executor)
    );
  };
  const temConclusao = (r: Row) => concluida(r.situacao) || r.dtConclusao !== "—";
  const podePdfRow = (r: Row) => {
    if (!temConclusao(r)) return false;
    const a = getAtribuicao(r.id);
    return (
      perfil === "Coordenador" ||
      (perfil === "Executor" && usuario === a.executor) ||
      (perfil === "Revisor" && usuario === a.revisor)
    );
  };

  // RF23 — "Nova defesa" (Coordenador): disponível em processos cuja análise
  // INICIAL está concluída e sem nenhuma rodada de defesa em aberto.
  const podeNovaDefesaRow = (r: Row) => {
    if (perfil !== "Coordenador") return false;
    if (r.tipoAnalise !== "Análise Inicial") return false;
    if (!concluida(r.situacao)) return false;
    const defesas = defesasDoProcesso(r.numero).map(
      (d) => base.find((b) => b.id === d.id) ?? d
    );
    return !defesas.some((d) => !concluida(d.situacao));
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const apply = () => {
    setApplied(draft);
    setPage(1);
  };
  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const toggleExercicio = (a: string) =>
    setDraft((p) => ({
      ...p,
      exercicios: p.exercicios.includes(a)
        ? p.exercicios.filter((x) => x !== a)
        : [...p.exercicios, a],
    }));

  const setSituacao = (id: string, s: Situacao) =>
    setOverrides((p) => ({ ...p, [id]: { ...p[id], situacao: s } }));

  // "Abrir": abre a análise; se ainda "Não Iniciado"/"Disponível", inicia.
  const handleAbrir = (r: Row) => {
    if (ehInicial(r.situacao)) setSituacao(r.id, "Em Análise");
    navigate({ to: "/analises/$id", params: { id: r.id } });
  };
  const handleNovaDefesa = (r: Row) => {
    if (!podeNovaDefesaRow(r)) return;
    const novoId = criarDefesa(r.numero);
    if (novoId) navigate({ to: "/analises/$id", params: { id: novoId } });
  };
  const handleReabrir = (r: Row) => {
    if (!podeReabrirRow(r)) return;
    setSituacao(r.id, "Em Análise");
  };
  // "Gerar PDF de conclusão geral": gera e baixa o PDF da conclusão.
  const handleGerarPdf = async (r: Row) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const sigla = getJurisdicionado(r.orgao).sigla;
    doc.setFontSize(16);
    doc.text("Relatório de Conclusão Geral", 20, 22);
    doc.setDrawColor(180);
    doc.line(20, 26, 190, 26);
    doc.setFontSize(11);
    let y = 38;
    const linha = (label: string, valor: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(valor), 70, y);
      y += 9;
    };
    linha("Órgão", `${r.orgao}${sigla ? ` (${sigla})` : ""}`);
    linha("Nº Processo", r.numero);
    linha("Exercício", r.exercicio);
    linha("Relator", r.relator);
    linha(
      "Tipo",
      r.tipoAnalise === "Análise de Defesa"
        ? `Defesa nº ${r.nrDefesa ?? 1}`
        : "Inicial"
    );
    linha("Situação", r.situacao);
    linha("Responsável", getAtribuicao(r.id).executor ?? "—");
    linha("Revisor", getAtribuicao(r.id).revisor ?? "—");
    linha("Data de Conclusão", r.dtConclusao);
    doc.save(`conclusao-${r.numero}.pdf`);
  };
  const confirmReinitAction = () => {
    if (reinitTarget) setSituacao(reinitTarget.id, "Não Iniciado");
    setReinitTarget(null);
  };

  // RF — atribuição inline de Responsável (executor) e Revisor pelo
  // Coordenador. Executor e Revisor não podem ser a mesma pessoa.
  const setCampoAtribuicao = (
    id: string,
    campo: "executor" | "revisor",
    valor: string | null
  ) => {
    const atual = getAtribuicao(id);
    const novo = { ...atual, [campo]: valor };
    if (novo.executor && novo.revisor && novo.executor === novo.revisor) {
      setErroAtrib("Executor e Revisor não podem ser a mesma pessoa.");
      return;
    }
    setErroAtrib(null);
    setAtribuicao(id, novo);
  };



  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Processos</h1>
          <p className="text-sm text-muted-foreground">
            Perfil: <span className="font-medium text-foreground">{PERFIL}</span>
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <FilterField label="Exercício">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-full justify-between font-normal">
                  <span className="truncate">
                    {draft.exercicios.length
                      ? draft.exercicios.join(", ")
                      : "Todos"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Selecionar exercícios</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {EXERCICIOS.map((a) => (
                  <DropdownMenuCheckboxItem
                    key={a}
                    checked={draft.exercicios.includes(a)}
                    onCheckedChange={() => toggleExercicio(a)}
                  >
                    {a}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </FilterField>

          <FilterField label="Nº Processo">
            <Input
              value={draft.numero}
              onChange={(e) => set("numero", e.target.value)}
              placeholder="Ex: 1207949"
              className="h-9"
            />
          </FilterField>

          <FilterField label="Órgão">
            <SimpleSelect
              value={draft.orgao}
              onValueChange={(v) => set("orgao", v)}
              options={ORGAOS}
            />
          </FilterField>

          <FilterField label="Responsável">
            <SimpleSelect
              value={draft.analista}
              onValueChange={(v) => set("analista", v)}
              options={usuariosAtivos}
            />
          </FilterField>

          <FilterField label="Revisor">
            <SimpleSelect
              value={draft.revisor}
              onValueChange={(v) => set("revisor", v)}
              options={usuariosAtivos}
            />
          </FilterField>

          <FilterField label="Relator">
            <SimpleSelect
              value={draft.relator}
              onValueChange={(v) => set("relator", v)}
              options={RELATORES}
            />
          </FilterField>

          <FilterField label="Situação da Análise">
            <SimpleSelect
              value={draft.situacao}
              onValueChange={(v) => set("situacao", v)}
              options={[...SITUACOES]}
            />
          </FilterField>

          <FilterField label="Modalidade">
            <SimpleSelect
              value={draft.tipo}
              onValueChange={(v) => set("tipo", v)}
              options={TIPOS}
            />
          </FilterField>

          <FilterField label="Tipo de Análise">
            <SimpleSelect
              value={draft.tipoAnalise}
              onValueChange={(v) => set("tipoAnalise", v)}
              options={[...TIPOS_ANALISE]}
            />
          </FilterField>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={clearAll}
            title="Limpar filtros"
            aria-label="Limpar filtros"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button onClick={apply} className="gap-2 bg-[#1A56DB] hover:bg-[#1A56DB]/90">
            <Filter className="h-4 w-4" /> Aplicar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {erroAtrib && (
        <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
          {erroAtrib}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th label="Órgão" k="orgao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Nº Processo" k="numero" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Exercício" k="exercicio" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Relator" k="relator" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Tipo" k="tipoAnalise" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Situação" k="situacao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                  Responsável
                </th>
                <th className="whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
                  Revisor
                </th>
                <th className="w-10 px-2 py-2.5" aria-label="Detalhes" />
                <th className="whitespace-nowrap px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                return (
                  <tr
                    key={r.id}
                    className="bg-white transition-colors hover:bg-blue-50"
                  >
                    <td className="px-2 py-1.5">
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-[160px] truncate font-medium text-foreground">
                              {r.orgao}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {r.orgao}
                            {getJurisdicionado(r.orgao).sigla
                              ? ` (${getJurisdicionado(r.orgao).sigla})`
                              : ""}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 font-mono text-foreground">{r.numero}</td>
                    <td className="px-2 py-1.5 text-foreground">{r.exercicio}</td>
                    <td className="px-2 py-1.5 text-foreground">
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-[140px] truncate">{r.relator}</span>
                          </TooltipTrigger>
                          <TooltipContent>{r.relator}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.tipoAnalise === "Análise de Defesa"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.tipoAnalise === "Análise de Defesa"
                          ? `Defesa nº ${r.nrDefesa ?? 1}`
                          : "Inicial"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${SIT_BADGE[r.situacao]}`}
                      >
                        {r.situacao}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <AtribInlineCell
                        value={getAtribuicao(r.id).executor}
                        editavel={podeAtribuir}
                        options={usuariosAtivos}
                        excluir={getAtribuicao(r.id).revisor}
                        onChange={(v) => setCampoAtribuicao(r.id, "executor", v)}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <AtribInlineCell
                        value={getAtribuicao(r.id).revisor}
                        editavel={podeAtribuir}
                        options={usuariosAtivos}
                        excluir={getAtribuicao(r.id).executor}
                        onChange={(v) => setCampoAtribuicao(r.id, "revisor", v)}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <DetalhesPopover r={r} />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <AcoesCell
                        r={r}
                        ehInicial={ehInicial(r.situacao)}
                        podeReabrir={podeReabrirRow(r)}
                        podeReinit={podeReinitRow(r)}
                        podePdf={podePdfRow(r)}
                        podeNovaDefesa={podeNovaDefesaRow(r)}
                        onAbrir={() => handleAbrir(r)}
                        onReabrir={() => handleReabrir(r)}
                        onReinit={() => setReinitTarget(r)}
                        onPdf={() => handleGerarPdf(r)}
                        onNovaDefesa={() => handleNovaDefesa(r)}
                      />
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-muted-foreground">
                    Nenhum processo encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-white px-4 py-3 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Itens por página:</span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pager page={currentPage} totalPages={totalPages} onChange={setPage} />

          <div className="text-sm font-medium text-foreground">
            Total de {total} registros
          </div>
        </div>
      </div>

      {/* Modal Reinicializar */}
      <Dialog
        open={!!reinitTarget}
        onOpenChange={(o) => !o && setReinitTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reinicializar análise</DialogTitle>
            <DialogDescription>
              Descarta todas as inclusões e edições manuais e restaura os dados
              originais da consolidação (IND_VALIDO/IND_ORIGEM). Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReinitTarget(null)}>
              Cancelar
            </Button>

            <Button
              onClick={confirmReinitAction}
              className="bg-[#EA580C] text-white hover:bg-[#EA580C]/90"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SimpleSelect({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder="Todos" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value="all">Todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const NAO_ATRIB = "__none__";

// Responsável/Revisor: texto simples; para o Coordenador, clicar transforma
// em select inline que fecha ao selecionar.
function AtribInlineCell({
  value,
  editavel,
  options,
  excluir,
  onChange,
}: {
  value: string | null;
  editavel: boolean;
  options: string[];
  excluir: string | null;
  onChange: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (!editavel) {
    return (
      <span className="whitespace-nowrap text-foreground">{value || "—"}</span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="whitespace-nowrap text-left text-foreground underline-offset-2 hover:text-[#1A56DB] hover:underline"
        title="Clique para atribuir"
      >
        {value || "—"}
      </button>
    );
  }

  return (
    <Select
      open
      value={value ?? NAO_ATRIB}
      onValueChange={(v) => {
        onChange(v === NAO_ATRIB ? null : v);
        setEditing(false);
      }}
      onOpenChange={(o) => {
        if (!o) setEditing(false);
      }}
    >
      <SelectTrigger className="h-8 w-[160px]">
        <SelectValue placeholder="Atribuir" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={NAO_ATRIB}>— Não atribuído —</SelectItem>
        {options
          .filter((o) => o !== excluir)
          .map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

// Coluna "Ações": botões que EXECUTAM a ação diretamente. "Abrir" (todos os
// perfis) fica sempre visível; as demais ações ficam no menu "⋯" e só
// aparecem para os perfis autorizados, respeitando o responsável atribuído.
function AcoesCell({
  r,
  ehInicial,
  podeReabrir,
  podeReinit,
  podePdf,
  podeNovaDefesa,
  onAbrir,
  onReabrir,
  onReinit,
  onPdf,
  onNovaDefesa,
}: {
  r: Row;
  ehInicial: boolean;
  podeReabrir: boolean;
  podeReinit: boolean;
  podePdf: boolean;
  podeNovaDefesa: boolean;
  onAbrir: () => void;
  onReabrir: () => void;
  onReinit: () => void;
  onPdf: () => void;
  onNovaDefesa: () => void;
}) {
  const temMenu = podeReabrir || podeReinit || podePdf || podeNovaDefesa;
  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-[#1A56DB] hover:bg-[#1A56DB]/10"
              onClick={onAbrir}
            >
              {ehInicial ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {ehInicial ? "Abrir e iniciar análise" : "Abrir análise"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {temMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label="Mais ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {podeReabrir && (
              <DropdownMenuItem onClick={onReabrir}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reabrir
              </DropdownMenuItem>
            )}
            {podeReinit && (
              <DropdownMenuItem
                onClick={onReinit}
                className="text-[#EA580C] focus:text-[#EA580C]"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reinicializar
              </DropdownMenuItem>
            )}
            {podePdf && (
              <DropdownMenuItem onClick={onPdf}>
                <FileText className="mr-2 h-4 w-4" /> Gerar PDF de conclusão geral
              </DropdownMenuItem>
            )}
            {podeNovaDefesa && (
              <DropdownMenuItem onClick={onNovaDefesa}>
                <Layers className="mr-2 h-4 w-4" /> Nova defesa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}



// Popover de detalhes (ⓘ): datas do processo.
function DetalhesPopover({ r }: { r: Row }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Detalhes do processo"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Órgão
            </p>
            <p className="mt-1 font-medium text-foreground">
              {r.orgao}
              {getJurisdicionado(r.orgao).sigla
                ? ` (${getJurisdicionado(r.orgao).sigla})`
                : ""}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Datas
            </p>
            <dl className="mt-1.5 space-y-1">
              <DetalheLinha label="Criação" valor={r.dtCriacao} />
              <DetalheLinha label="Consolidação" valor={r.dtConsol} />
              <DetalheLinha label="Conclusão" valor={r.dtConclusao} />
            </dl>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DetalheLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{valor}</dd>
    </div>
  );
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className="whitespace-nowrap px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1.5 hover:text-[#00C2CB]"
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "opacity-100" : "opacity-50"}`} />
      </button>
    </th>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: number[] = [];
  const win = 2;
  const from = Math.max(1, page - win);
  const to = Math.min(totalPages, page + win);
  for (let i = from; i <= to; i++) pages.push(i);

  const btn =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-white px-2 text-sm text-foreground hover:bg-accent disabled:opacity-40 disabled:hover:bg-white";

  return (
    <div className="flex items-center gap-1">
      <button className={btn} onClick={() => onChange(1)} disabled={page === 1}>
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button className={btn} onClick={() => onChange(page - 1)} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`${btn} ${
            p === page ? "border-[#1A56DB] bg-[#1A56DB] text-white hover:bg-[#1A56DB]" : ""
          }`}
        >
          {p}
        </button>
      ))}
      <button
        className={btn}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        className={btn}
        onClick={() => onChange(totalPages)}
        disabled={page === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
