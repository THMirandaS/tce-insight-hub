import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Zap,
  FileText,
  Save,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ALL_ROWS } from "./analises";

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
                              {it.hasActions && (
                                <Zap
                                  className={`h-4 w-4 shrink-0 ${
                                    isActive ? "text-yellow-300" : "text-yellow-400"
                                  }`}
                                  fill="currentColor"
                                />
                              )}
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
            {active !== "anteriores" && (
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

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0D1B2A] text-white">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Gestor
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                Período
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white">
              <td className="px-4 py-2.5">Gestor 01</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                01/01/2025 a 31/10/2025
              </td>
            </tr>
            <tr className="bg-gray-50/60">
              <td className="px-4 py-2.5">Gestor 01</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                01/11/2025 a 31/12/2025
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
              <div className="mt-4 rounded-md border border-[#1A56DB] bg-[#EFF6FF] p-4">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#1A56DB] px-2.5 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" fill="currentColor" />
                  Resumo IA
                </div>
                <p className="text-sm leading-relaxed text-[#0D1B2A]">
                  {p.resumoIA}
                </p>
              </div>
            )}
          </article>
        ))}
      </div>
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
