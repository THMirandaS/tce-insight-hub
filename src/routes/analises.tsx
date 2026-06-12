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
  Loader2,
  Layers,
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
import { ORGAOS } from "@/lib/pce-data";
import { useAtribuicoes } from "@/lib/atribuicoes";
import { useConsolidacao } from "@/lib/consolidacao-store";
import { useDefesas } from "@/lib/defesas-store";
import type { ConsolidacaoStatus } from "@/lib/consolidacao";

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
  const { getAtribuicao, setAtribuicao, perfil, usuarios } = useAtribuicoes();
  const usuariosAtivos = useMemo(
    () => usuarios.filter((u) => u.ativo).map((u) => u.nome),
    [usuarios]
  );
  const podeAtribuir = perfil === "Coordenador";
  const [erroAtrib, setErroAtrib] = useState<string | null>(null);
  const { getStatus, consolidar } = useConsolidacao();
  const { allRows, criarDefesa, defesasDoProcesso } = useDefesas();
  const podeConsolidar = perfil === "Executor" || perfil === "Coordenador";
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("dtCriacao");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<
    Record<string, { situacao?: Situacao }>
  >({});
  const [confirmReinit, setConfirmReinit] = useState(false);

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
      ).map(applyOverride),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, allRows]
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
  }, [applied, base]);

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

  const selectedRow = useMemo(
    () => (selectedId ? base.find((r) => r.id === selectedId) ?? null : null),
    [selectedId, base]
  );

  // Processo sem executor atribuído: abertura bloqueada (RF — atribuições).
  const semExecutor = selectedRow
    ? !getAtribuicao(selectedRow.id).executor
    : false;

  // A análise só pode ser INICIADA após a consolidação dos dados estar
  // "Concluída". Antes disso o processo abre apenas em modo visualização.
  const consolStatus: ConsolidacaoStatus = selectedRow
    ? getStatus(selectedRow.id)
    : "Concluída";
  const podeIniciarAnalise = consolStatus === "Concluída";

  // RF23 — "Nova defesa" (Coordenador): disponível em processos cuja análise
  // INICIAL está concluída e sem nenhuma rodada de defesa em aberto.
  const concluida = (s: Situacao) => s === "Concluído" || s === "Validado";
  const podeNovaDefesa = useMemo(() => {
    if (!selectedRow) return false;
    if (perfil !== "Coordenador") return false;
    if (selectedRow.tipoAnalise !== "Análise Inicial") return false;
    if (!concluida(selectedRow.situacao)) return false;
    // Considera overrides de situação aplicados às defesas existentes.
    const defesas = defesasDoProcesso(selectedRow.numero).map(
      (d) => base.find((b) => b.id === d.id) ?? d
    );
    return !defesas.some((d) => !concluida(d.situacao));
  }, [selectedRow, perfil, defesasDoProcesso, base]);

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

  const handleCriar = () => {
    if (!selectedRow || !podeIniciarAnalise) return;
    setSituacao(selectedRow.id, "Em Análise");
    navigate({ to: "/analises/$id", params: { id: selectedRow.id } });
  };
  const handleVisualizar = () => {
    if (!selectedRow) return;
    navigate({ to: "/analises/$id", params: { id: selectedRow.id } });
  };
  const handleNovaDefesa = () => {
    if (!selectedRow || !podeNovaDefesa) return;
    const novoId = criarDefesa(selectedRow.numero);
    if (novoId) {
      setSelectedId(novoId);
      navigate({ to: "/analises/$id", params: { id: novoId } });
    }
  };
  const handleReabrir = () => {
    if (!selectedRow || selectedRow.situacao !== "Concluído") return;
    setSituacao(selectedRow.id, "Em Análise");
  };
  const confirmReinitAction = () => {
    if (selectedRow) setSituacao(selectedRow.id, "Disponível");
    setConfirmReinit(false);
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
    <main className="mx-auto max-w-[1600px] px-6 py-8 pb-32">
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
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th label="Órgão" k="orgao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Nº Processo" k="numero" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Exercício" k="exercicio" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Modalidade" k="tipo" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Tipo de Análise" k="tipoAnalise" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Data Consolidação" k="dtConsol" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Data Criação" k="dtCriacao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Data Conclusão" k="dtConclusao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <Th label="Situação" k="situacao" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Consolidação
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Responsável
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  Revisor
                </th>
                <Th label="Relator" k="relator" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const isSel = selectedId === r.id;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(isSel ? null : r.id)}
                    className={`cursor-pointer transition-colors ${
                      isSel
                        ? "bg-blue-100 hover:bg-blue-100"
                        : "bg-white hover:bg-blue-50"
                    }`}
                  >
                    <td className="px-3 py-2.5 text-foreground">{r.orgao}</td>
                    <td className="px-3 py-2.5 font-mono text-foreground">{r.numero}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.exercicio}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.tipo}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.tipoAnalise === "Análise de Defesa"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.tipoAnalise === "Análise de Defesa" && r.nrDefesa
                          ? `Análise de Defesa nº ${r.nrDefesa}`
                          : r.tipoAnalise}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.dtConsol}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.dtCriacao}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.dtConclusao}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SIT_BADGE[r.situacao]}`}
                      >
                        {r.situacao}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <ConsolidacaoCell
                        status={getStatus(r.id)}
                        podeConsolidar={podeConsolidar}
                        onConsolidar={() => consolidar(r.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <AtribSelect
                        value={getAtribuicao(r.id).executor}
                        editavel={podeAtribuir}
                        placeholder="Atribuir responsável"
                        options={usuariosAtivos}
                        excluir={getAtribuicao(r.id).revisor}
                        onChange={(v) => setCampoAtribuicao(r.id, "executor", v)}
                      />
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <AtribSelect
                        value={getAtribuicao(r.id).revisor}
                        editavel={podeAtribuir}
                        placeholder="Atribuir revisor"
                        options={usuariosAtivos}
                        excluir={getAtribuicao(r.id).executor}
                        onChange={(v) => setCampoAtribuicao(r.id, "revisor", v)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{r.relator}</td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-3 py-10 text-center text-muted-foreground">
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

      {/* Barra de ações fixa */}
      {selectedRow && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#0D1B2A] bg-[#0D1B2A] shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.3)]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="text-sm text-white/90">
              Processo selecionado:{" "}
              <span className="font-mono font-semibold text-white">
                {selectedRow.numero}
              </span>
              <span className="mx-2 text-white/40">•</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SIT_BADGE[selectedRow.situacao]}`}
              >
                {selectedRow.situacao}
              </span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {semExecutor ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          disabled
                          className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90 disabled:opacity-40"
                        >
                          {selectedRow.situacao === "Disponível" ? (
                            <>
                              <Plus className="h-4 w-4" /> Criar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" /> Visualizar
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Processo sem executor atribuído. Atribua um executor em
                      "Atribuição de Análises" para abrir.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : selectedRow.situacao === "Disponível" && podeIniciarAnalise ? (
                <Button
                  onClick={handleCriar}
                  className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                >
                  <Plus className="h-4 w-4" /> Criar
                </Button>
              ) : selectedRow.situacao === "Disponível" && !podeIniciarAnalise ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          onClick={handleVisualizar}
                          className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                        >
                          <Eye className="h-4 w-4" /> Visualizar
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Aguardando consolidação dos dados. A análise só pode ser
                      iniciada após a consolidação ser concluída.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  onClick={handleVisualizar}
                  className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                >
                  <Eye className="h-4 w-4" /> Visualizar
                </Button>
              )}
              <Button
                onClick={handleReabrir}
                disabled={selectedRow.situacao !== "Concluído"}
                className="gap-2 bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90 disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> Reabrir
              </Button>
              <Button
                onClick={() => setConfirmReinit(true)}
                disabled={
                  selectedRow.situacao !== "Em Análise" &&
                  selectedRow.situacao !== "Concluído"
                }
                className="gap-2 bg-[#EA580C] text-white hover:bg-[#EA580C]/90 disabled:opacity-40"
              >
                <RefreshCw className="h-4 w-4" /> Reinicializar
              </Button>
              {podeNovaDefesa && (
                <Button
                  onClick={handleNovaDefesa}
                  className="gap-2 bg-[#9333EA] text-white hover:bg-[#9333EA]/90"
                >
                  <Layers className="h-4 w-4" /> Nova defesa
                </Button>
              )}
              <Button
                disabled={selectedRow.situacao !== "Concluído"}
                className="gap-2 bg-[#16A34A] text-white hover:bg-[#16A34A]/90 disabled:opacity-40"
              >
                <FileText className="h-4 w-4" /> Relatório Conclusão Análise
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reinicializar */}
      <Dialog open={confirmReinit} onOpenChange={setConfirmReinit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reinicializar análise</DialogTitle>
            <DialogDescription>
              Deseja reinicializar esta análise? Todos os dados preenchidos
              serão apagados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReinit(false)}>
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
    <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
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

const CONSOL_BADGE: Record<ConsolidacaoStatus, string> = {
  Pendente: "bg-gray-200 text-gray-800",
  Processando: "bg-blue-100 text-blue-800",
  Concluída: "bg-emerald-100 text-emerald-800",
  Erro: "bg-red-100 text-red-800",
};

function ConsolidacaoCell({
  status,
  podeConsolidar,
  onConsolidar,
}: {
  status: ConsolidacaoStatus;
  podeConsolidar: boolean;
  onConsolidar: () => void;
}) {
  if (status === "Processando") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando
      </span>
    );
  }

  if (status === "Concluída") {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONSOL_BADGE.Concluída}`}
      >
        Concluída
      </span>
    );
  }

  // Pendente ou Erro: exibe badge e, para perfis autorizados, ação.
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONSOL_BADGE[status]}`}
      >
        {status}
      </span>
      {status === "Erro" && (
        <span className="text-[11px] text-red-700">
          Falha ao consolidar. Tente novamente.
        </span>
      )}
      {podeConsolidar && (
        <Button
          size="sm"
          onClick={onConsolidar}
          className="h-7 gap-1.5 bg-[#1A56DB] px-2.5 text-xs text-white hover:bg-[#1A56DB]/90"
        >
          <Layers className="h-3.5 w-3.5" />
          {status === "Erro" ? "Tentar novamente" : "Consolidar"}
        </Button>
      )}
    </div>
  );
}
