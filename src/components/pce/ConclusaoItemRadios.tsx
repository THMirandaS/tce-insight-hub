import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

export type ConclusaoItemValor = "regular" | "ressalvas" | "irregular";
export type EncaminhamentoValor = "nenhum" | "recomendacao" | "determinacao";

export type ConclusaoItemEstado = {
  conclusao: ConclusaoItemValor | null;
  encaminhamento: EncaminhamentoValor | null;
  encaminhamentoTexto: string;
};

// Estado por tópico (escopo), mantido no módulo para persistir entre navegações.
// Inicia sempre sem seleção (null) — obrigatório escolher antes de concluir.
const STORE: Record<string, ConclusaoItemEstado> = {};

// Escopo atualmente visível na tela principal (usado pela validação da conclusão).
const ATIVO: { scope: string | null } = { scope: null };

export function getConclusaoItem(scope: string): ConclusaoItemEstado {
  return STORE[scope] ?? { conclusao: null, encaminhamento: null, encaminhamentoTexto: "" };
}

export const MSG_CONCLUSAO_OBRIGATORIA =
  "Selecione a conclusão do item e o tipo de encaminhamento";

/**
 * Valida o escopo visível. Retorna null quando está tudo preenchido
 * (ou quando o tópico não tem os grupos de radio) e a mensagem quando falta.
 */
export function validarConclusaoItemAtiva(): string | null {
  const scope = ATIVO.scope;
  if (!scope) return null;
  const est = getConclusaoItem(scope);
  if (est.conclusao === null || est.encaminhamento === null)
    return MSG_CONCLUSAO_OBRIGATORIA;
  return null;
}

const CONCLUSAO_OPCOES = [
  { v: "regular", label: "Regular" },
  { v: "ressalvas", label: "Regular com ressalvas" },
  { v: "irregular", label: "Irregular" },
] as const;

const ENC_OPCOES = [
  { v: "nenhum", label: "Nenhum" },
  { v: "recomendacao", label: "Recomendação" },
  { v: "determinacao", label: "Determinação" },
] as const;

export function ConclusaoItemRadios({
  scope,
  readOnly = false,
  onChange,
}: {
  /** Identificador do tópico/sub-aba (ex.: "consistencia:rpp"). */
  scope: string;
  readOnly?: boolean;
  onChange?: (estado: ConclusaoItemEstado) => void;
}) {
  const [estado, setEstado] = useState<ConclusaoItemEstado>(() =>
    getConclusaoItem(scope)
  );

  // Registra o escopo visível e sincroniza ao trocar de tópico/sub-aba.
  useEffect(() => {
    ATIVO.scope = scope;
    setEstado(getConclusaoItem(scope));
    return () => {
      if (ATIVO.scope === scope) ATIVO.scope = null;
    };
  }, [scope]);

  function commit(next: ConclusaoItemEstado) {
    STORE[scope] = next;
    setEstado(next);
    onChange?.(next);
  }

  return (
    <>
      <div className="mt-6 space-y-2" data-conclusao-item={scope}>
        <Label className="text-sm font-semibold">Conclusão do item:</Label>
        <div className="flex flex-wrap gap-6">
          {CONCLUSAO_OPCOES.map((o) => (
            <label key={o.v} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`conclusao-${scope}`}
                value={o.v}
                checked={estado.conclusao === o.v}
                disabled={readOnly}
                onChange={() => commit({ ...estado, conclusao: o.v })}
                className="h-4 w-4 accent-[#1A56DB]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label className="text-sm font-semibold">Tipo de encaminhamento:</Label>
        <div className="flex flex-wrap gap-6">
          {ENC_OPCOES.map((o) => (
            <label key={o.v} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`encaminhamento-${scope}`}
                value={o.v}
                checked={estado.encaminhamento === o.v}
                disabled={readOnly}
                onChange={() => commit({ ...estado, encaminhamento: o.v })}
                className="h-4 w-4 accent-[#1A56DB]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
