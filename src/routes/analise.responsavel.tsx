import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, FileText, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/analise/responsavel")({
  component: ResponsavelPage,
});

type SubItem = {
  to: string;
  label: string;
  hasActions?: boolean;
};

type SubGroup = {
  label: string;
  items: SubItem[];
  expanded?: boolean;
};

const GROUPS: SubGroup[] = [
  { label: "PCE's Anteriores", items: [] },
  { label: "Demais Processos", items: [] },
  {
    label: "PCE",
    expanded: true,
    items: [
      { to: "/analise/responsavel", label: "Responsável", hasActions: true },
      { to: "/analise/consideracoes", label: "Consid. Gerais", hasActions: true },
      { to: "/analise/receitas", label: "Receitas", hasActions: true },
      { to: "/analise/credito-inicial", label: "Crédito inicial autorizado" },
      { to: "/analise/programas", label: "Programas", hasActions: true },
      { to: "/analise/credito-despesas-prg", label: "Crédito e Despesas por prg" },
      { to: "/analise/dsp-dotacao", label: "Dsp por dot. Orçamentária" },
      { to: "/analise/restos-pagar", label: "Restos a pagar", hasActions: true },
      { to: "/analise/controle-interno", label: "Controle Interno" },
      { to: "/analise/outras-inconformidades", label: "Outras Inconformidades" },
      { to: "/analise/conclusao", label: "Conclusão" },
    ],
  },
];

const MAX = 4000;

function ResponsavelPage() {
  const [texto, setTexto] = useState("");
  const [incluir, setIncluir] = useState(true);
  const restantes = MAX - texto.length;

  const activePath = "/analise/responsavel";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Cabeçalho fixo do processo */}
      <header className="sticky top-0 z-30 border-b-2 border-[#1A56DB] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 gap-y-2 px-6 py-3 text-sm">
          <InfoCell label="Processo" value="0004/2025" />
          <Divider />
          <InfoCell label="Órgão" value="Secretaria de Estado de Fazenda (SEF)" />
          <Divider />
          <InfoCell label="Relator" value="CONS. JOÃO DA SILVA" />
          <Divider />
          <InfoCell label="Auditor" value="Auditor 01" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-6 py-6">
        {/* Submenu lateral */}
        <aside className="w-[260px] shrink-0">
          <nav className="rounded-lg border border-border bg-card shadow-sm">
            <ul className="py-2">
              {GROUPS.map((g) => (
                <li key={g.label} className="px-2">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#0D1B2A]">
                    {g.label}
                  </div>
                  {g.expanded && g.items.length > 0 && (
                    <ul className="mb-2 space-y-0.5 border-l border-border pl-2">
                      {g.items.map((it) => {
                        const active = it.to === activePath;
                        return (
                          <li key={it.to}>
                            <Link
                              to={it.to as any}
                              className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                                active
                                  ? "bg-[#1A56DB] font-medium text-white"
                                  : "text-foreground hover:bg-blue-50"
                              }`}
                            >
                              <span className="truncate">{it.label}</span>
                              {it.hasActions && (
                                <Zap
                                  className={`h-4 w-4 shrink-0 ${
                                    active ? "text-yellow-300" : "text-yellow-500"
                                  }`}
                                  fill="currentColor"
                                />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Conteúdo */}
        <section className="min-w-0 flex-1">
          <h1 className="text-center text-2xl font-semibold text-foreground">
            Processo: 0004/2025
          </h1>

          <div className="mx-auto mt-4 max-w-3xl space-y-2 text-center text-sm">
            <p>
              <span className="font-semibold">Grupo:</span> ÓRGÃOS DOS PODERES
              LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA
              PÚBLICA
            </p>
            <p>
              <span className="font-semibold">Órgão:</span> Secretaria de Estado
              de Fazenda (SEF)
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
              onChange={(e) =>
                setTexto(e.target.value.slice(0, MAX))
              }
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

          {/* Botões de ação */}
          <div className="mt-8 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
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
            <Button
              type="button"
              className="gap-2 bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
            >
              <FileText className="h-4 w-4" /> Gerar PDF
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
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
