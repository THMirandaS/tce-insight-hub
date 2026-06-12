import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Ban, Plus, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAtribuicoes, type Perfil, type Usuario } from "@/lib/atribuicoes";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

const PERFIS: Perfil[] = ["Coordenador", "Executor", "Revisor"];

type Draft = {
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

const DRAFT_VAZIO: Draft = {
  nome: "",
  email: "",
  perfil: "Executor",
  ativo: true,
};

function UsuariosPage() {
  const { perfil, usuarios, addUsuario, updateUsuario } = useAtribuicoes();
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [criando, setCriando] = useState(false);
  const [draft, setDraft] = useState<Draft>(DRAFT_VAZIO);

  // Acesso restrito ao Coordenador.
  if (perfil !== "Coordenador") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          Acesso restrito
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A gestão de usuários está disponível apenas para o perfil
          Coordenador.
        </p>
      </main>
    );
  }

  const abrirNovo = () => {
    setDraft(DRAFT_VAZIO);
    setCriando(true);
  };

  const abrirEdicao = (u: Usuario) => {
    setDraft({
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      ativo: u.ativo,
    });
    setEditando(u);
  };

  const salvar = () => {
    if (!draft.nome.trim() || !draft.email.trim()) return;
    if (editando) {
      updateUsuario(editando.id, draft);
      setEditando(null);
    } else {
      addUsuario(draft);
      setCriando(false);
    }
    setDraft(DRAFT_VAZIO);
  };

  const dialogAberto = criando || editando !== null;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1A56DB]/10 text-[#1A56DB]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie usuários e seus perfis de acesso ao sistema.
            </p>
          </div>
        </div>
        <Button className="gap-1.5" onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Perfil</Th>
                <Th>Situação</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border bg-white align-middle hover:bg-blue-50/40"
                >
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    {u.nome}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-3 py-2.5">
                    <Select
                      value={u.perfil}
                      onValueChange={(v) =>
                        updateUsuario(u.id, { perfil: v as Perfil })
                      }
                    >
                      <SelectTrigger className="h-9 w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFIS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2.5">
                    {u.ativo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => abrirEdicao(u)}
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={dialogAberto}
        onOpenChange={(open) => {
          if (!open) {
            setCriando(false);
            setEditando(null);
            setDraft(DRAFT_VAZIO);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
            <DialogDescription>
              O perfil é único por usuário e global no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={draft.nome}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, nome: e.target.value }))
                }
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={draft.email}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, email: e.target.value }))
                }
                placeholder="nome@tce.gov.br"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select
                  value={draft.perfil}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, perfil: v as Perfil }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERFIS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Situação</Label>
                <Select
                  value={draft.ativo ? "ativo" : "inativo"}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, ativo: v === "ativo" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCriando(false);
                setEditando(null);
                setDraft(DRAFT_VAZIO);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={salvar}
              disabled={!draft.nome.trim() || !draft.email.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}
