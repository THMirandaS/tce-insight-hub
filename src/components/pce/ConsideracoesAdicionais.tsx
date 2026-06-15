import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Caixa padronizada de "Considerações adicionais".
 * - Texto livre, SEM limite de caracteres.
 * - Checkbox "Compor relatório" (padrão DESMARCADO): quando marcado, o texto
 *   é anexado ao final do tópico no PDF/relatório; desmarcado, é salvo mas
 *   não aparece no PDF.
 *
 * O controle de inclusão no PDF é feito pelo gerador de PDF do tópico, que lê
 * os atributos data-consid* deste elemento.
 */
export function ConsideracoesAdicionais({
  title = "Considerações adicionais:",
  printTitle = "Considerações adicionais",
  className = "",
  defaultText = "",
  defaultCompor = false,
  readOnly = false,
  onChange,
}: {
  title?: string;
  printTitle?: string;
  className?: string;
  defaultText?: string;
  defaultCompor?: boolean;
  readOnly?: boolean;
  onChange?: (state: { texto: string; compor: boolean }) => void;
}) {
  const [texto, setTexto] = useState(defaultText);
  const [compor, setCompor] = useState(defaultCompor);

  function update(next: { texto?: string; compor?: boolean }) {
    const t = next.texto ?? texto;
    const c = next.compor ?? compor;
    if (next.texto !== undefined) setTexto(next.texto);
    if (next.compor !== undefined) setCompor(next.compor);
    onChange?.({ texto: t, compor: c });
  }

  return (
    <div
      className={`mt-6 space-y-2 ${className}`}
      data-consid
      data-consid-compor={compor ? "true" : "false"}
      data-consid-text={texto}
      data-consid-title={printTitle}
    >
      <Label className="text-sm font-semibold">{title}</Label>
      <textarea
        value={texto}
        readOnly={readOnly}
        onChange={(e) => update({ texto: e.target.value })}
        rows={6}
        placeholder="Digite aqui as considerações adicionais..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
      />
      <label className="flex cursor-pointer select-none items-center gap-2 pt-1 text-sm leading-tight text-foreground">
        <Checkbox
          checked={compor}
          disabled={readOnly}
          onCheckedChange={(c) => update({ compor: c === true })}
        />
        Compor relatório
      </label>
    </div>
  );
}
