import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Ban, Plane, Undo2, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAtribuicoes, type Usuario } from "@/lib/atribuicoes";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const {
    usuarios,
    usuarioAtivoId,
    entrarDeFerias,
    devolverCoordenacao,
  } = useAtribuicoes();
  const [feriasDe, setFeriasDe] = useState<Usuario | null>(null);
  const [substitutoId, setSubstitutoId] = useState<string>("");

  // Usuário logado.
  const ativo = usuarios.find((u) => u.id === usuarioAtivoId) ?? null;
  // Coordenador efetivo = perfil Coordenador e não está de férias.
  const coordenadorAtual =
    usuarios.find((u) => u.perfil === "Coordenador" && !u.emFerias) ?? null;

  // Acesso restrito ao Coordenador efetivo (inclui o temporário).
  const temAcesso =
    !!ativo && ativo.perfil === "Coordenador" && !ativo.emFerias;

  // Candidatos a substituto: Executor ou Revisor (perfil de trabalho atual).
  const candidatos = useMemo(
    () =>
      usuarios.filter(
        (u) => u.perfil === "Executor" || u.perfil === "Revisor"
      ),
    [usuarios]
  );

  if (!temAcesso) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          Acesso restrito
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A gestão de usuários está disponível apenas para o Coordenador
          (incluindo o coordenador temporário).
        </p>
      </main>
    );
  }

  const confirmarFerias = () => {
    if (!feriasDe || !substitutoId) return;
    entrarDeFerias(feriasDe.id, substitutoId);
    setFeriasDe(null);
    setSubstitutoId("");
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#1A56DB]/10 text-[#1A56DB]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Lista sincronizada do AD (somente leitura).
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-[#1A56DB]/20 bg-[#1A56DB]/5 px-4 py-2.5 text-sm">
        <Crown className="h-4 w-4 text-[#1A56DB]" />
        <span className="text-foreground">
          Coordenador atual:{" "}
          <strong className="font-semibold">
            {coordenadorAtual?.nome ?? "—"}
          </strong>
          {coordenadorAtual?.coordenadorTemporario && (
            <span className="ml-1 text-muted-foreground">(temporário)</span>
          )}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#0D1B2A] text-white">
              <tr>
                <Th>Nome</Th>
                <Th>Perfil</Th>
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
                  <td className="px-3 py-2.5">
                    <PerfilCell u={u} />
                  </td>
                  <td className="px-3 py-2.5">
                    {u.perfil === "Coordenador" &&
                      !u.emFerias &&
                      !u.coordenadorTemporario && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            setFeriasDe(u);
                            setSubstitutoId("");
                          }}
                        >
                          <Plane className="h-4 w-4" /> Entrar de férias
                        </Button>
                      )}
                    {u.coordenadorTemporario && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => devolverCoordenacao(u.id)}
                      >
                        <Undo2 className="h-4 w-4" /> Devolver coordenação
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={feriasDe !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFeriasDe(null);
            setSubstitutoId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar de férias</DialogTitle>
            <DialogDescription>
              Escolha um substituto (Executor ou Revisor) que assumirá como
              Coordenador temporário. A promoção é interna ao sistema e não
              altera o AD.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label>Substituto</Label>
            <Select value={substitutoId} onValueChange={setSubstitutoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um substituto" />
              </SelectTrigger>
              <SelectContent>
                {candidatos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} — {c.perfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeriasDe(null);
                setSubstitutoId("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarFerias} disabled={!substitutoId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PerfilCell({ u }: { u: Usuario }) {
  if (u.emFerias) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Em férias — coberto por {u.cobertoPor ?? "—"}
      </span>
    );
  }
  if (u.coordenadorTemporario) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#1A56DB]/10 px-2.5 py-0.5 text-xs font-medium text-[#1A56DB]">
        Coordenador (temporário)
      </span>
    );
  }
  return <span className="text-foreground">{u.perfil}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}
