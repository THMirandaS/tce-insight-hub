import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { toast } from "sonner";
import {
  getJurisdicionado,
  GRUPO_ABREVIADO,
  type Jurisdicionado,
} from "@/lib/pce-data";

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

type SubItem = {
  key: string;
  label: string;
  hasActions?: boolean;
  // Regra de exibição condicional (RF03). Ausente => sempre visível.
  condicional?: (j: Jurisdicionado) => boolean;
  // Tópico previsto para evolução futura: aparece no menu, mas ainda não
  // renderiza conteúdo próprio.
  futuro?: boolean;
};
type SubGroup = { key: string; label: string; items: SubItem[] };

const GRUPO_PODERES =
  "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA";

// Lista completa de tópicos PCE com suas regras de exibição (RF03).
const PCE_ITEMS_BASE: SubItem[] = [
  { key: "responsavel", label: "Responsável", hasActions: true },
  { key: "consid-gerais", label: "Consid. Gerais", hasActions: true },
  // Receitas: apenas para entidades previdenciárias.
  {
    key: "receitas",
    label: "Receitas",
    hasActions: true,
    condicional: (j) => j.entidadePrevidenciaria,
  },
  { key: "credito-inicial", label: "Crédito inicial autorizado" },
  { key: "programas", label: "Programas", hasActions: true },
  { key: "credito-despesas-prg", label: "Crédito e Despesas por prg" },
  { key: "dsp-dotacao", label: "Dsp por dot. Orçamentária" },
  // Despesas com pessoal: apenas para Órgãos de Poder. Tópico futuro.
  {
    key: "despesas-pessoal",
    label: "Despesas com pessoal",
    futuro: true,
    condicional: (j) => j.grupoEntidade === GRUPO_PODERES,
  },
  { key: "restos-pagar", label: "Restos a pagar", hasActions: true },
  { key: "controle-interno", label: "Controle Interno" },
  { key: "outras-inconformidades", label: "Outras Incoformidades" },
  { key: "conclusao", label: "Conclusão" },
];

// Aplica as regras condicionais do RF03 para um jurisdicionado.
function getPceItems(j: Jurisdicionado): SubItem[] {
  return PCE_ITEMS_BASE.filter((it) => !it.condicional || it.condicional(j));
}

const STATIC_GROUPS: SubGroup[] = [
  { key: "anteriores", label: "PCE's Anteriores", items: [] },
  { key: "demais", label: "Demais Processos", items: [] },
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

  // Jurisdicionado do processo e tópicos visíveis (RF02/RF03).
  const row = useMemo(() => ALL_ROWS.find((r) => r.numero === id), [id]);
  const orgao = row?.orgao ?? "—";
  const jurisdicionado = useMemo(() => getJurisdicionado(orgao), [orgao]);
  const pceItems = useMemo(() => getPceItems(jurisdicionado), [jurisdicionado]);
  const groups = useMemo<SubGroup[]>(
    () => [...STATIC_GROUPS, { key: "pce", label: "PCE", items: pceItems }],
    [pceItems]
  );

  const [active, setActive] = useState<string>("anteriores");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    anteriores: false,
    demais: false,
    pce: true,
  });
  const contentRef = useRef<HTMLElement | null>(null);

  // Perfil atual (poderia vir de auth). Coordenador vê todas as ações.
  const [perfil] = useState<Perfil>("Coordenador");

  // Status por submenu PCE, inicializado a partir dos itens visíveis.
  const [statuses, setStatuses] = useState<Record<string, SubmenuStatus>>(
    () => Object.fromEntries(pceItems.map((i) => [i.key, "nao-iniciado" as SubmenuStatus]))
  );

  // Mantém o mapa de status sincronizado quando os tópicos visíveis mudam.
  useEffect(() => {
    setStatuses((prev) => {
      const next: Record<string, SubmenuStatus> = {};
      for (const i of pceItems) next[i.key] = prev[i.key] ?? "nao-iniciado";
      return next;
    });
  }, [pceItems]);

  const [legendOpen, setLegendOpen] = useState(false);
  const [creditoTab, setCreditoTab] = useState<"principal" | "memoria">("principal");
  const [despesaTab, setDespesaTab] = useState<"principal" | "memoria">("principal");
  const [dotacaoTab, setDotacaoTab] = useState<"principal" | "memoria">("principal");
  const [outrasView, setOutrasView] = useState<"form" | "lista">("lista");

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

  const processoLabel = id;
  const relator = "CONS. JOÃO DA SILVA";
  const auditor = "Auditor 01";

  const activeLabel =
    groups.find((g) => g.key === active)?.label ??
    pceItems.find((i) => i.key === active)?.label ??
    "";

  function handleGerarPDF() {
    if (active === "conclusao" && CONCLUSAO_PDF_REF.fn) {
      CONCLUSAO_PDF_REF.fn(processoLabel, orgao);
      return;
    }
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
            {groups.map((g) => {
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
            <div className="flex items-center gap-2">
              <InfoCell
                label="Órgão"
                value={
                  jurisdicionado.sigla
                    ? `${orgao} (${jurisdicionado.sigla})`
                    : orgao
                }
              />
              <span className="inline-flex items-center rounded-full bg-[#1A56DB]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1A56DB] ring-1 ring-[#1A56DB]/20">
                {GRUPO_ABREVIADO[jurisdicionado.grupoEntidade]}
              </span>
              {jurisdicionado.entidadePrevidenciaria && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-200">
                  Previdenciária
                </span>
              )}
            </div>
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
          ) : active === "programas" ? (
            <ProgramasContent processo={processoLabel} orgao={orgao} />
          ) : active === "credito-despesas-prg" ? (
            <CreditoDespesasContent
              processo={processoLabel}
              orgao={orgao}
              tab={despesaTab}
              onTabChange={setDespesaTab}
            />
          ) : active === "dsp-dotacao" ? (
            <DspDotacaoContent
              processo={processoLabel}
              orgao={orgao}
              tab={dotacaoTab}
              onTabChange={setDotacaoTab}
            />
          ) : active === "restos-pagar" ? (
            <RestosPagarContent processo={processoLabel} orgao={orgao} />
          ) : active === "controle-interno" ? (
            <ControleInternoContent processo={processoLabel} orgao={orgao} />
          ) : active === "outras-inconformidades" ? (
            <OutrasInconformidadesContent
              processo={processoLabel}
              orgao={orgao}
              view={outrasView}
              onViewChange={setOutrasView}
            />
          ) : active === "conclusao" ? (
            <ConclusaoContent processo={processoLabel} orgao={orgao} />
          ) : active === "anteriores" ? (
            <AnterioresContent processo={processoLabel} orgao={orgao} />
          ) : active === "demais" ? (
            <DemaisContent orgao={orgao} />
          ) : active === "despesas-pessoal" ? (
            <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Despesas com pessoal
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tópico aplicável aos Órgãos de Poder. Conteúdo em
                desenvolvimento — será disponibilizado em versão futura.
              </p>
            </div>
          ) : (
            <PlaceholderContent
              label={
                groups.find((g) => g.key === active)?.label ??
                pceItems.find((i) => i.key === active)?.label ??
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
              active !== "despesas-pessoal" &&
              !(active === "consid-gerais" && CONSID_READ_ONLY) &&
              !(active === "receitas" && RECEITAS_READ_ONLY) &&
              !(active === "credito-inicial" && CREDITO_INICIAL_READ_ONLY) &&
              !(active === "credito-inicial" && creditoTab !== "principal") &&
              !(active === "programas" && PROGRAMAS_READ_ONLY) &&
              !(active === "credito-despesas-prg" && CREDITO_DESPESAS_READ_ONLY) &&
              !(active === "credito-despesas-prg" && despesaTab !== "principal") &&
              !(active === "dsp-dotacao" && DSP_DOTACAO_READ_ONLY) &&
              !(active === "dsp-dotacao" && dotacaoTab !== "principal") &&
              !(active === "restos-pagar" && RESTOS_PAGAR_READ_ONLY) &&
              !(active === "controle-interno" && CI_READ_ONLY) &&
              !(active === "outras-inconformidades" && OUTRAS_INCO_READ_ONLY) &&
              !(active === "outras-inconformidades" && outrasView !== "lista") &&
              !(active === "conclusao" && CONCLUSAO_READ_ONLY) && (



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

// ============================================================
// Crédito inicial autorizado
// ============================================================

const CREDITO_INICIAL_TRANSITO_JULGADO = false;
const CREDITO_INICIAL_SITUACAO_CONCLUIDA = false;
const CREDITO_INICIAL_USUARIO_AUTORIZADO = true;
const CREDITO_INICIAL_READ_ONLY =
  CREDITO_INICIAL_TRANSITO_JULGADO ||
  CREDITO_INICIAL_SITUACAO_CONCLUIDA ||
  !CREDITO_INICIAL_USUARIO_AUTORIZADO;

const CREDITO_INICIAL_MAX_TEXTO = 4000;

const CREDITO_INICIAL_RESUMO_IA =
  "O crédito autorizado apresentou variação de 3,2% em relação ao crédito inicial, reflexo de suplementações orçamentárias realizadas no exercício. As despesas de capital representaram 62% do total autorizado, com destaque para os investimentos em infraestrutura. Foram identificadas inconsistências em duas modalidades de aplicação que merecem atenção na análise.";

const CATEGORIAS_ECONOMICAS = [
  "Despesas Correntes",
  "Despesas de Capital",
] as const;

const GRUPOS_DESPESA = [
  "Pessoal e Encargos Sociais",
  "Outras Despesas Correntes",
  "Inversões Financeiras",
  "Investimentos",
  "Amortização da Dívida",
] as const;

const MODALIDADES_APLICACAO = [
  "Aplicação Direta",
  "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida",
  "Transferências a União",
  "Transferências a Estados e DF",
  "Transferências a Municípios",
] as const;

type CreditoLinha = {
  id: string;
  programa: string;
  categoria: string;
  grupo: string;
  modalidade: string;
  inicial: number;
  autorizado: number;
};

const CREDITO_INICIAL_LINHAS: CreditoLinha[] = [
  {
    id: "c1",
    programa: "47",
    categoria: "Despesas Correntes",
    grupo: "Outras Despesas Correntes",
    modalidade: "Transferências a União",
    inicial: 999_999_999.99,
    autorizado: 888_888_888.88,
  },
  {
    id: "c2",
    programa: "55",
    categoria: "Despesas Correntes",
    grupo: "Pessoal e Encargos Sociais",
    modalidade:
      "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida",
    inicial: 999_999_999.99,
    autorizado: 999_999_999.99,
  },
  {
    id: "c3",
    programa: "68",
    categoria: "Despesas de Capital",
    grupo: "Inversões Financeiras",
    modalidade:
      "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida",
    inicial: 0,
    autorizado: 999_999_999.99,
  },
  {
    id: "c4",
    programa: "88",
    categoria: "Despesas de Capital",
    grupo: "Investimentos",
    modalidade: "Aplicação Direta",
    inicial: 888_888_888.88,
    autorizado: 999_999_999.99,
  },
  {
    id: "c5",
    programa: "88",
    categoria: "Despesas de Capital",
    grupo: "Investimentos",
    modalidade: "Aplicação Direta",
    inicial: 777_777_777.77,
    autorizado: 699_999_999.99,
  },
];

const CREDITO_INICIAL_HISTORICO: ReceitasHistorico[] = [
  {
    ts: "15/03/2025 09:30",
    usuario: "Auditor 01",
    campo: "Linha 4 - Crédito autorizado",
    anterior: "950.000.000,00",
    novo: "999.999.999,99",
  },
  {
    ts: "14/03/2025 17:12",
    usuario: "Auditor 02",
    campo: "Linha 1 - Programa",
    anterior: "45",
    novo: "47",
  },
];

function CreditoInicialContent({
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
  const readOnly = CREDITO_INICIAL_READ_ONLY;

  const [linhas, setLinhas] = useState<CreditoLinha[]>(CREDITO_INICIAL_LINHAS);
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalInicial = linhas.reduce((s, l) => s + (l.inicial || 0), 0);
  const totalAutorizado = linhas.reduce((s, l) => s + (l.autorizado || 0), 0);

  const restantes = CREDITO_INICIAL_MAX_TEXTO - texto.length;

  function updateLinha(id: string, patch: Partial<CreditoLinha>) {
    setLinhas((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLinha() {
    setLinhas((arr) => [
      ...arr,
      {
        id: `c${Date.now()}`,
        programa: "",
        categoria: CATEGORIAS_ECONOMICAS[0],
        grupo: GRUPOS_DESPESA[0],
        modalidade: MODALIDADES_APLICACAO[0],
        inicial: 0,
        autorizado: 0,
      },
    ]);
  }
  function removeLinha(id: string) {
    setLinhas((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

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

      {CREDITO_INICIAL_TRANSITO_JULGADO && (
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

      {/* Abas */}
      <div className="mb-6 flex gap-6 border-b border-border" data-pdf-hide>
        {([
          { k: "principal", label: "Crédito inicial e autorizado" },
          { k: "memoria", label: "Memória de cálculo" },
        ] as const).map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              type="button"
              onClick={() => onTabChange(t.k)}
              className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                active
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito inicial
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalInicial)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito autorizado
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalAutorizado)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
          </div>

          <div className="mt-6">
            <ResumoIA
              texto={CREDITO_INICIAL_RESUMO_IA}
              processo={processo}
              orgao={orgao}
            />
          </div>

          <div className="mt-6 space-y-2">
            <Label className="text-sm font-semibold">
              AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
            </Label>
            <textarea
              value={texto}
              readOnly={readOnly}
              maxLength={CREDITO_INICIAL_MAX_TEXTO}
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
                O texto complementar deverá constar no relatório de conclusão
                do processo.
              </span>
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito inicial
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalInicial)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito autorizado
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalAutorizado)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Memória de cálculo
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
                title="Histórico de alterações"
              >
                <History className="h-4 w-4" /> Histórico
              </button>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={addLinha}
                  className="gap-1 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                >
                  <Plus className="h-4 w-4" /> Adicionar linha
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-left">Categoria Econômica</th>
                  <th className="px-3 py-2 text-left">Grupo</th>
                  <th className="px-3 py-2 text-left">Modalidade</th>
                  <th className="px-3 py-2 text-right">Crédito inicial</th>
                  <th className="px-3 py-2 text-right">Crédito autorizado</th>
                  {!readOnly && (
                    <th className="px-3 py-2 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l, i) => (
                  <tr
                    key={l.id}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-2 py-1.5">
                      <Input
                        value={l.programa}
                        readOnly={readOnly}
                        onChange={(e) =>
                          updateLinha(l.id, { programa: e.target.value })
                        }
                        className="h-8"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={l.categoria}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateLinha(l.id, { categoria: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                      >
                        {CATEGORIAS_ECONOMICAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={l.grupo}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateLinha(l.id, { grupo: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                      >
                        {GRUPOS_DESPESA.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={l.modalidade}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateLinha(l.id, { modalidade: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                      >
                        {MODALIDADES_APLICACAO.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <MoneyInput
                        value={l.inicial}
                        readOnly={readOnly}
                        onChange={(n) => updateLinha(l.id, { inicial: n })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <MoneyInput
                        value={l.autorizado}
                        readOnly={readOnly}
                        onChange={(n) => updateLinha(l.id, { autorizado: n })}
                      />
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="text-[#1A56DB] hover:opacity-80"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(l.id)}
                            className="text-red-600 hover:opacity-80"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalInicial)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalAutorizado)}
                  </td>
                  {!readOnly && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações (incluir, editar, excluir) na memória de cálculo
              são registradas para auditoria.
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
                {CREDITO_INICIAL_HISTORICO.map((h, i) => (
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir linha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta linha da memória de cálculo?
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeLinha(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// PROGRAMAS
// ============================================================

const PROGRAMAS_TRANSITO_JULGADO = false;
const PROGRAMAS_SITUACAO_CONCLUIDA = false;
const PROGRAMAS_USUARIO_AUTORIZADO = true;
const PROGRAMAS_READ_ONLY =
  PROGRAMAS_TRANSITO_JULGADO ||
  PROGRAMAS_SITUACAO_CONCLUIDA ||
  !PROGRAMAS_USUARIO_AUTORIZADO;

const PROGRAMAS_MAX_TEXTO = 4000;

const TIPOS_PROGRAMA = [
  "Finalístico",
  "Apoio a políticas públicas e áreas específicas",
] as const;

const HORIZONTES_TEMPORAIS = ["Contínuo", "Temporário"] as const;

type ProgramaLinha = {
  id: string;
  programa: string;
  tipo: string;
  horizonte: string;
  justificativa: string;
  objetivo: string;
};

const PROGRAMAS_INICIAIS: ProgramaLinha[] = [
  {
    id: "p1",
    programa: "47",
    tipo: "Finalístico",
    horizonte: "Contínuo",
    justificativa:
      "Otimizar a capacidade de atuação e resposta do estado diante dos impactos provocados pelas chuvas, permitindo que o estado assegure o restabelecimento à normalidade social e econômica da população atingida.",
    objetivo:
      "Realizar ações de preparação, resposta e recuperação destinadas a mitigar os efeitos causados pelos desastres decorrentes das chuvas.",
  },
  {
    id: "p2",
    programa: "55",
    tipo: "Apoio a políticas públicas e áreas específicas",
    horizonte: "Contínuo",
    justificativa:
      "Os sistemas penitenciário e socioeducativo do estado de Minas Gerais têm demandado cada vez mais recursos para custear a manutenção, reforma e modernização dos estabelecimentos penais.",
    objetivo:
      "Colaborar com a preservação, reparos preventivos e corretivos, instalações, adaptações, recuperações, conservação e modernização das estruturas físicas das unidades prisionais.",
  },
  {
    id: "p3",
    programa: "68",
    tipo: "Finalístico",
    horizonte: "Contínuo",
    justificativa:
      "Sendo o poder público responsável pelo equipamento de infraestrutura, é necessário o direcionamento dos investimentos em nível estadual, regional e municipal para construção, reforma e ampliação.",
    objetivo:
      "Direcionar investimentos para infraestrutura viária e para construção, reforma e ampliação de equipamentos públicos.",
  },
  {
    id: "p4",
    programa: "88",
    tipo: "Finalístico",
    horizonte: "Contínuo",
    justificativa:
      "Enfrentamento dos desafios logísticos e de infraestrutura relativos à circulação de bens, pessoas e mercadorias no âmbito das rodovias sob gestão do DERREG.",
    objetivo:
      "Manter uma infraestrutura rodoviária de qualidade, favorável à sustentabilidade e ao desenvolvimento econômico e o bem-estar dos usuários.",
  },
];

const PROGRAMAS_HISTORICO = [
  {
    ts: "20/05/2026 14:32",
    usuario: "Analista 03",
    campo: "Programa 47 - Justificativa",
    anterior: "(vazio)",
    novo: "Otimizar a capacidade de atuação...",
  },
  {
    ts: "19/05/2026 09:18",
    usuario: "Analista 03",
    campo: "Programa 88",
    anterior: "(novo)",
    novo: "Inclusão",
  },
  {
    ts: "18/05/2026 16:05",
    usuario: "Analista 02",
    campo: "Programa 55 - Tipo",
    anterior: "Finalístico",
    novo: "Apoio a políticas públicas e áreas específicas",
  },
];

function ProgramasContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const readOnly = PROGRAMAS_READ_ONLY;

  const [linhas, setLinhas] = useState<ProgramaLinha[]>(PROGRAMAS_INICIAIS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);

  const restantes = PROGRAMAS_MAX_TEXTO - texto.length;
  const quantidade = linhas.length;

  const hasTemporario = linhas.some((l) => l.horizonte === "Temporário");
  const hasMuitos = linhas.length > 5;
  const hasIncompleto = linhas.some(
    (l) => !l.justificativa.trim() || !l.objetivo.trim()
  );
  const showResumoIA = hasTemporario || hasMuitos || hasIncompleto;

  const resumoIATexto = [
    hasTemporario &&
      "Foram identificados programas com Horizonte Temporal 'Temporário', o que demanda verificação quanto à vigência e ao cronograma de execução.",
    hasMuitos &&
      `O órgão apresenta ${quantidade} programas, número acima do usual, sugerindo revisão da consolidação programática.`,
    hasIncompleto &&
      "Há programas com campos de Justificativa ou Objetivo não preenchidos, comprometendo a transparência da política pública.",
  ]
    .filter(Boolean)
    .join(" ");

  function updateLinha(id: string, patch: Partial<ProgramaLinha>) {
    setLinhas((arr) =>
      arr.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }
  function addLinha() {
    const id = `p${Date.now()}`;
    setLinhas((arr) => [
      ...arr,
      {
        id,
        programa: "",
        tipo: TIPOS_PROGRAMA[0],
        horizonte: HORIZONTES_TEMPORAIS[0],
        justificativa: "",
        objetivo: "",
      },
    ]);
    setEditingId(id);
  }
  function removeLinha(id: string) {
    setLinhas((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
    if (editingId === id) setEditingId(null);
  }
  function toggleExpand(key: string) {
    setExpanded((e) => ({ ...e, [key]: !e[key] }));
  }

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

      {PROGRAMAS_TRANSITO_JULGADO && (
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          <span className="border-b-2 border-[#0D1B2A] pb-1">Programas:</span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
            title="Histórico de alterações"
          >
            <History className="h-4 w-4" /> Histórico
          </button>
          {!readOnly && (
            <Button
              type="button"
              onClick={addLinha}
              className="gap-1 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
            >
              <Plus className="h-4 w-4" /> Adicionar Programa
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">
        Quantidade de programas: {quantidade}
      </p>

      <div className="mt-3 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-3 py-2 text-left w-24">Programa</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left w-36">Horizonte Temporal</th>
              <th className="px-3 py-2 text-left">Justificativa</th>
              <th className="px-3 py-2 text-left">Objetivo</th>
              {!readOnly && (
                <th className="px-3 py-2 text-center w-24">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const editing = editingId === l.id && !readOnly;
              const jKey = `${l.id}-j`;
              const oKey = `${l.id}-o`;
              const jExp = expanded[jKey];
              const oExp = expanded[oKey];
              return (
                <tr
                  key={l.id}
                  className={i % 2 === 0 ? "bg-white align-top" : "bg-gray-50 align-top"}
                >
                  <td className="px-2 py-1.5">
                    {editing ? (
                      <Input
                        value={l.programa}
                        onChange={(e) =>
                          updateLinha(l.id, { programa: e.target.value })
                        }
                        className="h-8"
                      />
                    ) : (
                      <span className="px-1 py-2 block font-medium">
                        {l.programa || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {editing ? (
                      <select
                        value={l.tipo}
                        onChange={(e) =>
                          updateLinha(l.id, { tipo: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm"
                      >
                        {TIPOS_PROGRAMA.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-1 py-2 block">{l.tipo}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {editing ? (
                      <select
                        value={l.horizonte}
                        onChange={(e) =>
                          updateLinha(l.id, { horizonte: e.target.value })
                        }
                        className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm"
                      >
                        {HORIZONTES_TEMPORAIS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-1 py-2 block">{l.horizonte}</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 max-w-[280px]">
                    {editing ? (
                      <textarea
                        value={l.justificativa}
                        onChange={(e) =>
                          updateLinha(l.id, { justificativa: e.target.value })
                        }
                        rows={4}
                        className="w-full rounded-md border border-border bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleExpand(jKey)}
                        className="block w-full text-left hover:bg-blue-50 rounded p-1 transition-colors"
                        title="Clique para expandir/recolher"
                      >
                        <span className={jExp ? "" : "line-clamp-3"}>
                          {l.justificativa || (
                            <em className="text-muted-foreground">Não preenchido</em>
                          )}
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="px-2 py-1.5 max-w-[280px]">
                    {editing ? (
                      <textarea
                        value={l.objetivo}
                        onChange={(e) =>
                          updateLinha(l.id, { objetivo: e.target.value })
                        }
                        rows={4}
                        className="w-full rounded-md border border-border bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleExpand(oKey)}
                        className="block w-full text-left hover:bg-blue-50 rounded p-1 transition-colors"
                        title="Clique para expandir/recolher"
                      >
                        <span className={oExp ? "" : "line-clamp-3"}>
                          {l.objetivo || (
                            <em className="text-muted-foreground">Não preenchido</em>
                          )}
                        </span>
                      </button>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-center gap-2">
                        {editing ? (
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-green-600 hover:opacity-80"
                            title="Concluir edição"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingId(l.id)}
                            className="text-[#1A56DB] hover:opacity-80"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(l.id)}
                          className="text-red-600 hover:opacity-80"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {linhas.length === 0 && (
              <tr>
                <td
                  colSpan={readOnly ? 5 : 6}
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                >
                  Nenhum programa cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showResumoIA && (
        <div className="mt-6">
          <ResumoIA
            texto={resumoIATexto}
            processo={processo}
            orgao={orgao}
          />
        </div>
      )}

      <div className="mt-6 space-y-2">
        <Label className="text-sm font-semibold">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          readOnly={readOnly}
          maxLength={PROGRAMAS_MAX_TEXTO}
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
              Todas as ações (incluir, editar, excluir) nos programas são
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
                {PROGRAMAS_HISTORICO.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir programa</DialogTitle>
            <DialogDescription>
              Deseja excluir este programa? Esta ação será registrada no log de
              auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeLinha(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// CRÉDITO E DESPESAS POR PROGRAMA
// ============================================================

const CREDITO_DESPESAS_TRANSITO_JULGADO = false;
const CREDITO_DESPESAS_SITUACAO_CONCLUIDA = false;
const CREDITO_DESPESAS_USUARIO_AUTORIZADO = true;
const CREDITO_DESPESAS_READ_ONLY =
  CREDITO_DESPESAS_TRANSITO_JULGADO ||
  CREDITO_DESPESAS_SITUACAO_CONCLUIDA ||
  !CREDITO_DESPESAS_USUARIO_AUTORIZADO;

const CREDITO_DESPESAS_MAX_TEXTO = 4000;

const CREDITO_DESPESAS_RESUMO_IA =
  "A execução orçamentária apresentou índice médio de empenho de 94% em relação ao crédito autorizado. O programa 88 apresentou execução acima do autorizado (110%), configurando situação de atenção que requer encaminhamento específico. Os demais programas mantiveram execução dentro dos limites autorizados.";

type DespesaConclusao = "regular" | "ressalvas" | "irregular" | "";
type DespesaEncaminhamento = "nenhum" | "recomendacao" | "determinacao" | "";

type DespesaMemoriaLinha = {
  id: string;
  programa: string;
  categoria: string;
  grupo: string;
  modalidade: string;
  inicial: number;
  autorizado: number;
  despesa: number; // valor para cálculo do apontamento (não exibido como coluna)
};

const CREDITO_DESPESAS_MEMORIA: DespesaMemoriaLinha[] = [
  {
    id: "d1",
    programa: "47",
    categoria: "Despesas Correntes",
    grupo: "Outras Despesas Correntes",
    modalidade: "Transferências a União",
    inicial: 999_999_999.99,
    autorizado: 888_888_888.88,
    despesa: 800_000_000,
  },
  {
    id: "d2",
    programa: "55",
    categoria: "Despesas Correntes",
    grupo: "Pessoal e Encargos Sociais",
    modalidade:
      "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida",
    inicial: 999_999_999.99,
    autorizado: 999_999_999.99,
    despesa: 950_000_000,
  },
  {
    id: "d3",
    programa: "68",
    categoria: "Despesas de Capital",
    grupo: "Inversões Financeiras",
    modalidade:
      "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida",
    inicial: 0,
    autorizado: 999_999_999.99,
    despesa: 1_100_000_000,
  },
  {
    id: "d4",
    programa: "88",
    categoria: "Despesas de Capital",
    grupo: "Investimentos",
    modalidade: "Aplicação Direta",
    inicial: 888_888_888.88,
    autorizado: 999_999_999.99,
    despesa: 1_050_000_000,
  },
  {
    id: "d5",
    programa: "88",
    categoria: "Despesas de Capital",
    grupo: "Investimentos",
    modalidade: "Aplicação Direta",
    inicial: 777_777_777.77,
    autorizado: 699_999_999.99,
    despesa: 600_000_000,
  },
];

type DespesaConsolidada = {
  id: string;
  programa: string;
  autorizado: number;
  empenhada: number;
  percent: number; // display fixo
};

const CREDITO_DESPESAS_CONSOLIDADO: DespesaConsolidada[] = [
  { id: "x1", programa: "47", autorizado: 999_999_999.99, empenhada: 888_888_888.88, percent: 90 },
  { id: "x2", programa: "55", autorizado: 999_999_999.99, empenhada: 999_999_999.99, percent: 100 },
  { id: "x3", programa: "68", autorizado: 999_999_999.99, empenhada: 999_999_999.99, percent: 100 },
  { id: "x4", programa: "88", autorizado: 888_888_888.88, empenhada: 999_999_999.99, percent: 110 },
  { id: "x5", programa: "88", autorizado: 777_777_777.77, empenhada: 699_999_999.99, percent: 48 },
];

const CREDITO_DESPESAS_TOTAL = {
  autorizado: 999_999_999.99,
  empenhada: 888_888_888.88,
  percent: 94,
};

const CREDITO_DESPESAS_HISTORICO: ReceitasHistorico[] = [
  {
    ts: "16/03/2025 10:14",
    usuario: "Auditor 01",
    campo: "Linha 4 - Crédito autorizado",
    anterior: "950.000.000,00",
    novo: "999.999.999,99",
  },
  {
    ts: "15/03/2025 16:02",
    usuario: "Auditor 02",
    campo: "Conclusão",
    anterior: "Regular",
    novo: "Regular com ressalvas",
  },
];

function CreditoDespesasContent({
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
  const readOnly = CREDITO_DESPESAS_READ_ONLY;

  const [memoria, setMemoria] = useState<DespesaMemoriaLinha[]>(
    CREDITO_DESPESAS_MEMORIA
  );
  const [conclusao, setConclusao] = useState<DespesaConclusao>("ressalvas");
  const [encaminhamentoTipo, setDespesaEncaminhamento] =
    useState<DespesaEncaminhamento>("recomendacao");
  const [encTexto, setEncTexto] = useState("");
  const [consideracoes, setConsideracoes] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalInicial = memoria.reduce((s, l) => s + (l.inicial || 0), 0);
  const totalDespesa = memoria.reduce((s, l) => s + (l.despesa || 0), 0);

  const encRestantes = CREDITO_DESPESAS_MAX_TEXTO - encTexto.length;
  const consRestantes = CREDITO_DESPESAS_MAX_TEXTO - consideracoes.length;

  const encDisabled =
    readOnly || encaminhamentoTipo === "nenhum" || encaminhamentoTipo === "";

  function isEncOptionEnabled(opt: DespesaEncaminhamento) {
    if (opt === "nenhum") return conclusao === "regular";
    if (opt === "recomendacao") return conclusao === "ressalvas";
    if (opt === "determinacao") return conclusao === "irregular";
    return false;
  }

  function onConclusaoChange(v: DespesaConclusao) {
    setConclusao(v);
    // ajustar encaminhamento automaticamente para o habilitado
    if (v === "regular") setDespesaEncaminhamento("nenhum");
    else if (v === "ressalvas") setDespesaEncaminhamento("recomendacao");
    else if (v === "irregular") setDespesaEncaminhamento("determinacao");
  }

  function updateMemoria(id: string, patch: Partial<DespesaMemoriaLinha>) {
    setMemoria((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addMemoria() {
    setMemoria((arr) => [
      ...arr,
      {
        id: `d${Date.now()}`,
        programa: "",
        categoria: CATEGORIAS_ECONOMICAS[0],
        grupo: GRUPOS_DESPESA[0],
        modalidade: MODALIDADES_APLICACAO[0],
        inicial: 0,
        autorizado: 0,
        despesa: 0,
      },
    ]);
  }
  function removeMemoria(id: string) {
    setMemoria((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

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

      {CREDITO_DESPESAS_TRANSITO_JULGADO && (
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

      {/* Abas */}
      <div className="mb-6 flex gap-6 border-b border-border" data-pdf-hide>
        {([
          { k: "principal", label: "Crédito e despesa por programa" },
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito inicial
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalInicial)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito autorizado
              </Label>
              <Input
                readOnly
                value={fmtBRL(CREDITO_DESPESAS_TOTAL.autorizado)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Consolidado por programa
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
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-right">Crédito Autorizado</th>
                  <th className="px-3 py-2 text-right">Despesa Empenhada</th>
                  <th className="px-3 py-2 text-right">% Empenho</th>
                </tr>
              </thead>
              <tbody>
                {CREDITO_DESPESAS_CONSOLIDADO.map((r, i) => {
                  const overflow = r.percent > 100;
                  return (
                    <tr
                      key={r.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-3 py-2">{r.programa}</td>
                      <td className="px-3 py-2 text-right">
                        {fmtBRL(r.autorizado)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {fmtBRL(r.empenhada)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          overflow ? "text-red-700" : "text-green-700"
                        }`}
                      >
                        {r.percent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(CREDITO_DESPESAS_TOTAL.autorizado)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(CREDITO_DESPESAS_TOTAL.empenhada)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${
                      CREDITO_DESPESAS_TOTAL.percent > 100
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {CREDITO_DESPESAS_TOTAL.percent}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6">
            <ResumoIA
              texto={CREDITO_DESPESAS_RESUMO_IA}
              processo={processo}
              orgao={orgao}
            />
          </div>

          {/* Conclusão do item */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm font-semibold">Conclusão do item:</Label>
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { v: "regular", label: "Regular" },
                  { v: "ressalvas", label: "Regular com ressalvas" },
                  { v: "irregular", label: "Irregular" },
                ] as const
              ).map((o) => (
                <label
                  key={o.v}
                  className="inline-flex items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="conclusao"
                    value={o.v}
                    checked={conclusao === o.v}
                    disabled={readOnly}
                    onChange={() => onConclusaoChange(o.v)}
                    className="h-4 w-4 accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          {/* Tipo de encaminhamento */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold">
              Tipo de encaminhamento:
            </Label>
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { v: "nenhum", label: "Nenhum" },
                  { v: "recomendacao", label: "Recomendação" },
                  { v: "determinacao", label: "Determinação" },
                ] as const
              ).map((o) => {
                const enabled = !readOnly && isEncOptionEnabled(o.v);
                return (
                  <label
                    key={o.v}
                    className={`inline-flex items-center gap-2 text-sm ${
                      enabled ? "" : "opacity-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="encaminhamento"
                      value={o.v}
                      checked={encaminhamentoTipo === o.v}
                      disabled={!enabled}
                      onChange={() => setDespesaEncaminhamento(o.v)}
                      className="h-4 w-4 accent-[#1A56DB]"
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Editor Encaminhamento */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm font-semibold">Encaminhamento:</Label>
            <textarea
              value={encTexto}
              readOnly={encDisabled}
              maxLength={CREDITO_DESPESAS_MAX_TEXTO}
              onChange={(e) => setEncTexto(e.target.value)}
              className={`min-h-[140px] w-full rounded-md border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30 ${
                encDisabled ? "bg-[#F4F5F7]" : "bg-white"
              }`}
            />
            <p className="text-right text-xs text-muted-foreground">
              {encRestantes.toLocaleString("pt-BR")} caracteres restantes
            </p>
          </div>

          {/* Editor Considerações */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold">Considerações:</Label>
            <textarea
              value={consideracoes}
              readOnly={readOnly}
              maxLength={CREDITO_DESPESAS_MAX_TEXTO}
              onChange={(e) => setConsideracoes(e.target.value)}
              className="min-h-[140px] w-full rounded-md border border-border bg-white p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30"
            />
            <p className="text-right text-xs text-muted-foreground">
              {consRestantes.toLocaleString("pt-BR")} caracteres restantes
            </p>
            <label className="flex items-start gap-2 text-sm text-foreground">
              <Checkbox
                checked={incluir}
                onCheckedChange={(v) => setIncluir(Boolean(v))}
                disabled={readOnly}
              />
              <span>
                O texto complementar deverá constar no relatório de conclusão
                do processo.
              </span>
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Crédito inicial
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalInicial)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de Despesas empenhadas
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalDespesa)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Memória de cálculo
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
                title="Histórico de alterações"
              >
                <History className="h-4 w-4" /> Histórico
              </button>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={addMemoria}
                  className="gap-1 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                >
                  <Plus className="h-4 w-4" /> Adicionar linha
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-left">Categoria Econômica</th>
                  <th className="px-3 py-2 text-left">Grupo</th>
                  <th className="px-3 py-2 text-left">Modalidade</th>
                  <th className="px-3 py-2 text-right">Crédito inicial</th>
                  <th className="px-3 py-2 text-right">Crédito autorizado</th>
                  <th className="px-3 py-2 text-center">Apontamento</th>
                  {!readOnly && (
                    <th className="px-3 py-2 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {memoria.map((l, i) => {
                  const conforme = l.despesa <= l.autorizado;
                  return (
                    <tr
                      key={l.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-2 py-1.5">
                        <Input
                          value={l.programa}
                          readOnly={readOnly}
                          onChange={(e) =>
                            updateMemoria(l.id, { programa: e.target.value })
                          }
                          className="h-8"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.categoria}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateMemoria(l.id, { categoria: e.target.value })
                          }
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {CATEGORIAS_ECONOMICAS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.grupo}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateMemoria(l.id, { grupo: e.target.value })
                          }
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {GRUPOS_DESPESA.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.modalidade}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateMemoria(l.id, { modalidade: e.target.value })
                          }
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {MODALIDADES_APLICACAO.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput
                          value={l.inicial}
                          readOnly={readOnly}
                          onChange={(n) => updateMemoria(l.id, { inicial: n })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput
                          value={l.autorizado}
                          readOnly={readOnly}
                          onChange={(n) =>
                            updateMemoria(l.id, { autorizado: n })
                          }
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            conforme
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {conforme ? "Conforme" : "Não Conforme"}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="text-[#1A56DB] hover:opacity-80"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(l.id)}
                              className="text-red-600 hover:opacity-80"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalInicial)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(
                      memoria.reduce((s, l) => s + (l.autorizado || 0), 0)
                    )}
                  </td>
                  <td />
                  {!readOnly && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações realizadas neste submenu são registradas para
              auditoria.
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
                {CREDITO_DESPESAS_HISTORICO.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir linha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta linha da memória de cálculo?
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeMemoria(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// DSP POR DOTAÇÃO ORÇAMENTÁRIA
// ============================================================

const DSP_DOTACAO_TRANSITO_JULGADO = false;
const DSP_DOTACAO_SITUACAO_CONCLUIDA = false;
const DSP_DOTACAO_USUARIO_AUTORIZADO = true;
const DSP_DOTACAO_READ_ONLY =
  DSP_DOTACAO_TRANSITO_JULGADO ||
  DSP_DOTACAO_SITUACAO_CONCLUIDA ||
  !DSP_DOTACAO_USUARIO_AUTORIZADO;

const DSP_DOTACAO_MAX_TEXTO = 4000;

const DSP_DOTACAO_RESUMO_IA =
  "Foram identificadas inconsistências nos elementos de despesa analisados. O elemento Sentenças Judiciais apresentou valor liquidado superior ao empenhado, configurando situação irregular que requer encaminhamento específico. Os demais elementos mantiveram execução dentro dos parâmetros regulares.";

type DspDotacaoConclusao = "regular" | "ressalvas" | "irregular" | "";
type DspDotacaoEncaminhamento = "nenhum" | "recomendacao" | "determinacao" | "";

type DspDotacaoConsolidada = {
  id: string;
  elemento: string;
  empenhado: number;
  liquidado: number;
  pago: number;
};

const DSP_DOTACAO_CONSOLIDADO: DspDotacaoConsolidada[] = [
  { id: "e1", elemento: "Sentenças Judiciais", empenhado: 999_999_999.99, liquidado: 888_888_888.88, pago: 777_777_777.77 },
  { id: "e2", elemento: "Auxílios", empenhado: 888_888_888.88, liquidado: 999_999_999.99, pago: 999_999_999.99 },
  { id: "e3", elemento: "Obras e Instalações", empenhado: 777_777_777.77, liquidado: 777_777_777.77, pago: 777_777_777.77 },
  { id: "e4", elemento: "Vencimentos e vantagens fixas", empenhado: 888_888_888.88, liquidado: 999_999_999.99, pago: 999_999_999.99 },
  { id: "e5", elemento: "Outros", empenhado: 999_999_999.99, liquidado: 999_999_999.99, pago: 999_999_999.99 },
];

type DspDotacaoMemoriaLinha = {
  id: string;
  programa: string;
  categoria: string;
  grupo: string;
  modalidade: string;
  inicial: number;
  autorizado: number;
  despesa: number;
};

const DSP_DOTACAO_MEMORIA: DspDotacaoMemoriaLinha[] = [
  { id: "dd1", programa: "47", categoria: "Despesas Correntes", grupo: "Outras Despesas Correntes", modalidade: "Transferências a União", inicial: 999_999_999.99, autorizado: 888_888_888.88, despesa: 800_000_000 },
  { id: "dd2", programa: "55", categoria: "Despesas Correntes", grupo: "Pessoal e Encargos Sociais", modalidade: "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida", inicial: 999_999_999.99, autorizado: 999_999_999.99, despesa: 950_000_000 },
  { id: "dd3", programa: "68", categoria: "Despesas de Capital", grupo: "Inversões Financeiras", modalidade: "Aplicação Direta Decorrente de Operações entre Órgãos, Fundos e Entida", inicial: 0, autorizado: 999_999_999.99, despesa: 1_100_000_000 },
  { id: "dd4", programa: "88", categoria: "Despesas de Capital", grupo: "Investimentos", modalidade: "Aplicação Direta", inicial: 888_888_888.88, autorizado: 999_999_999.99, despesa: 1_050_000_000 },
  { id: "dd5", programa: "88", categoria: "Despesas de Capital", grupo: "Investimentos", modalidade: "Aplicação Direta", inicial: 777_777_777.77, autorizado: 699_999_999.99, despesa: 600_000_000 },
];

const DSP_DOTACAO_HISTORICO: ReceitasHistorico[] = [
  { ts: "16/03/2025 11:22", usuario: "Auditor 01", campo: "Linha 2 - Crédito autorizado", anterior: "950.000.000,00", novo: "999.999.999,99" },
  { ts: "15/03/2025 09:48", usuario: "Auditor 02", campo: "Conclusão", anterior: "Regular", novo: "Regular com ressalvas" },
];

function DspDotacaoContent({
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
  const readOnly = DSP_DOTACAO_READ_ONLY;

  const [memoria, setMemoria] = useState<DspDotacaoMemoriaLinha[]>(DSP_DOTACAO_MEMORIA);
  const [consolidado] = useState<DspDotacaoConsolidada[]>(DSP_DOTACAO_CONSOLIDADO);
  const [conclusao, setConclusao] = useState<DspDotacaoConclusao>("ressalvas");
  const [encaminhamentoTipo, setEncTipo] = useState<DspDotacaoEncaminhamento>("recomendacao");
  const [encTexto, setEncTexto] = useState("");
  const [consideracoes, setConsideracoes] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalEmpenhado = consolidado.reduce((s, l) => s + (l.empenhado || 0), 0);
  const totalLiquidado = consolidado.reduce((s, l) => s + (l.liquidado || 0), 0);
  const totalPago = consolidado.reduce((s, l) => s + (l.pago || 0), 0);

  const totalAutorizadoMem = memoria.reduce((s, l) => s + (l.autorizado || 0), 0);
  const totalEmpenhadoMem = memoria.reduce((s, l) => s + (l.despesa || 0), 0);

  const exibirResumoIA = consolidado.some(
    (l) => l.liquidado > l.empenhado || l.pago > l.liquidado
  );

  const encRestantes = DSP_DOTACAO_MAX_TEXTO - encTexto.length;
  const consRestantes = DSP_DOTACAO_MAX_TEXTO - consideracoes.length;

  const encDisabled = readOnly || encaminhamentoTipo === "nenhum" || encaminhamentoTipo === "";

  function isEncOptionEnabled(opt: DspDotacaoEncaminhamento) {
    if (opt === "nenhum") return conclusao === "regular";
    if (opt === "recomendacao") return conclusao === "ressalvas";
    if (opt === "determinacao") return conclusao === "irregular";
    return false;
  }
  function onConclusaoChange(v: DspDotacaoConclusao) {
    setConclusao(v);
    if (v === "regular") setEncTipo("nenhum");
    else if (v === "ressalvas") setEncTipo("recomendacao");
    else if (v === "irregular") setEncTipo("determinacao");
  }

  function updateMemoria(id: string, patch: Partial<DspDotacaoMemoriaLinha>) {
    setMemoria((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addMemoria() {
    setMemoria((arr) => [
      ...arr,
      {
        id: `dd${Date.now()}`,
        programa: "",
        categoria: CATEGORIAS_ECONOMICAS[0],
        grupo: GRUPOS_DESPESA[0],
        modalidade: MODALIDADES_APLICACAO[0],
        inicial: 0,
        autorizado: 0,
        despesa: 0,
      },
    ]);
  }
  function removeMemoria(id: string) {
    setMemoria((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

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

      {DSP_DOTACAO_TRANSITO_JULGADO && (
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

      {/* Abas */}
      <div className="mb-6 flex gap-6 border-b border-border" data-pdf-hide>
        {([
          { k: "principal", label: "Despesa por dotação orçamentária" },
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Total empenhado</Label>
              <Input readOnly value={fmtBRL(totalEmpenhado)} className="bg-[#F4F5F7] font-semibold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Total liquidado</Label>
              <Input readOnly value={fmtBRL(totalLiquidado)} className="bg-[#F4F5F7] font-semibold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Total pago</Label>
              <Input readOnly value={fmtBRL(totalPago)} className="bg-[#F4F5F7] font-semibold" />
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
                  <th className="px-3 py-2 text-left">Elemento de Despesa</th>
                  <th className="px-3 py-2 text-right">Valor empenhado</th>
                  <th className="px-3 py-2 text-right">Valor liquidado</th>
                  <th className="px-3 py-2 text-right">Valor pago</th>
                </tr>
              </thead>
              <tbody>
                {consolidado.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2">{r.elemento}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.empenhado)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.liquidado)}</td>
                    <td className="px-3 py-2 text-right">{fmtBRL(r.pago)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalEmpenhado)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalLiquidado)}</td>
                  <td className="px-3 py-2 text-right">{fmtBRL(totalPago)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {exibirResumoIA && (
            <div className="mt-6">
              <ResumoIA
                texto={DSP_DOTACAO_RESUMO_IA}
                processo={processo}
                orgao={orgao}
              />
            </div>
          )}

          {/* Conclusão do item */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm font-semibold">Conclusão do item:</Label>
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { v: "regular", label: "Regular" },
                  { v: "ressalvas", label: "Regular com ressalvas" },
                  { v: "irregular", label: "Irregular" },
                ] as const
              ).map((o) => (
                <label key={o.v} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="dotacao-conclusao"
                    value={o.v}
                    checked={conclusao === o.v}
                    disabled={readOnly}
                    onChange={() => onConclusaoChange(o.v)}
                    className="h-4 w-4 accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          {/* Tipo de encaminhamento */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold">Tipo de encaminhamento:</Label>
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { v: "nenhum", label: "Nenhum" },
                  { v: "recomendacao", label: "Recomendação" },
                  { v: "determinacao", label: "Determinação" },
                ] as const
              ).map((o) => {
                const enabled = !readOnly && isEncOptionEnabled(o.v);
                return (
                  <label
                    key={o.v}
                    className={`inline-flex items-center gap-2 text-sm ${enabled ? "" : "opacity-50"}`}
                  >
                    <input
                      type="radio"
                      name="dotacao-encaminhamento"
                      value={o.v}
                      checked={encaminhamentoTipo === o.v}
                      disabled={!enabled}
                      onChange={() => setEncTipo(o.v)}
                      className="h-4 w-4 accent-[#1A56DB]"
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Editor Encaminhamento */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm font-semibold">Encaminhamento:</Label>
            <textarea
              value={encTexto}
              readOnly={encDisabled}
              maxLength={DSP_DOTACAO_MAX_TEXTO}
              onChange={(e) => setEncTexto(e.target.value)}
              className={`min-h-[140px] w-full rounded-md border border-border p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30 ${
                encDisabled ? "bg-[#F4F5F7]" : "bg-white"
              }`}
            />
            <p className="text-right text-xs text-muted-foreground">
              {encRestantes.toLocaleString("pt-BR")} caracteres restantes
            </p>
          </div>

          {/* Editor Considerações */}
          <div className="mt-4 space-y-2">
            <Label className="text-sm font-semibold">Considerações:</Label>
            <textarea
              value={consideracoes}
              readOnly={readOnly}
              maxLength={DSP_DOTACAO_MAX_TEXTO}
              onChange={(e) => setConsideracoes(e.target.value)}
              className="min-h-[140px] w-full rounded-md border border-border bg-white p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0D1B2A]/30"
            />
            <p className="text-right text-xs text-muted-foreground">
              {consRestantes.toLocaleString("pt-BR")} caracteres restantes
            </p>
            <label className="flex items-start gap-2 text-sm text-foreground">
              <Checkbox
                checked={incluir}
                onCheckedChange={(v) => setIncluir(Boolean(v))}
                disabled={readOnly}
              />
              <span>
                O texto complementar deverá constar no relatório de conclusão
                do processo.
              </span>
            </label>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de crédito autorizado
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalAutorizadoMem)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Total de despesas empenhadas
              </Label>
              <Input
                readOnly
                value={fmtBRL(totalEmpenhadoMem)}
                className="bg-[#F4F5F7] font-semibold"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <span className="border-b-2 border-[#0D1B2A] pb-1">
                Memória de cálculo
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground hover:bg-muted"
                title="Histórico de alterações"
              >
                <History className="h-4 w-4" /> Histórico
              </button>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={addMemoria}
                  className="gap-1 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
                >
                  <Plus className="h-4 w-4" /> Adicionar linha
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Programa</th>
                  <th className="px-3 py-2 text-left">Categoria Econômica</th>
                  <th className="px-3 py-2 text-left">Grupo</th>
                  <th className="px-3 py-2 text-left">Modalidade</th>
                  <th className="px-3 py-2 text-right">Crédito inicial</th>
                  <th className="px-3 py-2 text-right">Crédito autorizado</th>
                  <th className="px-3 py-2 text-center">Apontamento</th>
                  {!readOnly && <th className="px-3 py-2 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {memoria.map((l, i) => {
                  const conforme = l.despesa <= l.autorizado;
                  return (
                    <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-1.5">
                        <Input
                          value={l.programa}
                          readOnly={readOnly}
                          onChange={(e) => updateMemoria(l.id, { programa: e.target.value })}
                          className="h-8"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.categoria}
                          disabled={readOnly}
                          onChange={(e) => updateMemoria(l.id, { categoria: e.target.value })}
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {CATEGORIAS_ECONOMICAS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.grupo}
                          disabled={readOnly}
                          onChange={(e) => updateMemoria(l.id, { grupo: e.target.value })}
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {GRUPOS_DESPESA.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={l.modalidade}
                          disabled={readOnly}
                          onChange={(e) => updateMemoria(l.id, { modalidade: e.target.value })}
                          className="h-8 w-full rounded-md border border-border bg-white px-2 text-sm disabled:bg-[#F4F5F7]"
                        >
                          {MODALIDADES_APLICACAO.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput
                          value={l.inicial}
                          readOnly={readOnly}
                          onChange={(n) => updateMemoria(l.id, { inicial: n })}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <MoneyInput
                          value={l.autorizado}
                          readOnly={readOnly}
                          onChange={(n) => updateMemoria(l.id, { autorizado: n })}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            conforme
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {conforme ? "Conforme" : "Não Conforme"}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="px-2 py-1.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="text-[#1A56DB] hover:opacity-80"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(l.id)}
                              className="text-red-600 hover:opacity-80"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F4F5F7] font-semibold">
                  <td className="px-3 py-2" colSpan={4}>TOTAL</td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(memoria.reduce((s, l) => s + (l.inicial || 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fmtBRL(totalAutorizadoMem)}
                  </td>
                  <td />
                  {!readOnly && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações realizadas neste submenu são registradas para
              auditoria.
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
                {DSP_DOTACAO_HISTORICO.map((h, i) => (
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir linha</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta linha da memória de cálculo?
              Esta ação será registrada no log de auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeMemoria(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// RESTOS A PAGAR
// ============================================================

const RESTOS_PAGAR_TRANSITO_JULGADO = false;
const RESTOS_PAGAR_SITUACAO_CONCLUIDA = false;
const RESTOS_PAGAR_USUARIO_AUTORIZADO = true;
const RESTOS_PAGAR_READ_ONLY =
  RESTOS_PAGAR_TRANSITO_JULGADO ||
  RESTOS_PAGAR_SITUACAO_CONCLUIDA ||
  !RESTOS_PAGAR_USUARIO_AUTORIZADO;

const RESTOS_PAGAR_MAX_TEXTO = 4000;
const RESTOS_PAGAR_ANO_ATUAL = 2025;

const RESTOS_PAGAR_RESUMO_IA =
  "Foram identificados Restos a Pagar com anos de origem anteriores a 2018, indicando pendências orçamentárias de longa data que merecem atenção. Os RAPs não processados superam os processados em 34%, configurando situação que requer encaminhamento específico quanto à execução orçamentária pendente do órgão.";

type RestoPagarLinha = {
  id: string;
  ano: number;
  processados: number;
  naoProcessados: number;
};

const RESTOS_PAGAR_INICIAL: RestoPagarLinha[] = [
  { id: "rp1", ano: 2016, processados: 12_500_000, naoProcessados: 8_300_000 },
  { id: "rp2", ano: 2017, processados: 9_800_000, naoProcessados: 15_200_000 },
  { id: "rp3", ano: 2023, processados: 45_000_000, naoProcessados: 32_000_000 },
  { id: "rp4", ano: 2024, processados: 78_500_000, naoProcessados: 95_000_000 },
];

const RESTOS_PAGAR_HISTORICO: ReceitasHistorico[] = [
  { ts: "18/03/2025 10:15", usuario: "Auditor 01", campo: "Linha 2024 - Não Processados", anterior: "90.000.000,00", novo: "95.000.000,00" },
  { ts: "17/03/2025 14:32", usuario: "Auditor 02", campo: "Adição de linha", anterior: "-", novo: "Ano 2016" },
];

function RestosPagarContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const readOnly = RESTOS_PAGAR_READ_ONLY;

  const [linhas, setLinhas] = useState<RestoPagarLinha[]>(RESTOS_PAGAR_INICIAL);
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const totalProcessados = linhas.reduce((s, l) => s + (l.processados || 0), 0);
  const totalNaoProcessados = linhas.reduce((s, l) => s + (l.naoProcessados || 0), 0);

  const textoRestantes = RESTOS_PAGAR_MAX_TEXTO - texto.length;

  const temAnoAntigo = linhas.some((l) => l.ano < RESTOS_PAGAR_ANO_ATUAL - 5);
  const naoProcMaiorProc = totalNaoProcessados > totalProcessados;
  const exibirResumoIA = temAnoAntigo || naoProcMaiorProc;

  function updateLinha(id: string, patch: Partial<RestoPagarLinha>) {
    setLinhas((arr) => arr.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function addLinha() {
    setLinhas((arr) => [
      ...arr,
      {
        id: `rp${Date.now()}`,
        ano: RESTOS_PAGAR_ANO_ATUAL - 1,
        processados: 0,
        naoProcessados: 0,
      },
    ]);
  }
  function removeLinha(id: string) {
    setLinhas((arr) => arr.filter((l) => l.id !== id));
    setConfirmDelete(null);
  }

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

      {RESTOS_PAGAR_TRANSITO_JULGADO && (
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

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold underline">Restos a pagar:</h2>
        <div className="flex items-center gap-2" data-pdf-hide>
          {!readOnly && (
            <Button
              type="button"
              onClick={addLinha}
              className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
            >
              + Adicionar Ano
            </Button>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Histórico de alterações"
          >
            <History className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Ano Origem</th>
              <th className="px-3 py-2 text-right">Rap's Processados</th>
              <th className="px-3 py-2 text-right">Rap's Não Processados</th>
              {!readOnly && <th className="px-3 py-2 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    value={l.ano}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateLinha(l.id, { ano: Number(e.target.value) || 0 })
                    }
                    className="w-24"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <MoneyInput
                    value={l.processados}
                    readOnly={readOnly}
                    onChange={(n) => updateLinha(l.id, { processados: n })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <MoneyInput
                    value={l.naoProcessados}
                    readOnly={readOnly}
                    onChange={(n) => updateLinha(l.id, { naoProcessados: n })}
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="text-[#1A56DB] hover:opacity-80"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(l.id)}
                        className="text-red-600 hover:opacity-80"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F4F5F7] font-bold">
              <td className="px-3 py-2">
                Total antes das inscrições de {RESTOS_PAGAR_ANO_ATUAL}
              </td>
              <td className="px-3 py-2 text-right">{fmtBRL(totalProcessados)}</td>
              <td className="px-3 py-2 text-right">{fmtBRL(totalNaoProcessados)}</td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>

      {exibirResumoIA && (
        <div className="mt-6">
          <ResumoIA
            texto={RESTOS_PAGAR_RESUMO_IA}
            processo={processo}
            orgao={orgao}
          />
        </div>
      )}

      <div className="mt-6 space-y-2">
        <Label className="text-sm font-semibold">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          readOnly={readOnly}
          onChange={(e) =>
            setTexto(e.target.value.slice(0, RESTOS_PAGAR_MAX_TEXTO))
          }
          maxLength={RESTOS_PAGAR_MAX_TEXTO}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
        />
        <div className="text-right text-xs text-muted-foreground">
          {textoRestantes} caracteres restantes
        </div>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="restos-incluir"
            checked={incluir}
            disabled={readOnly}
            onCheckedChange={(c) => setIncluir(c === true)}
          />
          <Label htmlFor="restos-incluir" className="text-sm leading-tight">
            O texto complementar deverá constar no relatório de conclusão do
            processo.
          </Label>
        </div>
      </div>

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações realizadas neste submenu são registradas para
              auditoria.
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
                {RESTOS_PAGAR_HISTORICO.map((h, i) => (
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir registro</DialogTitle>
            <DialogDescription>Deseja excluir este registro?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeLinha(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ===================== Controle Interno ===================== */

const CI_TRANSITO_JULGADO = false;
const CI_SITUACAO_CONCLUIDA = false;
const CI_USUARIO_AUTORIZADO = true;
const CI_READ_ONLY =
  CI_TRANSITO_JULGADO || CI_SITUACAO_CONCLUIDA || !CI_USUARIO_AUTORIZADO;

const CI_MAX_TEXTO = 4000;

type CIMaterialidade = "Alta" | "Média" | "Baixa";
type CISimNao = "Sim" | "Não";
type CIInciso = "Inciso II" | "Inciso III" | "Não se enquadra";

type CIApontamento = {
  id: string;
  apontamento: string;
  relatorio: string;
  pecaPagina: string;
  valor: number | null;
  materialidade: CIMaterialidade;
  danoErario: CISimNao;
  quantificado: CISimNao;
  riscoRelevante: CISimNao;
  inciso: CIInciso;
  conclusao: string;
  inserirRelatorio: boolean;
  entendimento: string;
};

const CI_APONTAMENTOS_INICIAL: CIApontamento[] = [
  {
    id: "ci1",
    apontamento:
      "Levantamento incompleto dos inventários físicos e financeiros dos bens móveis",
    relatorio: "RCI 2024",
    pecaPagina: "Peça 21, págs. 45-46",
    valor: 17371.2,
    materialidade: "Média",
    danoErario: "Não",
    quantificado: "Sim",
    riscoRelevante: "Sim",
    inciso: "Inciso II",
    conclusao:
      "Determinar levantamento completo dos inventários físicos e financeiros",
    inserirRelatorio: true,
    entendimento:
      "Impropriedade de natureza formal considerada relevante",
  },
  {
    id: "ci2",
    apontamento:
      "Imóveis contabilizados incorretamente por valor de R$ 0,01",
    relatorio: "RCI 2024",
    pecaPagina: "Peça 23, pág. 34",
    valor: 0.01,
    materialidade: "Alta",
    danoErario: "Não",
    quantificado: "Sim",
    riscoRelevante: "Sim",
    inciso: "Inciso III",
    conclusao:
      "Determinar apresentação do andamento da tratativa com SEPLAG",
    inserirRelatorio: true,
    entendimento: "Bens avaliados incorretamente sem regularização",
  },
  {
    id: "ci3",
    apontamento:
      "Documentos referentes à execução orçamentária sem assinatura",
    relatorio: "RCI 2024",
    pecaPagina: "Peça 23, pág. 41",
    valor: null,
    materialidade: "Média",
    danoErario: "Não",
    quantificado: "Não",
    riscoRelevante: "Sim",
    inciso: "Inciso II",
    conclusao:
      "Determinar assinatura digital de todos os documentos até o término do exercício",
    inserirRelatorio: true,
    entendimento: "Descumprimento do art. 13 do Decreto nº 48.934/2024",
  },
  {
    id: "ci4",
    apontamento: "Divergência de conciliação contábil — R$ 915.603,62",
    relatorio: "RCI 2024",
    pecaPagina: "Peça 21 pág. 30 / Peça 23 págs. 19, 28 e 96",
    valor: 915603.62,
    materialidade: "Alta",
    danoErario: "Não",
    quantificado: "Sim",
    riscoRelevante: "Sim",
    inciso: "Inciso II",
    conclusao:
      "Recomendar continuidade da apuração e apresentação dos resultados em futura PCE",
    inserirRelatorio: true,
    entendimento:
      "Saldo contábil sem correspondência bancária ainda em apuração",
  },
  {
    id: "ci5",
    apontamento:
      "Emissão intempestiva do relatório do inventário físico e financeiro dos materiais em almoxarifado",
    relatorio: "RCI 2024",
    pecaPagina: "Peça 21",
    valor: null,
    materialidade: "Baixa",
    danoErario: "Não",
    quantificado: "Não",
    riscoRelevante: "Não",
    inciso: "Não se enquadra",
    conclusao:
      "Recomendar aprimoramento dos trabalhos das comissões inventariantes",
    inserirRelatorio: true,
    entendimento:
      "Relatório emitido em 12/01/2025, após prazo legal de 10/01/2025",
  },
];

const CI_RESUMO_IA =
  "A análise do RCI identificou 5 apontamentos relevantes, sendo 2 de alta materialidade relacionados a imóveis contabilizados incorretamente e divergência de conciliação contábil. Não foram identificados danos ao erário. Recomenda-se atenção especial aos apontamentos dos tópicos 4.3.2 e 4.3.3, que demandam encaminhamento com determinação.";

const CI_HISTORICO: ReceitasHistorico[] = [
  {
    ts: "20/05/2026 10:14",
    usuario: "IA - Sistema",
    campo: "Apontamentos",
    anterior: "-",
    novo: "5 apontamentos extraídos do RCI 2024",
  },
  {
    ts: "20/05/2026 14:32",
    usuario: "Auditor João Silva",
    campo: "Apontamento 2 - Conclusão",
    anterior: "Recomendar regularização",
    novo: "Determinar apresentação do andamento da tratativa com SEPLAG",
  },
];

function ControleInternoContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const readOnly = CI_READ_ONLY;

  const [reqMinimos, setReqMinimos] = useState(true);
  const [pesquisavel, setPesquisavel] = useState(true);
  const [adequado, setAdequado] = useState<"sim" | "nao" | null>("sim");
  const [enquadraIncisos, setEnquadraIncisos] = useState<
    "sim" | "nao" | null
  >(null);

  const [apontamentos, setApontamentos] = useState<CIApontamento[]>(
    CI_APONTAMENTOS_INICIAL,
  );
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const textoRestantes = CI_MAX_TEXTO - texto.length;

  const exibirResumoIA = apontamentos.some(
    (a) => a.materialidade === "Alta" || a.danoErario === "Sim",
  );

  function updateAp(id: string, patch: Partial<CIApontamento>) {
    setApontamentos((arr) =>
      arr.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }
  function addAp() {
    setApontamentos((arr) => [
      ...arr,
      {
        id: `ci${Date.now()}`,
        apontamento: "",
        relatorio: "",
        pecaPagina: "",
        valor: null,
        materialidade: "Média",
        danoErario: "Não",
        quantificado: "Não",
        riscoRelevante: "Não",
        inciso: "Não se enquadra",
        conclusao: "",
        inserirRelatorio: false,
        entendimento: "",
      },
    ]);
  }
  function removeAp(id: string) {
    setApontamentos((arr) => arr.filter((a) => a.id !== id));
    setConfirmDelete(null);
  }

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

      {CI_TRANSITO_JULGADO && (
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

      <h2 className="mb-4 text-base font-semibold underline">
        Controle Interno:
      </h2>

      {/* Bloco 1 - Verificações iniciais */}
      <div className="space-y-4 rounded-md border border-border bg-white p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Checkbox
              id="ci-req-minimos"
              checked={reqMinimos}
              disabled={readOnly}
              onCheckedChange={(c) => setReqMinimos(c === true)}
            />
            <Label htmlFor="ci-req-minimos" className="text-sm leading-tight">
              O relatório contém as informações mínimas exigidas pela DN.
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="ci-pesquisavel"
              checked={pesquisavel}
              disabled={readOnly}
              onCheckedChange={(c) => setPesquisavel(c === true)}
            />
            <Label htmlFor="ci-pesquisavel" className="text-sm leading-tight">
              Documento em formato digital pesquisável e não digitalizado como
              imagem.
            </Label>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            O relatório está adequado (possui os requisitos técnicos e formais
            relevantes)?
          </Label>
          <div className="flex flex-wrap gap-6">
            {(
              [
                { v: "sim", label: "Sim" },
                { v: "nao", label: "Não" },
              ] as const
            ).map((o) => (
              <label
                key={o.v}
                className="inline-flex items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="ci-adequado"
                  value={o.v}
                  checked={adequado === o.v}
                  disabled={readOnly}
                  onChange={() => setAdequado(o.v)}
                  className="h-4 w-4 accent-[#1A56DB]"
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {adequado === "nao" && (
          <div className="space-y-2 rounded-md bg-[#F4F5F7] p-3">
            <Label className="text-sm font-semibold">
              A inadequação identificada se enquadra nos incisos II ou III do
              Art. 97 do Regimento Interno?
            </Label>
            <div className="flex flex-wrap gap-6">
              {(
                [
                  { v: "sim", label: "Sim" },
                  { v: "nao", label: "Não" },
                ] as const
              ).map((o) => (
                <label
                  key={o.v}
                  className="inline-flex items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name="ci-incisos"
                    value={o.v}
                    checked={enquadraIncisos === o.v}
                    disabled={readOnly}
                    onChange={() => setEnquadraIncisos(o.v)}
                    className="h-4 w-4 accent-[#1A56DB]"
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloco 2 - Tabela de apontamentos */}
      <div className="mt-6 flex items-start gap-3 rounded-md border border-[#1A56DB]/30 bg-[#EFF6FF] p-3 text-sm text-[#0D1B2A]">
        <span aria-hidden className="text-lg leading-none">
          ✨
        </span>
        <p>
          Apontamentos extraídos automaticamente pela IA a partir da leitura
          do RCI enviado pelo órgão via e-TCE. Revise, edite ou adicione
          apontamentos conforme necessário.
        </p>
      </div>

      <div className="mb-3 mt-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Apontamentos do RCI</h3>
        <div className="flex items-center gap-2" data-pdf-hide>
          {!readOnly && (
            <Button
              type="button"
              onClick={addAp}
              className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
            >
              + Adicionar Apontamento
            </Button>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Histórico de alterações"
          >
            <History className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1800px] text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Apontamento</th>
              <th className="px-3 py-2 text-left">Relatório</th>
              <th className="px-3 py-2 text-left">Peça/Página</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-left">Materialidade</th>
              <th className="px-3 py-2 text-left">Dano ao Erário?</th>
              <th className="px-3 py-2 text-left">Quantificado?</th>
              <th className="px-3 py-2 text-left">Risco relevante?</th>
              <th className="px-3 py-2 text-left">Inciso II ou III?</th>
              <th className="px-3 py-2 text-left">Conclusão e Encaminhamento</th>
              <th className="px-3 py-2 text-center">Inserir no Relatório</th>
              <th className="px-3 py-2 text-left">Entendimento técnico</th>
              {!readOnly && <th className="px-3 py-2 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {apontamentos.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="min-w-[220px] px-2 py-1.5 align-top">
                  <textarea
                    value={a.apontamento}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { apontamento: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <Input
                    value={a.relatorio}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { relatorio: e.target.value })
                    }
                    className="w-28 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <Input
                    value={a.pecaPagina}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { pecaPagina: e.target.value })
                    }
                    className="w-44 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <MoneyInput
                    value={a.valor ?? 0}
                    readOnly={readOnly}
                    onChange={(n) => updateAp(a.id, { valor: n })}
                  />
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    value={a.materialidade}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, {
                        materialidade: e.target.value as CIMaterialidade,
                      })
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option>Alta</option>
                    <option>Média</option>
                    <option>Baixa</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    value={a.danoErario}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, {
                        danoErario: e.target.value as CISimNao,
                      })
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    value={a.quantificado}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, {
                        quantificado: e.target.value as CISimNao,
                      })
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    value={a.riscoRelevante}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, {
                        riscoRelevante: e.target.value as CISimNao,
                      })
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option>Sim</option>
                    <option>Não</option>
                  </select>
                </td>
                <td className="px-2 py-1.5 align-top">
                  <select
                    value={a.inciso}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { inciso: e.target.value as CIInciso })
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option>Inciso II</option>
                    <option>Inciso III</option>
                    <option>Não se enquadra</option>
                  </select>
                </td>
                <td className="min-w-[220px] px-2 py-1.5 align-top">
                  <textarea
                    value={a.conclusao}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { conclusao: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 text-center align-top">
                  <Checkbox
                    checked={a.inserirRelatorio}
                    disabled={readOnly}
                    onCheckedChange={(c) =>
                      updateAp(a.id, { inserirRelatorio: c === true })
                    }
                  />
                </td>
                <td className="min-w-[220px] px-2 py-1.5 align-top">
                  <textarea
                    value={a.entendimento}
                    readOnly={readOnly}
                    onChange={(e) =>
                      updateAp(a.id, { entendimento: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-1.5 align-top">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="text-[#1A56DB] hover:opacity-80"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(a.id)}
                        className="text-red-600 hover:opacity-80"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exibirResumoIA && (
        <div className="mt-6">
          <ResumoIA texto={CI_RESUMO_IA} processo={processo} orgao={orgao} />
        </div>
      )}

      <div className="mt-6 space-y-2">
        <Label className="text-sm font-semibold">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          readOnly={readOnly}
          onChange={(e) => setTexto(e.target.value.slice(0, CI_MAX_TEXTO))}
          maxLength={CI_MAX_TEXTO}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
        />
        <div className="text-right text-xs text-muted-foreground">
          {textoRestantes} caracteres restantes
        </div>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="ci-incluir"
            checked={incluir}
            disabled={readOnly}
            onCheckedChange={(c) => setIncluir(c === true)}
          />
          <Label htmlFor="ci-incluir" className="text-sm leading-tight">
            O texto complementar deverá constar no relatório de conclusão do
            processo.
          </Label>
        </div>
      </div>

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações realizadas neste submenu são registradas para
              auditoria.
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
                {CI_HISTORICO.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir apontamento</DialogTitle>
            <DialogDescription>
              Deseja excluir este apontamento?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removeAp(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============ Outras Inconformidades ============

const OUTRAS_INCO_TRANSITO_JULGADO = false;
const OUTRAS_INCO_SITUACAO_CONCLUIDA = false;
const OUTRAS_INCO_READ_ONLY =
  OUTRAS_INCO_TRANSITO_JULGADO || OUTRAS_INCO_SITUACAO_CONCLUIDA;

const OUTRAS_INCO_MAX = 4000;

type OIConclusao = "Regular" | "Regular com ressalvas" | "Irregular";
type OIEncaminhamento = "Nenhum" | "Recomendação" | "Determinação";

type OutrasInco = {
  id: string;
  titulo: string;
  conclusao: OIConclusao;
  encaminhamento: OIEncaminhamento;
  descricao: string;
  descEncaminhamento: string;
  entendimento: string;
};

// Estado persistente entre navegações (mantido no módulo)
const OUTRAS_INCO_STORE: { lista: OutrasInco[]; texto: string; incluir: boolean } = {
  lista: [
    {
      id: "oi1",
      titulo: "Atraso na entrega de documentação comprobatória",
      conclusao: "Regular com ressalvas",
      encaminhamento: "Recomendação",
      descricao:
        "Foi identificado atraso sistemático na entrega de documentos comprobatórios referentes às despesas realizadas no exercício, impactando o cronograma de análise técnica.",
      descEncaminhamento:
        "Recomenda-se que o órgão estabeleça controles internos para garantir a entrega tempestiva da documentação exigida.",
      entendimento:
        "Situação recorrente que não configurou irregularidade grave mas merece atenção para os próximos exercícios.",
    },
    {
      id: "oi2",
      titulo: "Divergência em registros de contratos",
      conclusao: "Irregular",
      encaminhamento: "Determinação",
      descricao:
        "Foram encontradas divergências entre os valores registrados nos contratos e os valores efetivamente pagos, sem justificativa formal.",
      descEncaminhamento:
        "Determina-se que o órgão apresente justificativa formal para as divergências identificadas e promova a regularização dos registros.",
      entendimento:
        "Irregularidade que demanda encaminhamento com determinação conforme Art. 97, inciso III do Regimento Interno.",
    },
  ],
  texto: "",
  incluir: true,
};

const OUTRAS_INCO_HISTORICO_STORE: ReceitasHistorico[] = [
  {
    ts: "20/05/2026 09:12",
    usuario: "Auditor João Silva",
    campo: "Cadastro",
    anterior: "-",
    novo: "Atraso na entrega de documentação comprobatória",
  },
  {
    ts: "20/05/2026 09:25",
    usuario: "Auditor João Silva",
    campo: "Cadastro",
    anterior: "-",
    novo: "Divergência em registros de contratos",
  },
];

function conclusaoBadge(c: OIConclusao) {
  if (c === "Regular") return "bg-green-100 text-green-800 border border-green-300";
  if (c === "Regular com ressalvas")
    return "bg-yellow-100 text-yellow-800 border border-yellow-300";
  return "bg-red-100 text-red-800 border border-red-300";
}
function encaminhamentoBadge(e: OIEncaminhamento) {
  if (e === "Nenhum") return "bg-gray-100 text-gray-700 border border-gray-300";
  if (e === "Recomendação") return "bg-blue-100 text-blue-800 border border-blue-300";
  return "bg-orange-100 text-orange-800 border border-orange-300";
}

function inferConclusao(e: OIEncaminhamento): OIConclusao {
  if (e === "Nenhum") return "Regular";
  if (e === "Recomendação") return "Regular com ressalvas";
  return "Irregular";
}
function inferEncaminhamento(c: OIConclusao): OIEncaminhamento {
  if (c === "Regular") return "Nenhum";
  if (c === "Regular com ressalvas") return "Recomendação";
  return "Determinação";
}

function OutrasInconformidadesContent({
  processo,
  orgao,
  view,
  onViewChange,
}: {
  processo: string;
  orgao: string;
  view: "form" | "lista";
  onViewChange: (v: "form" | "lista") => void;
}) {
  const readOnly = OUTRAS_INCO_READ_ONLY;

  const [lista, setLista] = useState<OutrasInco[]>(OUTRAS_INCO_STORE.lista);
  const [texto, setTexto] = useState(OUTRAS_INCO_STORE.texto);
  const [incluir, setIncluir] = useState(OUTRAS_INCO_STORE.incluir);
  const [historico, setHistorico] = useState<ReceitasHistorico[]>(
    OUTRAS_INCO_HISTORICO_STORE,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const emptyForm = {
    titulo: "",
    conclusao: "Regular" as OIConclusao,
    encaminhamento: "Nenhum" as OIEncaminhamento,
    descricao: "",
    descEncaminhamento: "",
    entendimento: "",
  };
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [touched, setTouched] = useState(false);

  // Persiste no store ao mudar
  function commitLista(next: OutrasInco[]) {
    setLista(next);
    OUTRAS_INCO_STORE.lista = next;
  }
  function commitTexto(v: string) {
    setTexto(v);
    OUTRAS_INCO_STORE.texto = v;
  }
  function commitIncluir(v: boolean) {
    setIncluir(v);
    OUTRAS_INCO_STORE.incluir = v;
  }

  function novaIncoformidade() {
    setForm(emptyForm);
    setEditingId(null);
    setTouched(false);
    onViewChange("form");
  }

  function editar(id: string) {
    const item = lista.find((x) => x.id === id);
    if (!item) return;
    setForm({
      titulo: item.titulo,
      conclusao: item.conclusao,
      encaminhamento: item.encaminhamento,
      descricao: item.descricao,
      descEncaminhamento: item.descEncaminhamento,
      entendimento: item.entendimento,
    });
    setEditingId(id);
    setTouched(false);
    onViewChange("form");
  }

  function removerConfirmado(id: string) {
    const item = lista.find((x) => x.id === id);
    const next = lista.filter((x) => x.id !== id);
    commitLista(next);
    setHistorico((h) => [
      {
        ts: new Date().toLocaleString("pt-BR"),
        usuario: "Auditor Atual",
        campo: "Exclusão",
        anterior: item?.titulo ?? "-",
        novo: "-",
      },
      ...h,
    ]);
    setConfirmDelete(null);
    toast.success("Incoformidade excluída.");
  }

  function validar(): boolean {
    return (
      form.titulo.trim().length > 0 &&
      form.descricao.trim().length > 0 &&
      (form.encaminhamento === "Nenhum" ||
        form.descEncaminhamento.trim().length > 0)
    );
  }

  function salvar(): boolean {
    setTouched(true);
    if (!validar()) return false;

    if (editingId) {
      const next = lista.map((x) =>
        x.id === editingId ? { ...x, ...form } : x,
      );
      commitLista(next);
      setHistorico((h) => [
        {
          ts: new Date().toLocaleString("pt-BR"),
          usuario: "Auditor Atual",
          campo: "Edição",
          anterior: editingId,
          novo: form.titulo,
        },
        ...h,
      ]);
    } else {
      const novo: OutrasInco = { id: `oi${Date.now()}`, ...form };
      commitLista([...lista, novo]);
      setHistorico((h) => [
        {
          ts: new Date().toLocaleString("pt-BR"),
          usuario: "Auditor Atual",
          campo: "Cadastro",
          anterior: "-",
          novo: form.titulo,
        },
        ...h,
      ]);
    }
    toast.success("Incoformidade cadastrada com sucesso!");
    return true;
  }

  function inserirNovo() {
    if (salvar()) {
      setForm(emptyForm);
      setEditingId(null);
      setTouched(false);
    }
  }
  function inserirSair() {
    if (salvar()) {
      setForm(emptyForm);
      setEditingId(null);
      setTouched(false);
      onViewChange("lista");
    }
  }

  function setEnc(e: OIEncaminhamento) {
    setForm((f) => ({
      ...f,
      encaminhamento: e,
      conclusao: inferConclusao(e),
      descEncaminhamento: e === "Nenhum" ? "" : f.descEncaminhamento,
    }));
  }
  function setConc(c: OIConclusao) {
    setForm((f) => ({
      ...f,
      conclusao: c,
      encaminhamento: inferEncaminhamento(c),
      descEncaminhamento:
        inferEncaminhamento(c) === "Nenhum" ? "" : f.descEncaminhamento,
    }));
  }

  const header = (
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
      {OUTRAS_INCO_TRANSITO_JULGADO && (
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
    </>
  );

  // -------------------- TELA 1 (formulário) --------------------
  if (view === "form" && !readOnly) {
    const descRest = OUTRAS_INCO_MAX - form.descricao.length;
    const encRest = OUTRAS_INCO_MAX - form.descEncaminhamento.length;
    const entRest = OUTRAS_INCO_MAX - form.entendimento.length;
    const encDisabled = form.encaminhamento === "Nenhum";

    const errTitulo = touched && !form.titulo.trim();
    const errDesc = touched && !form.descricao.trim();
    const errEnc =
      touched && !encDisabled && !form.descEncaminhamento.trim();

    return (
      <>
        {header}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold underline">
            Outras Incoformidades:
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => onViewChange("lista")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Ver listagem
          </Button>
        </div>

        <div className="space-y-5 rounded-md border border-border bg-white p-4">
          <div>
            <Label className="text-sm font-semibold">
              Título da Incoformidade:
            </Label>
            <Input
              value={form.titulo}
              placeholder="Descreva o título..."
              onChange={(e) =>
                setForm((f) => ({ ...f, titulo: e.target.value }))
              }
              className={`mt-1 ${errTitulo ? "border-red-500 focus-visible:ring-red-500" : ""}`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <Label className="text-sm font-semibold">
                Conclusão do item:
              </Label>
              <div className="mt-2 space-y-2 text-sm">
                {(
                  [
                    "Regular",
                    "Regular com ressalvas",
                    "Irregular",
                  ] as OIConclusao[]
                ).map((c) => (
                  <label key={c} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="oi-conclusao"
                      checked={form.conclusao === c}
                      onChange={() => setConc(c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border p-3">
              <Label className="text-sm font-semibold">
                Tipo de encaminhamento:
              </Label>
              <div className="mt-2 space-y-2 text-sm">
                {(
                  [
                    "Nenhum",
                    "Recomendação",
                    "Determinação",
                  ] as OIEncaminhamento[]
                ).map((e) => (
                  <label key={e} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="oi-enc"
                      checked={form.encaminhamento === e}
                      onChange={() => setEnc(e)}
                    />
                    {e}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">
              Descrição da incoformidade:
            </Label>
            <textarea
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  descricao: e.target.value.slice(0, OUTRAS_INCO_MAX),
                }))
              }
              rows={5}
              maxLength={OUTRAS_INCO_MAX}
              className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB] ${errDesc ? "border-red-500" : "border-input"}`}
            />
            <div className="text-right text-xs text-muted-foreground">
              {descRest} caracteres restantes
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Encaminhamento:</Label>
            <textarea
              value={form.descEncaminhamento}
              disabled={encDisabled}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  descEncaminhamento: e.target.value.slice(0, OUTRAS_INCO_MAX),
                }))
              }
              rows={5}
              maxLength={OUTRAS_INCO_MAX}
              className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${errEnc ? "border-red-500" : "border-input"}`}
            />
            <div className="text-right text-xs text-muted-foreground">
              {encRest} caracteres restantes
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">
              Entendimento técnico:
            </Label>
            <textarea
              value={form.entendimento}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  entendimento: e.target.value.slice(0, OUTRAS_INCO_MAX),
                }))
              }
              rows={5}
              maxLength={OUTRAS_INCO_MAX}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
            />
            <div className="text-right text-xs text-muted-foreground">
              {entRest} caracteres restantes
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              onClick={inserirNovo}
              className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
            >
              <Plus className="h-4 w-4" /> Inserir o novo
            </Button>
            <Button
              type="button"
              onClick={inserirSair}
              className="gap-2 bg-[#16A34A] text-white hover:bg-[#16A34A]/90"
            >
              <Check className="h-4 w-4" /> Inserir e sair
            </Button>
          </div>
        </div>
      </>
    );
  }

  // -------------------- TELA 2 (listagem) --------------------
  const textoRest = OUTRAS_INCO_MAX - texto.length;

  return (
    <>
      {header}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold underline">
          Outras Incoformidades:
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="rounded-md border border-border bg-white p-2 text-gray-600 hover:bg-gray-50"
            title="Histórico de Alterações"
          >
            <History className="h-4 w-4" />
          </button>
          {!readOnly && (
            <Button
              type="button"
              onClick={novaIncoformidade}
              className="gap-2 bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90"
            >
              <Plus className="h-4 w-4" /> Nova Incoformidade
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Incoformidade</th>
              <th className="px-3 py-2 text-left">Conclusão</th>
              <th className="px-3 py-2 text-left">Encaminhamento</th>
              <th className="px-3 py-2 text-left">Descrição</th>
              <th className="px-3 py-2 text-left">Desc. encaminhamento</th>
              <th className="px-3 py-2 text-left">Entendimento técnico</th>
              {!readOnly && <th className="px-3 py-2 text-left">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 6 : 7}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhuma incoformidade cadastrada. Clique em "+ Nova
                  Incoformidade" para começar.
                </td>
              </tr>
            ) : (
              lista.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 align-top">{row.titulo}</td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${conclusaoBadge(row.conclusao)}`}
                    >
                      {row.conclusao}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${encaminhamentoBadge(row.encaminhamento)}`}
                    >
                      {row.encaminhamento}
                    </span>
                  </td>
                  <td
                    className="max-w-[220px] truncate px-3 py-2 align-top"
                    title={row.descricao}
                  >
                    {row.descricao}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-3 py-2 align-top"
                    title={row.descEncaminhamento}
                  >
                    {row.descEncaminhamento || "-"}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-3 py-2 align-top"
                    title={row.entendimento}
                  >
                    {row.entendimento || "-"}
                  </td>
                  {!readOnly && (
                    <td className="px-3 py-2 align-top">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => editar(row.id)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(row.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-2">
        <Label className="text-sm font-semibold">
          AQUI EDITOR DE TEXTO COM ATÉ 4 MIL CARACTERES
        </Label>
        <textarea
          value={texto}
          readOnly={readOnly}
          onChange={(e) => commitTexto(e.target.value.slice(0, OUTRAS_INCO_MAX))}
          maxLength={OUTRAS_INCO_MAX}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB] disabled:bg-gray-50"
        />
        <div className="text-right text-xs text-muted-foreground">
          {textoRest} caracteres restantes
        </div>
        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="oi-incluir"
            checked={incluir}
            disabled={readOnly}
            onCheckedChange={(c) => commitIncluir(c === true)}
          />
          <Label htmlFor="oi-incluir" className="text-sm leading-tight">
            O texto complementar deverá constar no relatório de conclusão do
            processo.
          </Label>
        </div>
      </div>

      {/* Modal histórico */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as ações realizadas neste submenu são registradas para
              auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Data/Hora</th>
                  <th className="px-3 py-2 text-left">Usuário</th>
                  <th className="px-3 py-2 text-left">Ação</th>
                  <th className="px-3 py-2 text-left">Título</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2">{h.ts}</td>
                    <td className="px-3 py-2">{h.usuario}</td>
                    <td className="px-3 py-2">{h.campo}</td>
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

      {/* Modal confirmação exclusão */}
      <Dialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir incoformidade</DialogTitle>
            <DialogDescription>
              Deseja excluir esta incoformidade?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => confirmDelete && removerConfirmado(confirmDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Check className="mr-1 h-4 w-4" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============ Conclusão ============

const CONCLUSAO_TRANSITO_JULGADO = false;
const CONCLUSAO_READ_ONLY = CONCLUSAO_TRANSITO_JULGADO;
const CONCLUSAO_MAX = 4000;

const CONCLUSAO_PDF_REF: { fn: ((processo: string, orgao: string) => void) | null } = {
  fn: null,
};

type JulgamentoTipo = "regulares" | "ressalva" | "irregulares";

const JULGAMENTO_OPTS: {
  v: JulgamentoTipo;
  label: string;
  inciso: string;
  artigo: string;
}[] = [
  { v: "regulares", label: "Regulares", inciso: "I", artigo: "art. 48, I, da LC 102/2008" },
  { v: "ressalva", label: "Regulares com ressalva", inciso: "II", artigo: "art. 48, II, da LC 102/2008" },
  { v: "irregulares", label: "Irregulares", inciso: "III", artigo: "art. 48, III, da LC 102/2008" },
];

const CONCLUSAO_APONTAMENTOS: {
  topico: string;
  apontamento: string;
  encaminhamento: string;
}[] = [
  {
    topico: "Controle Interno",
    apontamento:
      "Levantamento incompleto dos inventários físicos e financeiros dos bens móveis",
    encaminhamento:
      "Determinar que a gestão realize o levantamento completo dos inventários físicos e financeiros dos itens determinados pela legislação",
  },
  {
    topico: "Controle Interno",
    apontamento: "Imóveis contabilizados incorretamente por valor de R$ 0,01",
    encaminhamento:
      "Determinar que sejam apresentados o andamento ou o resultado da tratativa com SEPLAG",
  },
  {
    topico: "Controle Interno",
    apontamento:
      "Documentos referentes à execução orçamentária sem assinatura",
    encaminhamento:
      "Determinar que a gestão aprimore seus controles para assinatura digital de todos os documentos até o término do exercício financeiro",
  },
  {
    topico: "Restos a Pagar",
    apontamento:
      "Registros de Restos a Pagar com ano-origem mais antigo que 5 anos anteriores ao exercício avaliado",
    encaminhamento:
      "Recomendar que a gestão reavalie a real persistência desses saldos e o eventual cancelamento dos saldos indevidos",
  },
  {
    topico: "Outras Incoformidades",
    apontamento: "Divergência em registros de contratos",
    encaminhamento:
      "Determinar que o órgão apresente justificativa formal para as divergências identificadas",
  },
];

const CONCLUSAO_STORE: {
  intro: string;
  julgamento: JulgamentoTipo;
  entendimento: string;
  consideracoes: string;
} = {
  intro:
    "O presente exame foi elaborado observando-se os critérios ressaltados no relatório técnico, ou seja, com base nas disposições constitucionais e legislação infraconstitucional vigente durante o exercício de análise, ficando as considerações restritas às exigências da referida legislação.",
  julgamento: "ressalva",
  entendimento: "",
  consideracoes: "",
};

const ASSINATURA = {
  data: "17 de junho de 2025",
  auditor: "Analista 01",
  tcAuditor: "3284-8",
  coordenador: "Coordenador 01",
  tcCoordenador: "3187-6",
  responsavel: "João Silva Souza",
  ano: "2025",
};

function ConclusaoContent({
  processo,
  orgao,
}: {
  processo: string;
  orgao: string;
}) {
  const readOnly = CONCLUSAO_READ_ONLY;
  const [intro, setIntro] = useState(CONCLUSAO_STORE.intro);
  const [julgamento, setJulgamento] = useState<JulgamentoTipo>(
    CONCLUSAO_STORE.julgamento,
  );
  const [entendimento, setEntendimento] = useState(CONCLUSAO_STORE.entendimento);
  const [consideracoes, setConsideracoes] = useState(CONCLUSAO_STORE.consideracoes);

  useEffect(() => {
    CONCLUSAO_STORE.intro = intro;
  }, [intro]);
  useEffect(() => {
    CONCLUSAO_STORE.julgamento = julgamento;
  }, [julgamento]);
  useEffect(() => {
    CONCLUSAO_STORE.entendimento = entendimento;
  }, [entendimento]);
  useEffect(() => {
    CONCLUSAO_STORE.consideracoes = consideracoes;
  }, [consideracoes]);

  const julgOpt = JULGAMENTO_OPTS.find((o) => o.v === julgamento)!;
  const textoJulgamento = `Por todo o exposto, esta Unidade Técnica entende que as contas do ${orgao} referente ao exercício de ${ASSINATURA.ano}, sob a responsabilidade do(a) ${ASSINATURA.responsavel}, devem ser julgadas ${julgOpt.label.toLowerCase()}, nos termos do artigo 48, ${julgOpt.inciso}, da Lei Complementar 102/2008.`;

  function gerarPdfCompleto(proc: string, org: string) {
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    const linhas = CONCLUSAO_APONTAMENTOS.map(
      (a) =>
        `<tr><td>${escapeHTML(a.topico)}</td><td>${escapeHTML(
          a.apontamento,
        )}</td><td>${escapeHTML(a.encaminhamento)}</td></tr>`,
    ).join("");
    const jOpt = JULGAMENTO_OPTS.find((o) => o.v === julgamento)!;
    const textoJ = `Por todo o exposto, esta Unidade Técnica entende que as contas do ${org} referente ao exercício de ${ASSINATURA.ano}, sob a responsabilidade do(a) ${ASSINATURA.responsavel}, devem ser julgadas ${jOpt.label.toLowerCase()}, nos termos do artigo 48, ${jOpt.inciso}, da Lei Complementar 102/2008.`;
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Relatório de Avaliação de Contas de Gestão - ${escapeHTML(proc)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "Times New Roman", Georgia, serif; color:#0D1B2A; font-size: 12pt; line-height: 1.55; }
  h1.title { text-align:center; font-size: 14pt; font-weight: 700; margin: 0 0 18px; text-transform: uppercase; }
  h2 { font-size: 12.5pt; font-weight: 700; margin: 20px 0 8px; border-bottom: 1px solid #0D1B2A; padding-bottom: 4px; }
  h3 { font-size: 12pt; font-weight: 700; margin: 14px 0 6px; }
  .meta { border: 1px solid #94a3b8; padding: 10px 14px; margin-bottom: 18px; font-size: 11pt; }
  .meta div { margin: 2px 0; }
  p { text-align: justify; margin: 6px 0; }
  table { width:100%; border-collapse: collapse; margin: 10px 0; font-size: 10.5pt; }
  th, td { border:1px solid #475569; padding: 6px 8px; vertical-align: top; text-align: left; }
  th { background:#e2e8f0; }
  .sign { margin-top: 28px; text-align: center; font-size: 11pt; }
  .sign .name { margin-top: 36px; font-weight: 700; }
  .footer { margin-top: 32px; padding-top: 10px; border-top: 1px solid #94a3b8; font-size: 9.5pt; color:#475569; text-align:center; line-height:1.4; }
</style></head><body>
<h1 class="title">Relatório de Avaliação de Contas de Gestão</h1>
<div class="meta">
  <div><strong>Processo:</strong> ${escapeHTML(proc)}</div>
  <div><strong>Órgão/Entidade:</strong> IPSEMG — Instituto de Previdência dos Servidores de MG</div>
  <div><strong>Ano de Referência:</strong> ${ASSINATURA.ano}</div>
  <div><strong>Data da autuação:</strong> 06/05/2025</div>
</div>

<h2>1. Introdução</h2>
<p>Trata-se da análise da prestação de contas anual do exercício de ${ASSINATURA.ano}, em cumprimento ao disposto na Instrução Normativa nº 14/2011 e na Deliberação Normativa nº 01/2025 do Tribunal de Contas do Estado de Minas Gerais, conforme procedimento da Coordenadoria de Análise de Contas de Gestão do Estado e de Auditoria Financeira (CACGEAF).</p>

<h2>2. Considerações Gerais sobre o IPSEMG</h2>
<p>O IPSEMG é a autarquia responsável pela previdência e assistência aos servidores públicos do Estado de Minas Gerais. As considerações gerais registradas pelo auditor encontram-se consolidadas no submenu correspondente.</p>

<h2>3. Análise orçamentária e financeira</h2>
<h3>3.1 Receitas</h3>
<p>Dados consolidados a partir do submenu Receitas, com base nas receitas previstas e arrecadadas no exercício.</p>
<h3>3.2 Programação e execução</h3>
<p>Dados consolidados a partir dos submenus Crédito inicial autorizado, Programas, Crédito e Despesas por programa e Despesa por dotação orçamentária.</p>
<h3>3.3 Restos a pagar</h3>
<p>Dados consolidados a partir do submenu Restos a Pagar, com avaliação dos saldos por ano de origem.</p>

<h2>4. Análise dos relatórios dos jurisdicionados</h2>
<p>Avaliação do Relatório de Controle Interno (RCI) e dos apontamentos extraídos automaticamente pela IA, conforme registrado no submenu Controle Interno.</p>

<h2>5. Outros assuntos relevantes</h2>
<p>Demais inconformidades identificadas no decorrer da análise, conforme submenu Outras Incoformidades.</p>

<h2>6. Conclusão</h2>
<p>${escapeHTML(intro)}</p>
<p><strong>Julgamento das contas:</strong> ${escapeHTML(jOpt.label)} (${escapeHTML(jOpt.artigo)}).</p>
<p>${escapeHTML(textoJ)}</p>

<h3>Apontamentos e propostas de encaminhamento</h3>
<table>
  <thead><tr><th>Tópico</th><th>Apontamento</th><th>Proposta de encaminhamento</th></tr></thead>
  <tbody>${linhas}</tbody>
</table>

${entendimento ? `<h3>Entendimento técnico</h3><p>${escapeHTML(entendimento)}</p>` : ""}
${consideracoes ? `<h3>Considerações finais</h3><p>${escapeHTML(consideracoes)}</p>` : ""}

<div class="sign">
  <div>CACGEAF/DACAF, em ${ASSINATURA.data}</div>
  <div class="name">${ASSINATURA.auditor}</div>
  <div>Analista de Controle Externo – TC ${ASSINATURA.tcAuditor}</div>
  <div class="name">${ASSINATURA.coordenador}</div>
  <div>Coordenador da CACGEAF – TC ${ASSINATURA.tcCoordenador}</div>
</div>

<div class="footer">
  Tribunal de Contas do Estado de Minas Gerais<br/>
  Diretoria de Análise de Contas e Auditoria Financeira<br/>
  Coordenadoria de Análise de Contas de Gestão do Estado e de Auditoria Financeira
</div>
</body></html>`);
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  }

  useEffect(() => {
    CONCLUSAO_PDF_REF.fn = gerarPdfCompleto;
    return () => {
      CONCLUSAO_PDF_REF.fn = null;
    };
  });

  const introRest = CONCLUSAO_MAX - intro.length;
  const entRest = CONCLUSAO_MAX - entendimento.length;
  const consRest = CONCLUSAO_MAX - consideracoes.length;

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
        <span className="border-b-2 border-[#0D1B2A] pb-1">Conclusão:</span>
      </h2>

      {readOnly && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ⚠️ Este processo possui Trânsito e Julgado. Nenhuma alteração é permitida.
        </div>
      )}

      {/* Bloco 1 - Introdução */}
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-semibold">
          Texto introdutório da conclusão
        </Label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value.slice(0, CONCLUSAO_MAX))}
          disabled={readOnly}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/40 disabled:bg-muted disabled:opacity-70"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {introRest} caracteres restantes
        </div>
      </div>

      {/* Bloco 2 - Julgamento */}
      <div className="mb-6 rounded-md border border-border bg-slate-50 p-4">
        <Label className="mb-2 block text-sm font-semibold">
          Julgamento das contas
        </Label>
        <div className="mb-2 text-sm">As contas devem ser julgadas:</div>
        <div className="space-y-2">
          {JULGAMENTO_OPTS.map((o) => (
            <label
              key={o.v}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="julgamento"
                value={o.v}
                checked={julgamento === o.v}
                onChange={() => setJulgamento(o.v)}
                disabled={readOnly}
                className="h-4 w-4 accent-[#1A56DB]"
              />
              <span className="font-medium">{o.label}</span>
              <span className="text-xs text-muted-foreground">→ {o.artigo}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-border bg-white p-3 text-sm leading-relaxed text-foreground">
          {textoJulgamento}
        </div>
      </div>

      {/* Bloco 3 - Apontamentos */}
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-semibold">
          Apontamentos e propostas de encaminhamento
        </Label>
        <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-[#1A56DB]">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tabela preenchida automaticamente com os apontamentos marcados como
            "Inserir no Relatório" em cada submenu.
          </span>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Tópico</th>
                <th className="px-3 py-2 text-left font-semibold">Apontamento</th>
                <th className="px-3 py-2 text-left font-semibold">
                  Proposta de encaminhamento
                </th>
              </tr>
            </thead>
            <tbody>
              {CONCLUSAO_APONTAMENTOS.map((a, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  <td className="border-t border-border px-3 py-2 align-top font-medium">
                    {a.topico}
                  </td>
                  <td className="border-t border-border px-3 py-2 align-top">
                    {a.apontamento}
                  </td>
                  <td className="border-t border-border px-3 py-2 align-top">
                    {a.encaminhamento}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloco 4 - Entendimento */}
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-semibold">
          Entendimento técnico:
        </Label>
        <textarea
          value={entendimento}
          onChange={(e) =>
            setEntendimento(e.target.value.slice(0, CONCLUSAO_MAX))
          }
          disabled={readOnly}
          rows={5}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/40 disabled:bg-muted disabled:opacity-70"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {entRest} caracteres restantes
        </div>
      </div>

      {/* Bloco 5 - Considerações finais */}
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-semibold">
          Considerações finais:
        </Label>
        <textarea
          value={consideracoes}
          onChange={(e) =>
            setConsideracoes(e.target.value.slice(0, CONCLUSAO_MAX))
          }
          disabled={readOnly}
          rows={5}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/40 disabled:bg-muted disabled:opacity-70"
        />
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {consRest} caracteres restantes
        </div>
      </div>

      {/* Bloco 6 - Assinatura */}
      <div className="mt-8 rounded-md border border-border bg-white p-6 text-center text-sm leading-relaxed">
        <p className="mb-6">CACGEAF/DACAF, em {ASSINATURA.data}</p>
        <p className="font-semibold">{ASSINATURA.auditor}</p>
        <p className="mb-6 text-muted-foreground">
          Analista de Controle Externo – TC {ASSINATURA.tcAuditor}
        </p>
        <p className="font-semibold">{ASSINATURA.coordenador}</p>
        <p className="text-muted-foreground">
          Coordenador da CACGEAF – TC {ASSINATURA.tcCoordenador}
        </p>
      </div>
    </>
  );
}
