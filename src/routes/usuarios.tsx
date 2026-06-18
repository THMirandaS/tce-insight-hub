import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Users, Ban, Crown, ArrowLeftRight, Search } from "lucide-react";
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
import {
  useAtribuicoes,
  type Perfil,
  type Usuario,
} from "@/lib/atribuicoes";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const { usuarios, usuarioAtivoId, updateUsuario, transferirCoordenacao } =
    useAtribuicoes();

  // Etapa do fluxo de transferência: null | "form" | "confirm".
  const [etapa, setEtapa] = useState<null | "form" | "confirm">(null);
  const [novoPerfilAtual, setNovoPerfilAtual] = useState<Perfil | "">("");
  const [novoCoordenadorId, setNovoCoordenadorId] = useState<string>("");
  const [busca, setBusca] = useState("");

  // Usuário logado.
  const ativo = usuarios.find((u) => u.id === usuarioAtivoId) ?? null;
  // Coordenador efetivo (único).
  const coordenadorAtual =
    usuarios.find((u) => u.perfil === "Coordenador") ?? null;

  // Acesso restrito ao Coordenador.
  const temAcesso = !!ativo && ativo.perfil === "Coordenador";

  // Candidatos a novo Coordenador: Executor ou Revisor.
  const candidatos = useMemo(
    () =>
      usuarios.filter(
        (u) => u.perfil === "Executor" || u.perfil === "Revisor"
      ),
    [usuarios]
  );

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((u) =>
        u.nome.toLowerCase().includes(busca.trim().toLowerCase())
      ),
    [usuarios, busca]
  );

  if (!temAcesso) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <Ban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">
          Acesso restrito
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A gestão de usuários está disponível apenas para o Coordenador.
        </p>
      </main>
    );
  }

  const abrirTransferencia = (preCoordenadorId?: string) => {
    setNovoPerfilAtual("");
    setNovoCoordenadorId(preCoordenadorId ?? "");
    setEtapa("form");
  };

  const fecharTransferencia = () => {
    setEtapa(null);
    setNovoPerfilAtual("");
    setNovoCoordenadorId("");
  };

  const efetivarTransferencia = () => {
    if (!coordenadorAtual || !novoPerfilAtual || !novoCoordenadorId) return;
    transferirCoordenacao(
      coordenadorAtual.id,
      novoPerfilAtual,
      novoCoordenadorId
    );
    fecharTransferencia();
  };

  const novoCoordenador =
    usuarios.find((u) => u.id === novoCoordenadorId) ?? null;

  // Edição inline do perfil por linha. Tentar setar Coordenador em outro
  // usuário NÃO cria um segundo Coordenador: direciona para o fluxo de
  // transferência de coordenação.
  const onPerfilChange = (u: Usuario, next: Perfil) => {
    if (next === u.perfil) return;
    if (next === "Coordenador") {
      abrirTransferencia(u.id);
      return;
    }
    updateUsuario(u.id, { perfil: next });
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#1A56DB]/20 bg-[#1A56DB]/5 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-foreground">
          <Crown className="h-4 w-4 text-[#1A56DB]" />
          Coordenador atual:{" "}
          <strong className="font-semibold">
            {coordenadorAtual?.nome ?? "—"}
          </strong>
        </span>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => abrirTransferencia()}
        >
          <ArrowLeftRight className="h-4 w-4" /> Transferir coordenação
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-auto max-h-[calc(100vh-260px)]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#0D1B2A] text-white">
              <tr>
                <Th>Nome</Th>
                <Th>Perfil</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-border bg-white align-middle hover:bg-blue-50/40"
                >
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    {u.nome}
                  </td>
                  <td className="px-3 py-2.5">
                    <PerfilCell u={u} onChange={onPerfilChange} />
                  </td>
                  <td className="px-3 py-2.5">
                    {u.perfil === "Coordenador" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => abrirTransferencia()}
                      >
                        <ArrowLeftRight className="h-4 w-4" /> Transferir
                        coordenação
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1 — formulário de transferência */}
      <Dialog
        open={etapa === "form"}
        onOpenChange={(open) => {
          if (!open) fecharTransferencia();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir coordenação</DialogTitle>
            <DialogDescription>
              Você deixará de ser Coordenador. Escolha o perfil que passará a
              ter e quem assumirá a coordenação. Apenas 1 Coordenador ativo por
              vez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Meu novo perfil</Label>
              <Select
                value={novoPerfilAtual}
                onValueChange={(v) => setNovoPerfilAtual(v as Perfil)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu novo perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Executor">Executor</SelectItem>
                  <SelectItem value="Revisor">Revisor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Novo Coordenador</Label>
              <Select
                value={novoCoordenadorId}
                onValueChange={setNovoCoordenadorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo Coordenador" />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fecharTransferencia}>
              Cancelar
            </Button>
            <Button
              onClick={() => setEtapa("confirm")}
              disabled={!novoPerfilAtual || !novoCoordenadorId}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2 — confirmação final */}
      <Dialog
        open={etapa === "confirm"}
        onOpenChange={(open) => {
          if (!open) setEtapa("form");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar transferência</DialogTitle>
            <DialogDescription>
              Você deixará de ser Coordenador e passará a {novoPerfilAtual}.{" "}
              {novoCoordenador?.nome ?? "—"} assumirá como Coordenador. Deseja
              confirmar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEtapa("form")}>
              Cancelar
            </Button>
            <Button onClick={efetivarTransferencia}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PerfilCell({
  u,
  onChange,
}: {
  u: Usuario;
  onChange: (u: Usuario, next: Perfil) => void;
}) {
  return (
    <Select value={u.perfil} onValueChange={(v) => onChange(u, v as Perfil)}>
      <SelectTrigger className="h-8 w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Coordenador" disabled={u.perfil !== "Coordenador"}>
          Coordenador
        </SelectItem>
        <SelectItem value="Executor">Executor</SelectItem>
        <SelectItem value="Revisor">Revisor</SelectItem>
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
