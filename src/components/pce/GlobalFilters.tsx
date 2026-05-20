import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";
import { ANOS, ORGAOS, TIPOS_ORGAO, RELATORES } from "@/lib/pce-data";
import { useState } from "react";

export type Filters = {
  ano: string;
  orgao: string;
  tipoOrgao: string;
  relator: string;
};

const DEFAULT: Filters = { ano: "all", orgao: "all", tipoOrgao: "all", relator: "all" };

export function GlobalFilters({ onApply }: { onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState<Filters>(DEFAULT);

  const set = (k: keyof Filters, v: string) => setDraft((p) => ({ ...p, [k]: v }));

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <Field label="Ano de exercício">
          <Select value={draft.ano} onValueChange={(v) => set("ano", v)}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ANOS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Órgão">
          <Select value={draft.orgao} onValueChange={(v) => set("orgao", v)}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ORGAOS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Tipo de órgão">
          <Select value={draft.tipoOrgao} onValueChange={(v) => set("tipoOrgao", v)}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_ORGAO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Relator">
          <Select value={draft.relator} onValueChange={(v) => set("relator", v)}>
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RELATORES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-end gap-2 md:col-span-4 lg:col-span-2">
          <Button onClick={() => onApply(draft)} className="flex-1 gap-2">
            <Filter className="h-4 w-4" /> Aplicar filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => { setDraft(DEFAULT); onApply(DEFAULT); }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
