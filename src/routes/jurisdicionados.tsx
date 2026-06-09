import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GRUPOS_ENTIDADE,
  GRUPO_ABREVIADO,
  JURISDICIONADOS,
  PODERES,
  type GrupoEntidade,
  type Jurisdicionado,
  type Poder,
} from "@/lib/pce-data";

export const Route = createFileRoute("/jurisdicionados")({
  component: JurisdicionadosPage,
});

function JurisdicionadosPage() {
  // Persistência apenas em memória (estado React).
  const [lista, setLista] = useState<Jurisdicionado[]>(() =>
    JURISDICIONADOS.map((j) => ({ ...j }))
  );
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<Jurisdicionado | null>(null);

  const editing = useMemo(
    () => (editIndex !== null ? lista[editIndex] : null),
    [editIndex, lista]
  );

  function openEdit(index: number) {
    setEditIndex(index);
    setDraft({ ...lista[index] });
  }

  function closeEdit() {
    setEditIndex(null);
    setDraft(null);
  }

  function salvar() {
    if (editIndex === null || !draft) return;
    setLista((prev) =>
      prev.map((j, i) => (i === editIndex ? { ...draft } : j))
    );
    toast.success("Jurisdicionado atualizado", {
      description: `${draft.nome} — alterações salvas em memória.`,
    });
    closeEdit();
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8 pb-32">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Jurisdicionados</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro de atributos dos jurisdicionados — Perfil:{" "}
          <span className="font-medium text-foreground">Coordenador</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0D1B2A] hover:bg-[#0D1B2A]">
                <TableHead className="text-white">Órgão</TableHead>
                <TableHead className="text-white">Sigla</TableHead>
                <TableHead className="text-white">Grupo de Entidade</TableHead>
                <TableHead className="text-white">Previdenciária</TableHead>
                <TableHead className="text-white">Poder</TableHead>
                <TableHead className="w-16 text-white text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((j, i) => (
                <TableRow key={j.nome} className={i % 2 === 1 ? "bg-muted/40" : ""}>
                  <TableCell className="font-medium text-foreground">{j.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{j.sigla}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {GRUPO_ABREVIADO[j.grupoEntidade]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {j.entidadePrevidenciaria ? (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{j.poder}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(i)}
                      aria-label={`Editar ${j.nome}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={editIndex !== null} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar jurisdicionado</DialogTitle>
            <DialogDescription>{editing?.nome}</DialogDescription>
          </DialogHeader>

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
                    setDraft((d) =>
                      d ? { ...d, entidadePrevidenciaria: c } : d
                    )
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button
              className="bg-[#1A56DB] hover:bg-[#1A56DB]/90"
              onClick={salvar}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
