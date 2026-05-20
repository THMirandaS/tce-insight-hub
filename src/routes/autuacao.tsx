import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TopNav } from "@/components/pce/TopNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FileCheck2, Layers, X,
} from "lucide-react";

export const Route = createFileRoute("/autuacao")({
  component: AutuacaoPage,
});

const ORGAOS = [
  "Secretaria de Estado de Fazenda (SEF)",
  "Secretaria de Estado de Saúde (SES)",
  "Secretaria de Estado de Educação (SEE)",
  "Secretaria de Estado de Infraestrutura (SEINFRA)",
  "Secretaria de Estado de Segurança Pública (SSP)",
  "Secretaria de Estado de Meio Ambiente (SEMAD)",
  "Fundação João Pinheiro (FJP)",
  "Instituto Estadual de Florestas (IEF)",
  "IPSEMG — Instituto de Previdência dos Servidores de MG",
  "FHEMIG — Fundação Hospitalar do Estado de MG",
  "CEMIG — Companhia Energética de MG",
  "COPASA — Companhia de Saneamento de MG",
  "BDMG — Banco de Desenvolvimento de MG",
  "Defensoria Pública do Estado de MG",
  "Tribunal de Justiça de MG (TJMG)",
];

const ANALISTAS = [
  "M. Andrade", "P. Cardoso", "R. Nogueira", "S. Vieira", "T. Barbosa", "L. Cunha",
];

type Situacao = "Disponível para autuar" | "Em processo de consolidação" | "Análise consolidada";

type Row = {
  id: string;
  orgao: string;
  exercicio: string;
  tipo: string;
  data: string;
  ultimo: string;
  analista: string;
  situacao: Situacao;
};

const SITUACOES: Situacao[] = [
  "Disponível para autuar",
  "Em processo de consolidação",
  "Análise consolidada",
];

function makeRows(): Row[] {
  return ORGAOS.map((m, i) => {
    const day = String((i % 28) + 1).padStart(2, "0");
    const month = String(((i % 6) + 1)).padStart(2, "0");
    return {
      id: `${i}`,
      orgao: m,
      exercicio: "2025",
      tipo: "Análise Inicial",
      data: `${day}/${month}/2025`,
      ultimo: ANALISTAS[i % ANALISTAS.length],
      analista: "",
      situacao: SITUACOES[i % SITUACOES.length],
    };
  });
}


function situacaoBadge(s: Situacao) {
  const map: Record<Situacao, string> = {
    "Disponível para autuar": "bg-emerald-100 text-emerald-800 ring-emerald-200",
    "Em processo de consolidação": "bg-amber-100 text-amber-800 ring-amber-200",
    "Análise consolidada": "bg-sky-100 text-sky-800 ring-sky-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${map[s]}`}>
      {s}
    </span>
  );
}

function AutuacaoPage() {
  const [rows, setRows] = useState<Row[]>(() => makeRows());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState("10");
  const [page, setPage] = useState(1);

  const total = 837; // ficcional
  const perPageN = Number(perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPageN));

  const pageRows = useMemo(() => rows.slice(0, perPageN), [rows, perPageN]);
  const allChecked = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const someChecked = pageRows.some((r) => selected.has(r.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allChecked) pageRows.forEach((r) => next.delete(r.id));
    else pageRows.forEach((r) => next.add(r.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const setAnalista = (id: string, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, analista: value } : r)));
  };

  const count = selected.size;

  const handleAutuar = () => {
    toast.success(`${count} processo(s) autuado(s) com sucesso`, {
      description: "Dados buscados no SGAP. Processos disponíveis na tela de Processos.",
    });
    setSelected(new Set());
  };
  const handleConsolidar = () => {
    toast.success(`${count} processo(s) consolidado(s) com sucesso`, {
      description: "Autuação e consolidação executadas simultaneamente.",
    });
    setSelected(new Set());
  };

  const from = (page - 1) * perPageN + 1;
  const to = Math.min(page * perPageN, total);

  return (
    <div className="min-h-screen bg-background">
      <TopNav perfil="Coordenador" />
      <main className="mx-auto max-w-[1600px] px-6 py-6 space-y-5">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Autuação de Processos
            </h2>
            <p className="text-sm text-muted-foreground">
              Municípios com processos disponíveis para autuação. Ao autuar, os dados
              são buscados automaticamente no SGAP.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">Perfil: Coordenador</Badge>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {count > 0 && (
            <div className="flex items-center justify-between gap-3 bg-sidebar text-sidebar-foreground px-4 py-3 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(new Set())}
                  className="rounded p-1 hover:bg-sidebar-accent"
                  aria-label="Limpar seleção"
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">
                  {count} município(s) selecionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAutuar}
                  className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                >
                  <FileCheck2 className="h-4 w-4 mr-1.5" /> Autuar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleConsolidar}
                >
                  <Layers className="h-4 w-4 mr-1.5" /> Consolidar
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border">
                  <TableHead className="w-10 text-sidebar-foreground">
                    <Checkbox
                      checked={allChecked || (someChecked && "indeterminate")}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  {["Município","Exercício","Tipo de Análise","Data Disponibilização","Último Analista","Atribuir Analista","Situação"].map((h) => (
                    <TableHead key={h} className="text-sidebar-foreground font-semibold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r, i) => (
                  <TableRow
                    key={r.id}
                    className={i % 2 === 1 ? "bg-muted/40" : ""}
                    data-state={selected.has(r.id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleOne(r.id)}
                        aria-label={`Selecionar ${r.municipio}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{r.municipio}</TableCell>
                    <TableCell>{r.exercicio}</TableCell>
                    <TableCell>{r.tipo}</TableCell>
                    <TableCell>{r.data}</TableCell>
                    <TableCell>{r.ultimo}</TableCell>
                    <TableCell>
                      <Select value={r.analista || undefined} onValueChange={(v) => setAnalista(r.id, v)}>
                        <SelectTrigger className="h-8 w-44">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ANALISTAS.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{situacaoBadge(r.situacao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Mostrando <strong className="text-foreground">{from}</strong> a{" "}
                <strong className="text-foreground">{to}</strong> de{" "}
                <strong className="text-foreground">{total}</strong> registros
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Itens por página:</span>
                <Select value={perPage} onValueChange={(v) => { setPerPage(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["10","25","50"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              {[page, page + 1, page + 2].filter((p) => p <= totalPages).map((p) => (
                <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 min-w-8 px-2" onClick={() => setPage(p)}>
                  {p}
                </Button>
              ))}
              <span className="px-1 text-muted-foreground">…</span>
              <Button variant="outline" size="sm" className="h-8 min-w-8 px-2" onClick={() => setPage(totalPages)}>{totalPages}</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
