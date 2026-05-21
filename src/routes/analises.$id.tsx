import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
  AlertCircle,
  Activity,
  Circle,
  Eye,
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

function escapeHTML(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

type SubmenuStatus =
  | "nao-iniciado"
  | "em-andamento"
  | "concluido"
  | "em-correcao"
  | "corrigido"
  | "revisado";

type Perfil = "Auditor" | "Revisor" | "Coordenador";

const STATUS_META: Record<
  SubmenuStatus,
  { label: string; Icon: typeof AlertCircle; className: string; pillBg: string }
> = {
  "nao-iniciado":   { label: "Não Iniciado", Icon: AlertCircle,  className: "text-gray-400",   pillBg: "bg-gray-100 text-gray-700" },
  "em-andamento":   { label: "Em Andamento", Icon: Activity,     className: "text-[#1A56DB]",  pillBg: "bg-blue-50 text-[#1A56DB]" },
  "concluido":      { label: "Concluído",    Icon: CheckCircle2, className: "text-green-600",  pillBg: "bg-green-50 text-green-700" },
  "corrigido":      { label: "Corrigido",    Icon: CheckCircle2, className: "text-green-600",  pillBg: "bg-green-50 text-green-700" },
  "em-correcao":    { label: "Em Correção",  Icon: AlertTriangle,className: "text-amber-500",  pillBg: "bg-amber-50 text-amber-700" },
  "revisado":       { label: "Revisado",     Icon: Circle,       className: "text-purple-600", pillBg: "bg-purple-50 text-purple-700" },
};

function StatusIcon({ status }: { status: SubmenuStatus }) {
  const { Icon, className } = STATUS_META[status];
  return <Icon className={`h-4 w-4 shrink-0 ${className}`} aria-label={STATUS_META[status].label} />;
}

function AnaliseDetalhePage() {
  const { id } = Route.useParams();
  const [active, setActive] = useState<string>("anteriores");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    anteriores: false,
    demais: false,
    pce: true,
  });
  const contentRef = useRef<HTMLElement | null>(null);

  // Perfil atual (poderia vir de auth). Coordenador vê todas as ações.
  const [perfil] = useState<Perfil>("Coordenador");

  // Status por submenu PCE (persistido ao navegar entre submenus)
  const [statuses, setStatuses] = useState<Record<string, SubmenuStatus>>(
    () => Object.fromEntries(PCE_ITEMS.map((i) => [i.key, "nao-iniciado" as SubmenuStatus]))
  );
  const [legendOpen, setLegendOpen] = useState(false);
  const [creditoTab, setCreditoTab] = useState<"principal" | "memoria">("principal");

  const currentStatus: SubmenuStatus | null =
    statuses[active] !== undefined ? statuses[active] : null;

  function openSubmenu(key: string) {
    setActive(key);
    setStatuses((p) =>
      p[key] === "nao-iniciado" ? { ...p, [key]: "em-andamento" } : p
    );
  }

  function handleSalvar() {
    if (currentStatus === null) return;
    setStatuses((p) => {
      const s = p[active];
      if (s === "em-andamento") return { ...p, [active]: "concluido" };
      if (s === "em-correcao") return { ...p, [active]: "corrigido" };
      return p;
    });
  }

  function handleCorrecao() {
    if (currentStatus === null) return;
    setStatuses((p) =>
      p[active] === "concluido" || p[active] === "corrigido" || p[active] === "revisado"
        ? { ...p, [active]: "em-correcao" }
        : p
    );
  }

  function handleConcluir() {
    if (currentStatus === null) return;
    setStatuses((p) => ({ ...p, [active]: "concluido" }));
  }

  function handleMarcarRevisado() {
    if (currentStatus === null) return;
    setStatuses((p) =>
      p[active] === "corrigido" || p[active] === "concluido"
        ? { ...p, [active]: "revisado" }
        : p
    );
  }

  const podeRevisar = perfil === "Revisor" || perfil === "Coordenador";

  const row = useMemo(
    () => ALL_ROWS.find((r) => r.numero === id),
    [id]
  );

  const processoLabel = id;
  const orgao = row?.orgao ?? "—";
  const relator = "CONS. JOÃO DA SILVA";
  const auditor = "Auditor 01";

  const activeLabel =
    GROUPS.find((g) => g.key === active)?.label ??
    PCE_ITEMS.find((i) => i.key === active)?.label ??
    "";

  function handleGerarPDF() {
    const node = contentRef.current;
    if (!node) return;
    const clone = node.cloneNode(true) as HTMLElement;

    // Inline form values so the print snapshot matches what's on screen
    const origInputs = node.querySelectorAll<HTMLInputElement>("input");
    clone.querySelectorAll<HTMLInputElement>("input").forEach((el, i) => {
      const src = origInputs[i];
      if (!src) return;
      if (src.type === "checkbox" || src.type === "radio") {
        if (src.checked) el.setAttribute("checked", "");
        else el.removeAttribute("checked");
      } else {
        el.setAttribute("value", src.value);
      }
    });
    const origTAs = node.querySelectorAll<HTMLTextAreaElement>("textarea");
    clone.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((el, i) => {
      const src = origTAs[i];
      if (!src) return;
      el.textContent = src.value;
    });
    // Reflect Radix checkbox state (data-state="checked")
    const origCk = node.querySelectorAll<HTMLElement>('[role="checkbox"]');
    clone.querySelectorAll<HTMLElement>('[role="checkbox"]').forEach((el, i) => {
      const src = origCk[i];
      if (!src) return;
      el.setAttribute("data-state", src.getAttribute("data-state") ?? "unchecked");
    });

    const now = new Date();
    const dataHora = now.toLocaleString("pt-BR");

    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>PCE - ${activeLabel} - ${processoLabel}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A4; margin: 16mm 12mm; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color:#0D1B2A; }
  .pdf-header { border-bottom: 2px solid #1A56DB; padding-bottom: 8px; margin-bottom: 16px; display:flex; flex-wrap:wrap; gap:16px 24px; font-size:12px; }
  .pdf-header .cell .lbl { font-size:10px; text-transform:uppercase; color:#475569; letter-spacing:.04em; }
  .pdf-header .cell .val { font-weight:600; color:#0D1B2A; }
  .pdf-title { text-align:center; font-size:16px; font-weight:700; color:#0D1B2A; margin: 8px 0 16px; text-transform:uppercase; letter-spacing:.04em; }
  .pdf-footer { margin-top: 24px; padding-top: 8px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#475569; }
  button { display:none !important; }
  [data-pdf-hide], .sr-only { display:none !important; }
  textarea, input { border:1px solid #cbd5e1 !important; background:#fff !important; color:#0D1B2A !important; }
  table { width:100%; border-collapse: collapse; }
</style>
</head><body>
<div class="pdf-header">
  <div class="cell"><div class="lbl">Processo</div><div class="val">${escapeHTML(processoLabel)}</div></div>
  <div class="cell"><div class="lbl">Órgão</div><div class="val">${escapeHTML(orgao)}</div></div>
  <div class="cell"><div class="lbl">Relator</div><div class="val">${escapeHTML(relator)}</div></div>
  <div class="cell"><div class="lbl">Auditor</div><div class="val">${escapeHTML(auditor)}</div></div>
</div>
<h1 class="pdf-title">${escapeHTML(activeLabel)}</h1>
<div id="pdf-content"></div>
<div class="pdf-footer">
  <span>Gerado em: ${escapeHTML(dataHora)} — Usuário: ${escapeHTML(auditor)}</span>
  <span>PCE — Prestação de Contas Estaduais</span>
</div>
</body></html>`);
    w.document.close();
    const mount = w.document.getElementById("pdf-content");
    if (mount) mount.appendChild(clone);
    const trigger = () => {
      w.focus();
      w.print();
    };
    // Wait for Tailwind CDN to apply styles
    setTimeout(trigger, 600);
  }


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
                        const st = statuses[it.key];
                        return (
                          <li key={it.key}>
                            <button
                              type="button"
                              onClick={() => openSubmenu(it.key)}
                              title={`Status: ${STATUS_META[st].label}`}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-[#1A56DB] font-medium text-white"
                                  : "text-white/80 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <StatusIcon status={st} />
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
        {/* Legenda de Status (recolhível) */}
        <div className="sticky top-0 z-40 border-b border-border bg-white">
          <div className="px-6 py-2">
            <button
              type="button"
              onClick={() => setLegendOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-[#0D1B2A] hover:bg-gray-100"
              aria-expanded={legendOpen}
            >
              {legendOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Legenda de Status
            </button>
            {legendOpen && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-2 pb-2">
                {(
                  [
                    "nao-iniciado",
                    "em-andamento",
                    "concluido",
                    "corrigido",
                    "em-correcao",
                    "revisado",
                  ] as SubmenuStatus[]
                ).map((s) => {
                  const { Icon, className, label } = STATUS_META[s];
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 text-xs text-[#0D1B2A]"
                    >
                      <Icon className={`h-4 w-4 ${className}`} />
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cabeçalho fixo do processo */}
        <header className="sticky top-[37px] z-30 border-b-2 border-[#1A56DB] bg-white shadow-sm">
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
            {currentStatus && (
              <>
                <Divider />
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[currentStatus].pillBg}`}
                >
                  <StatusIcon status={currentStatus} />
                  {STATUS_META[currentStatus].label}
                </span>
              </>
            )}
          </div>
        </header>

        <section ref={contentRef} className="min-w-0 flex-1 px-6 py-6 pb-28">
          {active === "responsavel" ? (
            <ResponsavelContent processo={processoLabel} orgao={orgao} />
          ) : active === "consid-gerais" ? (
            <ConsidGeraisContent processo={processoLabel} orgao={orgao} />
          ) : active === "receitas" ? (
            <ReceitasContent processo={processoLabel} orgao={orgao} />
          ) : active === "credito-inicial" ? (
            <CreditoInicialContent
              processo={processoLabel}
              orgao={orgao}
              tab={creditoTab}
              onTabChange={setCreditoTab}
            />
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
            {active !== "anteriores" &&
              active !== "demais" &&
              !(active === "consid-gerais" && CONSID_READ_ONLY) &&
              !(active === "receitas" && RECEITAS_READ_ONLY) &&
              !(active === "credito-inicial" && CREDITO_INICIAL_READ_ONLY) &&
              !(active === "credito-inicial" && creditoTab !== "principal") && (
                <>
                  <Button
                    type="button"
                    onClick={handleSalvar}
                    className="gap-2 bg-gray-500 text-white hover:bg-gray-600"
                  >
                    <Save className="h-4 w-4" /> Salvar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCorrecao}
                    className="gap-2 bg-yellow-500 text-[#0D1B2A] hover:bg-yellow-600"
                  >
                    <AlertTriangle className="h-4 w-4" /> Correção
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConcluir}
                    className="gap-2 bg-green-600 text-white hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Concluir
                  </Button>
                  {podeRevisar && currentStatus === "corrigido" && (
                    <Button
                      type="button"
                      onClick={handleMarcarRevisado}
                      className="gap-2 bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Eye className="h-4 w-4" /> Marcar como Revisado
                    </Button>
                  )}
                </>
              )}
            <Button
              type="button"
              onClick={handleGerarPDF}
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


const MAX = 10000;

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

// ============================================================
// Considerações Gerais
// ============================================================

const CONSID_TRANSITO_JULGADO = false;
const CONSID_SITUACAO_CONCLUIDA = false;
const CONSID_USUARIO_AUTORIZADO = true;
const CONSID_READ_ONLY =
  CONSID_TRANSITO_JULGADO ||
  CONSID_SITUACAO_CONCLUIDA ||
  !CONSID_USUARIO_AUTORIZADO;

const CONSID_EXERCICIO_ATUAL = "2025";
const CONSID_EXERCICIO_ANTERIOR = "2024";

const CONSID_TEXTO_BASE =
  "Texto base institucional do órgão, cadastrado na geração do primeiro processo. Apresenta a natureza jurídica, finalidade e principais atribuições do órgão, servindo como referência inicial para todas as análises das Prestações de Contas Estaduais subsequentes.";

const CONSID_TEXTO_ANTERIOR =
  `O IPSEMG — Instituto de Previdência dos Servidores de Minas Gerais é uma autarquia estadual criada pela Lei Estadual nº 4.862, de 1966, com personalidade jurídica própria e autonomia administrativa e financeira. Tem como missão institucional gerir o Regime Próprio de Previdência Social — RPPS dos servidores públicos do Estado de Minas Gerais, assegurando a concessão e manutenção de aposentadorias, pensões por morte, auxílios e demais benefícios previdenciários previstos na legislação vigente.

O Instituto é supervisionado pela Secretaria de Estado de Planejamento e Gestão — SEPLAG e está sujeito ao controle externo do Tribunal de Contas do Estado de Minas Gerais — TCE-MG, nos termos da Constituição Estadual e da legislação aplicável ao setor público. Sua estrutura organizacional é composta por uma Diretoria Executiva, Conselho de Administração, Conselho Fiscal e Comitê de Investimentos, cada qual com atribuições e responsabilidades definidas no Estatuto institucional.

No que se refere ao quadro de beneficiários, o IPSEMG atende aproximadamente 130.000 servidores ativos, 95.000 aposentados e 25.000 pensionistas, totalizando cerca de 250.000 pessoas vinculadas ao regime próprio de previdência estadual. Este contingente representa um dos maiores regimes próprios de previdência do país, exigindo gestão técnica especializada e rigoroso controle atuarial para garantir o equilíbrio financeiro e atuarial de longo prazo do fundo.

A base legal que rege o funcionamento do Instituto compreende, entre outros normativos, a Lei Complementar Estadual nº 64/2002, que dispõe sobre o Regime Próprio de Previdência Social dos servidores do Estado, a Lei Federal nº 9.717/1998, que estabelece regras gerais para a organização e funcionamento dos regimes próprios de previdência social, e as Resoluções do Conselho Nacional de Previdência Social — CNPS aplicáveis à gestão previdenciária pública.

Em relação à estrutura de financiamento, o IPSEMG é custeado por contribuições dos servidores ativos, no percentual estabelecido em lei, e por contribuições patronais do Estado de Minas Gerais, além dos rendimentos obtidos com a aplicação das reservas previdenciárias nos mercados financeiro e de capitais, observadas as diretrizes fixadas pelo Conselho Monetário Nacional para entidades de previdência pública.

A carteira de investimentos do fundo previdenciário é gerida com foco na segurança, liquidez e rentabilidade, priorizando títulos públicos federais, fundos de investimento de renda fixa e demais ativos permitidos pela regulamentação vigente. O Comitê de Investimentos do Instituto é responsável pela definição das políticas de alocação e pelo monitoramento contínuo dos ativos, com reporte periódico ao Conselho de Administração e aos órgãos de controle competentes.

No âmbito da gestão administrativa, o Instituto mantém sistemas informatizados integrados para o cadastro de beneficiários, controle de concessões, folha de pagamento de benefícios e controle orçamentário e financeiro, buscando permanente modernização tecnológica para aprimorar a qualidade dos serviços prestados aos segurados e dependentes vinculados ao regime próprio de previdência estadual.

O IPSEMG também desenvolve ações de educação previdenciária voltadas aos servidores públicos estaduais, promovendo o conhecimento sobre direitos e deveres previdenciários, planejamento para aposentadoria e orientação sobre os benefícios disponíveis, contribuindo para a valorização do servidor público e para a sustentabilidade do regime previdenciário no longo prazo.

Historicamente, o Instituto tem demonstrado comprometimento com as boas práticas de governança pública, transparência na divulgação de informações e tempestividade no atendimento às demandas dos órgãos de controle, fatores que contribuem para a credibilidade institucional e para a confiança dos segurados na solidez e continuidade do regime próprio de previdência social do Estado de Minas Gerais.`;

type ConsidHistorico = {
  ts: string;
  usuario: string;
  exercicio: string;
  acao: string;
};

const CONSID_HISTORICO_INICIAL: ConsidHistorico[] = [
  { ts: "12/03/2025 14:22", usuario: "Auditor 02", exercicio: "2024", acao: "Edição do texto" },
  { ts: "08/02/2024 09:10", usuario: "Auditor 01", exercicio: "2023", acao: "Salvamento inicial" },
];

function ConsidGeraisContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const [texto, setTexto] = useState(CONSID_TEXTO_ANTERIOR);
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historico] = useState<ConsidHistorico[]>(CONSID_HISTORICO_INICIAL);
  const restantes = MAX - texto.length;
  const readOnly = CONSID_READ_ONLY;

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

      {CONSID_TRANSITO_JULGADO && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">
              ⚠️ Este processo possui Trânsito e Julgado.
            </span>{" "}
            Nenhuma alteração é permitida.
          </p>
        </div>
      )}

      {!readOnly && (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
          <p>
            Texto pré-preenchido com base no exercício anterior (
            {CONSID_EXERCICIO_ANTERIOR}). Revise e salve para registrar as
            Considerações Gerais de {CONSID_EXERCICIO_ATUAL}.
          </p>
        </div>
      )}

      <h2 className="mb-4 text-center text-lg font-semibold text-foreground">
        <span className="border-b-2 border-[#0D1B2A] pb-1">
          Considerações Gerais:
        </span>
      </h2>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Texto base do órgão (somente leitura)
        </Label>
        <div className="rounded-md border border-border bg-[#F4F5F7] p-3 text-sm text-foreground">
          {CONSID_TEXTO_BASE}
        </div>
        <p className="text-xs italic text-muted-foreground">
          Este texto foi cadastrado na geração do processo e pode ser editado
          pelo auditor responsável ou administrador.
        </p>
      </div>

      <div className="my-6 border-t border-border" />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-semibold text-foreground">
            Considerações Gerais — Exercício atual (editável)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            title="Histórico de Alterações"
            aria-label="Histórico de Alterações"
            className="h-8 w-8"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
        <textarea
          value={texto}
          onChange={(e) => {
            if (readOnly) return;
            setTexto(e.target.value.slice(0, MAX));
          }}
          readOnly={readOnly}
          maxLength={MAX}
          rows={12}
          className={`block w-full resize-y overflow-y-auto rounded-md border border-border p-3 text-sm text-foreground shadow-inner outline-none focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB] ${
            readOnly ? "cursor-not-allowed bg-[#F4F5F7]" : "bg-white"
          }`}
          placeholder="Digite aqui as considerações gerais do exercício atual..."
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          {restantes.toLocaleString("pt-BR")} caracteres restantes
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2">
        <Checkbox
          id="consid-incluir"
          checked={incluir}
          disabled={readOnly}
          onCheckedChange={(v) => setIncluir(Boolean(v))}
          className="mt-0.5"
        />
        <label
          htmlFor="consid-incluir"
          className={`text-sm text-foreground ${
            readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          O texto complementar deverá constar no relatório de conclusão do
          processo.
        </label>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Registro de auditoria das edições das Considerações Gerais —{" "}
              {orgao}.
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
                    Exercício
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {historico.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Nenhuma alteração registrada.
                    </td>
                  </tr>
                ) : (
                  historico.map((h, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {h.ts}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {h.usuario}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {h.exercicio}
                      </td>
                      <td className="px-3 py-2 align-top">{h.acao}</td>
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

// ============================================================
// Receitas
// ============================================================

const RECEITAS_TRANSITO_JULGADO = false;
const RECEITAS_SITUACAO_CONCLUIDA = false;
const RECEITAS_USUARIO_AUTORIZADO = true;
const RECEITAS_READ_ONLY =
  RECEITAS_TRANSITO_JULGADO ||
  RECEITAS_SITUACAO_CONCLUIDA ||
  !RECEITAS_USUARIO_AUTORIZADO;

const RECEITAS_MAX_TEXTO = 4000;

const RECEITAS_RESUMO_IA =
  "A arrecadação efetiva do exercício atingiu 94,3% da previsão orçamentária, demonstrando desempenho satisfatório na realização das receitas. A principal fonte de recursos representou 68% do total arrecadado, com execução acima do previsto. Foi identificada insuficiência de recursos na ordem de R$ 12.500.000,00, concentrada no segundo semestre do exercício, demandando atenção no planejamento orçamentário do próximo exercício.";

type ReceitasHistorico = {
  ts: string;
  usuario: string;
  campo: string;
  anterior: string;
  novo: string;
};

const RECEITAS_HISTORICO_INICIAL: ReceitasHistorico[] = [
  {
    ts: "14/03/2025 10:42",
    usuario: "Auditor 01",
    campo: "Arrecadação Efetiva",
    anterior: "800.000.000,00",
    novo: "801.550.000,00",
  },
  {
    ts: "13/03/2025 16:18",
    usuario: "Auditor 02",
    campo: "Previsão de Arrecadação",
    anterior: "840.000.000,00",
    novo: "850.000.000,00",
  },
];

function fmtBRL(n: number): string {
  if (!isFinite(n)) return "0,00";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseBRL(s: string): number {
  const clean = s.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

function MoneyInput({
  value,
  onChange,
  readOnly,
  className,
  highlight,
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  className?: string;
  highlight?: "red" | "green" | null;
}) {
  const [local, setLocal] = useState<string>(fmtBRL(value));
  // keep local in sync if value changes externally
  // (intentional simple sync — only when prop differs from parsed local)
  if (!readOnly && parseBRL(local) !== value && document.activeElement?.tagName !== "INPUT") {
    // no-op: rely on user input
  }
  const colorCls =
    highlight === "red"
      ? "text-red-700 font-semibold"
      : highlight === "green"
        ? "text-green-700 font-semibold"
        : "";
  return (
    <Input
      value={local}
      readOnly={readOnly}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange?.(parseBRL(e.target.value));
      }}
      onBlur={() => setLocal(fmtBRL(parseBRL(local)))}
      className={`${readOnly ? "bg-[#F4F5F7]" : ""} ${colorCls} ${className ?? ""}`}
    />
  );
}

function ReceitasContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const readOnly = RECEITAS_READ_ONLY;

  const [previsao, setPrevisao] = useState<number>(850_000_000);
  const [efetiva, setEfetiva] = useState<number>(801_550_000);

  const [fonteXCodigo] = useState<string>("1.001.000");
  const [fonteXValor, setFonteXValor] = useState<number>(545_054_000);

  const [fonteYCodigo] = useState<string>("1.002.000");
  const [fonteYValor, setFonteYValor] = useState<number>(256_496_000);

  const [empenhadas, setEmpenhadas] = useState<number>(789_050_000);

  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historico] = useState<ReceitasHistorico[]>(RECEITAS_HISTORICO_INICIAL);

  const pctRealizacao = previsao > 0 ? (efetiva / previsao) * 100 : 0;
  const pctFonteX = efetiva > 0 ? (fonteXValor / efetiva) * 100 : 0;
  const pctFonteY = efetiva > 0 ? (fonteYValor / efetiva) * 100 : 0;

  const insuficiencia = empenhadas - efetiva;
  const insuficienciaDisplay = Math.max(0, insuficiencia);

  const realizacaoCor =
    pctRealizacao >= 90 ? "text-green-700" : "text-red-700";

  const restantes = RECEITAS_MAX_TEXTO - texto.length;

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

      {RECEITAS_TRANSITO_JULGADO && (
        <div className="mb-4 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">
              ⚠️ Este processo possui Trânsito e Julgado.
            </span>{" "}
            Nenhuma alteração é permitida.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          <span className="border-b-2 border-[#0D1B2A] pb-1">Receitas:</span>
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

      {/* Linha 1 — totais */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Previsão de Arrecadação</Label>
          <MoneyInput value={previsao} onChange={setPrevisao} readOnly={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Arrecadação Efetiva</Label>
          <MoneyInput value={efetiva} onChange={setEfetiva} readOnly={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">% de Realização</Label>
          <Input
            readOnly
            value={`${pctRealizacao.toFixed(1).replace(".", ",")}%`}
            className={`bg-[#F4F5F7] font-semibold ${realizacaoCor}`}
          />
        </div>
      </div>

      {/* Linha 2 — duas fontes */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Fonte {fonteXCodigo}:
            </Label>
            <MoneyInput
              value={fonteXValor}
              onChange={setFonteXValor}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              % Fonte {fonteXCodigo}:
            </Label>
            <Input
              readOnly
              value={`${pctFonteX.toFixed(0)}%`}
              className="bg-[#F4F5F7] font-semibold"
            />
          </div>
        </div>

        <div
          aria-hidden
          className="hidden w-px self-stretch bg-[#1A56DB] md:block"
        />

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              Fonte {fonteYCodigo}:
            </Label>
            <MoneyInput
              value={fonteYValor}
              onChange={setFonteYValor}
              readOnly={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">
              % Fonte {fonteYCodigo}:
            </Label>
            <Input
              readOnly
              value={`${pctFonteY.toFixed(0)}%`}
              className="bg-[#F4F5F7] font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Linha 3 — totais finais */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Insuficiência de recursos</Label>
          <Input
            readOnly
            value={fmtBRL(insuficienciaDisplay)}
            className={`bg-[#F4F5F7] font-semibold ${insuficiencia > 0 ? "text-red-700" : ""}`}
            title={
              insuficiencia > 0
                ? "Atenção: despesas superam a arrecadação efetiva."
                : "Não há insuficiência de recursos. A arrecadação superou as despesas empenhadas."
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Despesas empenhadas</Label>
          <MoneyInput
            value={empenhadas}
            onChange={setEmpenhadas}
            readOnly={readOnly}
          />
        </div>
      </div>

      <p className="mt-3 text-xs italic text-muted-foreground">
        As fontes exibidas representam as duas maiores arrecadações do órgão.
        Podem existir outras fontes não exibidas nesta tela.
      </p>

      {/* Resumo IA */}
      <div className="mt-6">
        <ResumoIA texto={RECEITAS_RESUMO_IA} processo={processo} orgao={orgao} />
      </div>

      {/* Editor */}
      <div className="mt-6 space-y-2">
        <Label className="text-sm font-semibold">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          readOnly={readOnly}
          maxLength={RECEITAS_MAX_TEXTO}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-[180px] w-full rounded-md border border-border bg-white p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30"
        />
        <p className="text-right text-xs text-muted-foreground">
          {restantes.toLocaleString("pt-BR")} caracteres restantes
        </p>
        <label className="flex items-start gap-2 text-sm text-foreground">
          <Checkbox
            checked={incluir}
            onCheckedChange={(v) => setIncluir(Boolean(v))}
            disabled={readOnly}
          />
          <span>
            O texto complementar deverá constar no relatório de conclusão do
            processo.
          </span>
        </label>
      </div>

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as edições realizadas nos campos de receitas são
              registradas para auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Data/Hora</th>
                  <th className="px-3 py-2 text-left">Usuário</th>
                  <th className="px-3 py-2 text-left">Campo alterado</th>
                  <th className="px-3 py-2 text-left">Valor anterior</th>
                  <th className="px-3 py-2 text-left">Valor novo</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2">{h.ts}</td>
                    <td className="px-3 py-2">{h.usuario}</td>
                    <td className="px-3 py-2">{h.campo}</td>
                    <td className="px-3 py-2">{h.anterior}</td>
                    <td className="px-3 py-2">{h.novo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setHistoryOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
