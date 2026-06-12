import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserCog, Eye, Ban, ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AUDITORES } from "@/lib/pce-data";
import { useAtribuicoes } from "@/lib/atribuicoes";
import { ALL_ROWS } from "@/routes/analises";

export const Route = createFileRoute("/atribuicoes")({
  component: AtribuicoesPage,
});

const NAO = "__none__";

function AtribuicoesPage() {
  const navigate = useNavigate();
  const { perfil, atribuicoes, setAtribuicao } = useAtribuicoes();
  const [erro, setErro] = useState<{ id: string; msg: string } | null>(null);

  const rows = useMemo(() => ALL_ROWS, []);

  // Acesso restrito ao Coordenador.
  if (perfil !== "Coordenador") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          Acesso restrito
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A atribuição de análises está disponível apenas para o perfil
          Coordenador.
        </p>
      </main>
    );
  }

  const handleSet = (
    id: string,
    campo: "executor" | "revisor",
    valor: string
  ) => {
    const atual = atribuicoes[id] ?? { executor: null, revisor: null };
    const novo = { ...atual, [campo]: valor === NAO ? null : valor };
    if (novo.executor && novo.revisor && novo.executor === novo.revisor) {
      setErro({
        id,
        msg: "Executor e Revisor não podem ser a mesma pessoa.",
      });
      return;
    }
    setErro(null);
    setAtribuicao(id, novo);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1A56DB]/10 text-[#1A56DB]">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Atribuição de Análises
            </h1>
            <p className="text-sm text-muted-foreground">
              Defina o Executor e o Revisor de cada processo. O Coordenador é o
              validador do processo.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0D1B2A] text-white">
                <tr>
                  <Th>Processo</Th>
                  <Th>Jurisdicionado</Th>
                  <Th>Ano de Referência</Th>
                  <Th>Tipo de Análise</Th>
                  <Th>Executor</Th>
                  <Th>Revisor</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const a = atribuicoes[r.id] ?? {
                    executor: null,
                    revisor: null,
                  };
                  const semExecutor = !a.executor;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border bg-white align-middle hover:bg-blue-50/40"
                    >
                      <td className="px-3 py-2.5 font-mono text-foreground">
                        {r.numero}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">{r.orgao}</td>
                      <td className="px-3 py-2.5 text-foreground">
                        {r.exercicio}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            r.tipoAnalise === "Análise de Defesa"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.tipoAnalise}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <PessoaSelect
                          value={a.executor}
                          placeholder="Atribuir executor"
                          onChange={(v) => handleSet(r.id, "executor", v)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <PessoaSelect
                          value={a.revisor}
                          placeholder="Atribuir revisor"
                          onChange={(v) => handleSet(r.id, "revisor", v)}
                        />
                        {erro?.id === r.id && (
                          <p className="mt-1 text-xs font-medium text-destructive">
                            {erro.msg}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {semExecutor ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Não atribuído
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <ShieldCheck className="h-3.5 w-3.5" /> Atribuído
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {semExecutor ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled
                                  className="gap-1.5"
                                >
                                  <Eye className="h-4 w-4" /> Abrir
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Atribua um executor para abrir a análise.
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() =>
                              navigate({
                                to: "/analises/$id",
                                params: { id: r.id },
                              })
                            }
                          >
                            <Eye className="h-4 w-4" /> Abrir
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}

function PessoaSelect({
  value,
  placeholder,
  onChange,
}: {
  value: string | null;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value ?? NAO} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NAO}>— Não atribuído —</SelectItem>
        {AUDITORES.map((a) => (
          <SelectItem key={a} value={a}>
            {a}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}
