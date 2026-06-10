import { ShieldAlert, FileCheck2 } from "lucide-react";

export type DefesaTexts = { defesa: string; tecnica: string };

const MAX = 10000;

/**
 * Componente da aba "Defesa" (RF23). Exibe duas caixas de texto:
 * - "DEFESA DO JURISDICIONADO": manifestação apresentada pelo jurisdicionado.
 * - "ANÁLISE TÉCNICA": parecer técnico do auditor sobre a defesa.
 */
export function AbaDefesa({
  value,
  onChange,
  readOnly = false,
}: {
  value: DefesaTexts;
  onChange: (next: DefesaTexts) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-5">
      <Box
        icon={<ShieldAlert className="h-4 w-4" />}
        title="Defesa do Jurisdicionado"
        accent="bg-amber-50 text-amber-700 ring-amber-200"
        value={value.defesa}
        readOnly={readOnly}
        placeholder="Transcreva ou descreva a manifestação de defesa apresentada pelo jurisdicionado..."
        onChange={(defesa) => onChange({ ...value, defesa })}
      />
      <Box
        icon={<FileCheck2 className="h-4 w-4" />}
        title="Análise Técnica"
        accent="bg-blue-50 text-[#1A56DB] ring-[#1A56DB]/20"
        value={value.tecnica}
        readOnly={readOnly}
        placeholder="Registre a análise técnica da equipe sobre os argumentos da defesa..."
        onChange={(tecnica) => onChange({ ...value, tecnica })}
      />
    </div>
  );
}

function Box({
  icon,
  title,
  accent,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  readOnly: boolean;
}) {
  const restantes = MAX - value.length;
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div
        className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wide ring-1 ${accent}`}
      >
        {icon}
        {title}
      </div>
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX))}
          readOnly={readOnly}
          maxLength={MAX}
          rows={8}
          className="block w-full resize-y overflow-y-auto rounded-md border border-border bg-white p-3 text-sm text-foreground shadow-inner outline-none focus:border-[#1A56DB] focus:ring-1 focus:ring-[#1A56DB]"
          placeholder={placeholder}
        />
        <div className="mt-1 flex justify-end text-xs text-muted-foreground">
          {restantes.toLocaleString("pt-BR")} caracteres restantes
        </div>
      </div>
    </div>
  );
}
