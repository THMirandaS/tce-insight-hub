import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCcw,
  Layers,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJurisdicionados } from "@/lib/jurisdicionados-store";
import {
  GRUPOS_ENTIDADE,
  GRUPO_ABREVIADO,
  PODERES,
  getJurisdicionado,
  type AtributosExercicio,
  type GrupoEntidade,
  type Poder,
} from "@/lib/pce-data";
import {
  useConsolidacao,
  type ProcessoConsolidacao,
  type ConsolStatus,
} from "@/lib/consolidacao-store";

export const Route = createFileRoute("/consolidacao")({
  component: ConsolidacaoPage,
});

const GRUPO_PODERES =
  "ÓRGÃOS DOS PODERES LEGISLATIVO E JUDICIÁRIO, DO MINISTÉRIO PÚBLICO E DA DEFENSORIA PÚBLICA";

const STATUS_BADGE: Record<ConsolStatus, string> = {
  Pendente: "bg-gray-200 text-gray-800",
  Processando: "bg-blue-100 text-blue-800",
  Erro: "bg-red-100 text-red-800",
  Concluída: "bg-green-100 text-green-800",
};

// Opções do filtro de status. "Todas" exibe todos os processos.
const STATUS_FILTROS = [
  "Todas",
  "Pendente",
  "Processando",
  "Erro",
  "Concluída",
] as const;
type StatusFiltro = (typeof STATUS_FILTROS)[number];

function ConsolidacaoPage() {
  const { processos, consolidar } = useConsolidacao();
  const { getRegistro } = useJurisdicionados();

  // Alvo do diálogo de confirmação dos atributos (apenas Coordenador).
  const [alvo, setAlvo] = useState<ProcessoConsolidacao | null>(null);
  const [filtro, setFiltro] = useState<StatusFiltro>("Todas");

  // Atributos do exercício estão confirmados quando há registro explícito e
  // ele não está pendente de confirmação.
  const atributosConfirmados = (orgao: string, ano: string) => {
    const reg = getRegistro(orgao, ano);
    return !!reg && !reg.pendente;
  };

  const visiveis = useMemo(
    () =>
      filtro === "Todas"
        ? processos
        : processos.filter((p) => p.status === filtro),
    [processos, filtro]
  );




  return (
    <main className="mx-auto max-w-[1600px] px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Consolidação</h1>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:max-w-xs">
        <FilterField label="Status da Consolidação">
          <Select
            value={filtro}
            onValueChange={(v) => setFiltro(v as StatusFiltro)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTROS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th>Órgão</Th>
                <Th>Nº Processo</Th>
                <Th>Exercício</Th>
                <Th>Relator</Th>
                <Th>Data de Autuação</Th>
                <Th>Classificação</Th>
                <Th>Status da Consolidação</Th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((p) => (
                <LinhaConsolidacao
                  key={p.numero}
                  p={p}
                  confirmado={atributosConfirmados(p.orgao, p.exercicio)}
                  onAbrirConfirmacao={() => setAlvo(p)}
                  onConsolidarDireto={() => consolidar(p.numero)}
                />
              ))}
              {visiveis.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-12 text-center text-muted-foreground"
                  >
                    Nenhum processo para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmacaoDialog
        alvo={alvo}
        onClose={() => setAlvo(null)}
        onConsolidar={(numero) => consolidar(numero)}
      />
    </main>
  );
}


function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
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
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function LinhaConsolidacao({
  p,
  confirmado,
  onAbrirConfirmacao,
  onConsolidarDireto,
}: {
  p: ProcessoConsolidacao;
  confirmado: boolean;
  onAbrirConfirmacao: () => void;
  onConsolidarDireto: () => void;
}) {
  const { getAtributos } = useJurisdicionados();
  const processando = p.status === "Processando";
  const sigla = getJurisdicionado(p.orgao).sigla;
  const attrs = getAtributos(p.orgao, p.exercicio);

  return (
    <tr className="border-t border-border bg-white hover:bg-blue-50">
      <td className="px-3 py-2.5 font-medium text-foreground">
        {p.orgao}
        {sigla ? <span className="text-muted-foreground"> ({sigla})</span> : null}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-foreground">
        {p.numero}
      </td>
      <td className="px-3 py-2.5 text-foreground">{p.exercicio}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
        {p.relator}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
        {p.dataAutuacao}
      </td>
      <td className="px-3 py-2.5">
        <Badge variant="secondary" className="w-fit">
          {GRUPO_ABREVIADO[attrs.grupoEntidade]}
        </Badge>
      </td>
      <td className="px-3 py-2.5">
        {processando ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando
          </span>
        ) : p.status === "Concluída" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Concluída
          </span>
        ) : (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}
          >
            {p.status}
          </span>
        )}
        {p.status === "Erro" && (
          <p className="mt-1 text-[11px] text-red-700">
            Falha ao consolidar os dados do processo.
          </p>
        )}
        {p.status === "Concluída" && p.dataConsolidacao && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Consolidado em {p.dataConsolidacao}
          </p>
        )}
      </td>

      <td className="px-3 py-2.5 text-right">
        <AcaoConsolidar
          status={p.status}
          processando={processando}
          analiseId={p.analiseId}
          confirmado={confirmado}
          onAbrirConfirmacao={onAbrirConfirmacao}
          onConsolidarDireto={onConsolidarDireto}
        />
      </td>

    </tr>
  );
}

function AcaoConsolidar({
  status,
  processando,
  analiseId,
  confirmado,
  onAbrirConfirmacao,
  onConsolidarDireto,
}: {
  status: ConsolStatus;
  processando: boolean;
  analiseId?: string;
  confirmado: boolean;
  onAbrirConfirmacao: () => void;
  onConsolidarDireto: () => void;
}) {
  const label =
    status === "Erro" ? (
      <>
        <RefreshCcw className="h-3.5 w-3.5" /> Tentar novamente
      </>
    ) : (
      <>
        <Layers className="h-3.5 w-3.5" /> Consolidar
      </>
    );

  // Concluída: consolidação é única — sem botão Consolidar/Reconsolidar.
  // No lugar, link para a análise gerada.
  if (status === "Concluída") {
    if (!analiseId) {
      return <span className="text-muted-foreground">—</span>;
    }
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 px-3 text-xs"
      >
        <Link to="/analises/$id" params={{ id: analiseId }}>
          <Eye className="h-3.5 w-3.5" /> Ver análise
        </Link>
      </Button>
    );
  }

  if (processando) {
    return (
      <Button
        size="sm"
        disabled
        className="h-8 gap-1.5 bg-[#1A56DB] px-3 text-xs text-white disabled:opacity-60"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processando
      </Button>
    );
  }


  // O botão Consolidar NUNCA fica bloqueado. Ao clicar:
  // - Status Erro: dispara o reprocessamento direto (atributos já confirmados).
  // - Atributos já confirmados: dispara a consolidação direto.
  // - Atributos ainda não confirmados: abre o diálogo de confirmação.
  const handleClick =
    status === "Erro" || confirmado ? onConsolidarDireto : onAbrirConfirmacao;

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className="h-8 gap-1.5 bg-[#1A56DB] px-3 text-xs text-white hover:bg-[#1A56DB]/90"
    >
      {label}
    </Button>
  );
}

// Passo de confirmação dos atributos do jurisdicionado para o ANO DE
// REFERÊNCIA do processo. Só após confirmar é possível gerar a análise; ao
// gerar, os atributos são gravados no exercício e a análise nasce com os
// tópicos corretos.
function ConfirmacaoDialog({
  alvo,
  onClose,
  onConsolidar,
}: {
  alvo: ProcessoConsolidacao | null;
  onClose: () => void;
  onConsolidar: (numero: string) => Promise<void> | void;
}) {
  const { getAtributos, setAtributos } = useJurisdicionados();
  const [draft, setDraft] = useState<AtributosExercicio | null>(null);
  const [herdadoDe, setHerdadoDe] = useState<string | undefined>();
  const [confirmado, setConfirmado] = useState(false);
  const [gerando, setGerando] = useState(false);

  const targetKey = alvo ? `${alvo.orgao}|${alvo.exercicio}` : null;
  useEffect(() => {
    if (!alvo) {
      setDraft(null);
      setHerdadoDe(undefined);
      setConfirmado(false);
      setGerando(false);
      return;
    }
    const a = getAtributos(alvo.orgao, alvo.exercicio);
    setDraft({
      grupoEntidade: a.grupoEntidade,
      entidadePrevidenciaria: a.entidadePrevidenciaria,
      poder: a.poder,
    });
    setHerdadoDe(a.herdadoDe);
    setConfirmado(false);
    setGerando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  const sigla = alvo ? getJurisdicionado(alvo.orgao).sigla : "";
  const titulo = alvo
    ? `Consolidar — ${sigla || alvo.orgao} • Exercício ${alvo.exercicio}`
    : "";

  async function gerarAnalise() {
    if (!alvo || !draft || !confirmado) return;
    setGerando(true);
    // Grava a classificação no exercício (vale para todos os processos deste
    // órgão neste exercício) e dispara a geração da análise.
    setAtributos(alvo.orgao, alvo.exercicio, draft);
    toast.success("Classificação confirmada", {
      description: `${sigla || alvo.orgao} — Exercício ${alvo.exercicio}. Gerando a análise…`,
    });
    onClose();
    await onConsolidar(alvo.numero);
  }

  return (
    <Dialog open={!!alvo} onOpenChange={(o) => !o && !gerando && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {alvo?.orgao}
            <span className="mt-1 block text-amber-600">
              Confirme a classificação do jurisdicionado para o exercício. Ela
              define os tópicos da análise e vale para todos os processos deste
              órgão neste exercício.
            </span>
          </DialogDescription>
        </DialogHeader>

        {herdadoDe && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Atributos herdados de {herdadoDe} — confirme os dados.
          </div>
        )}

        {draft && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Grupo de Entidade</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label>Poder</Label>
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
                checked={draft.entidadePrevidenciaria}
                onCheckedChange={(c) =>
                  setDraft((d) => (d ? { ...d, entidadePrevidenciaria: c } : d))
                }
              />
            </div>

            <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">
                Tópicos resultantes
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>
                  Receitas:{" "}
                  {draft.entidadePrevidenciaria ? "incluído" : "não incluído"}
                </li>
                <li>
                  Despesas com pessoal:{" "}
                  {draft.grupoEntidade === GRUPO_PODERES
                    ? "incluído"
                    : "não incluído"}
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2.5 text-sm">
              <Checkbox
                checked={confirmado}
                onCheckedChange={(c) => setConfirmado(c === true)}
                className="mt-0.5"
              />
              <span className="text-foreground">
                Confirmo a classificação do jurisdicionado para o exercício{" "}
                {alvo?.exercicio}.
              </span>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={gerando}>
            Cancelar
          </Button>
          <Button
            className="gap-2 bg-[#1A56DB] hover:bg-[#1A56DB]/90"
            disabled={!confirmado || gerando}
            onClick={gerarAnalise}
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
              </>
            ) : (
              <>
                <Layers className="h-4 w-4" /> Gerar análise
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
