import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, CheckCircle2, CopyPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ANOS,
  GRUPOS_ENTIDADE,
  GRUPO_ABREVIADO,
  PODERES,
  JURISDICIONADOS,
  getJurisdicionado,
  type AtributosExercicio,
  type GrupoEntidade,
  type Poder,
} from "@/lib/pce-data";
import { useJurisdicionados } from "@/lib/jurisdicionados-store";
import { useAtribuicoes } from "@/lib/atribuicoes";

export const Route = createFileRoute("/jurisdicionados")({
  component: JurisdicionadosPage,
});

function JurisdicionadosPage() {
  const { perfil } = useAtribuicoes();
  const canEdit = perfil === "Coordenador";
  const { getAtributos, getRegistro, copiarExercicioAnterior, confirmar } =
    useJurisdicionados();

  const [ano, setAno] = useState("2025");
  const [editando, setEditando] = useState<string | null>(null);

  // Jurisdicionados que ainda não possuem cadastro próprio no ano selecionado.
  const semCadastro = useMemo(
    () =>
      JURISDICIONADOS.filter((j) => !getRegistro(j.nome, ano)).length,
    [getRegistro, ano]
  );

  const anoAnterior = String(Number(ano) - 1);

  function copiar() {
    const n = copiarExercicioAnterior(ano);
    if (n > 0) {
      toast.success(`Copiado do exercício ${anoAnterior}`, {
        description: `${n} jurisdicionado(s) preenchido(s) — marcados como pendentes de confirmação.`,
      });
    } else {
      toast.info("Nada a copiar", {
        description: `Todos os jurisdicionados já possuem cadastro em ${ano}.`,
      });
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1A56DB]/10 text-[#1A56DB]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Jurisdicionados
            </h1>
            <p className="text-sm text-muted-foreground">
              Atributos por exercício. As alterações valem para todos os
              processos do órgão no exercício selecionado.
            </p>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Exercício
            </Label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canEdit && semCadastro > 0 && (
            <Button variant="outline" className="gap-1.5" onClick={copiar}>
              <CopyPlus className="h-4 w-4" /> Copiar do exercício {anoAnterior}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th>Sigla</Th>
                <Th>Jurisdicionado</Th>
                <Th>Grupo de Entidade</Th>
                <Th>Poder</Th>
                <Th>Previdenciária</Th>
                <Th>Situação</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {JURISDICIONADOS.map((j) => {
                const reg = getRegistro(j.nome, ano);
                const a = getAtributos(j.nome, ano);
                const status: "cadastrado" | "pendente" | "herdado" = reg
                  ? reg.pendente
                    ? "pendente"
                    : "cadastrado"
                  : "herdado";
                return (
                  <tr
                    key={j.nome}
                    className="border-t border-border bg-white align-middle hover:bg-blue-50/40"
                  >
                    <td className="px-3 py-2.5 font-semibold text-foreground">
                      {j.sigla}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {j.nome}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="secondary">
                        {GRUPO_ABREVIADO[a.grupoEntidade]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-foreground">{a.poder}</td>
                    <td className="px-3 py-2.5">
                      {a.entidadePrevidenciaria ? "Sim" : "Não"}
                    </td>
                    <td className="px-3 py-2.5">
                      {status === "cadastrado" && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Cadastrado
                        </span>
                      )}
                      {status === "pendente" && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Pendente
                        </span>
                      )}
                      {status === "herdado" && (
                        <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {a.herdadoDe
                            ? `Herdado de ${a.herdadoDe}`
                            : "Não cadastrado"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setEditando(j.nome)}
                        >
                          <Pencil className="h-4 w-4" />
                          {canEdit ? "Editar" : "Ver"}
                        </Button>
                        {canEdit && status === "pendente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-green-700"
                            onClick={() => {
                              confirmar(j.nome, ano);
                              toast.success("Cadastro confirmado", {
                                description: `${j.sigla} — Exercício ${ano}.`,
                              });
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" /> Confirmar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AtributosEditDialog
        orgao={editando}
        ano={ano}
        canEdit={canEdit}
        onClose={() => setEditando(null)}
      />
    </main>
  );
}

function AtributosEditDialog({
  orgao,
  ano,
  canEdit,
  onClose,
}: {
  orgao: string | null;
  ano: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const { getAtributos, getRegistro, setAtributos } = useJurisdicionados();
  const [draft, setDraft] = useState<AtributosExercicio | null>(null);
  const [herdadoDe, setHerdadoDe] = useState<string | undefined>();
  const [pendente, setPendente] = useState(false);

  const key = orgao ? `${orgao}|${ano}` : null;
  useEffect(() => {
    if (!orgao) {
      setDraft(null);
      setHerdadoDe(undefined);
      setPendente(false);
      return;
    }
    const a = getAtributos(orgao, ano);
    const reg = getRegistro(orgao, ano);
    setDraft({
      grupoEntidade: a.grupoEntidade,
      entidadePrevidenciaria: a.entidadePrevidenciaria,
      poder: a.poder,
    });
    setHerdadoDe(a.herdadoDe);
    setPendente(!!reg?.pendente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const sigla = orgao ? getJurisdicionado(orgao).sigla : "";
  const titulo = orgao ? `${sigla || orgao} — Exercício ${ano}` : "";

  function salvar() {
    if (!orgao || !draft) return;
    setAtributos(orgao, ano, draft);
    toast.success("Atributos atualizados", {
      description: `${sigla || orgao} — Exercício ${ano}. Alterações valem para todos os processos deste órgão neste exercício.`,
    });
    onClose();
  }

  return (
    <Dialog open={!!orgao} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {orgao}
            {canEdit && (
              <span className="mt-1 block text-amber-600">
                Alterações valem para todos os processos deste órgão neste
                exercício.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {(herdadoDe || pendente) && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {pendente
              ? "Dados copiados do exercício anterior — pendentes de confirmação."
              : `Atributos herdados de ${herdadoDe} — confirme os dados.`}
          </div>
        )}

        {draft && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Grupo de Entidade</Label>
              {canEdit ? (
                <Select
                  value={draft.grupoEntidade}
                  onValueChange={(v) =>
                    setDraft((d) =>
                      d ? { ...d, grupoEntidade: v as GrupoEntidade } : d
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_ENTIDADE.map((g) => (
                      <SelectItem key={g} value={g} className="max-w-[28rem]">
                        {GRUPO_ABREVIADO[g]} — {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground">
                  <Badge variant="secondary" className="mr-2">
                    {GRUPO_ABREVIADO[draft.grupoEntidade]}
                  </Badge>
                  {draft.grupoEntidade}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Poder</Label>
              {canEdit ? (
                <Select
                  value={draft.poder}
                  onValueChange={(v) =>
                    setDraft((d) => (d ? { ...d, poder: v as Poder } : d))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PODERES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-foreground">{draft.poder}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
              <div>
                <Label htmlFor="prev-switch">Entidade previdenciária</Label>
                <p className="text-xs text-muted-foreground">
                  Habilita o tópico "Receitas" na análise.
                </p>
              </div>
              <Switch
                id="prev-switch"
                disabled={!canEdit}
                checked={draft.entidadePrevidenciaria}
                onCheckedChange={(c) =>
                  setDraft((d) => (d ? { ...d, entidadePrevidenciaria: c } : d))
                }
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {canEdit ? "Cancelar" : "Fechar"}
          </Button>
          {canEdit && (
            <Button
              className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              onClick={salvar}
            >
              {pendente ? "Confirmar e salvar" : "Salvar"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}
