import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, Legend,
} from "recharts";
import {
  situacaoData, autuacaoData, consolidacaoData, orgaosPorTipoData,
  prazoMedioData, pendenciasData, relatoresData, auditoresData,
  SITUACOES, SITUACAO_COLORS,
} from "@/lib/pce-data";

const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--chart-6)",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
};

export function SituacaoChart() {
  const total = situacaoData.reduce((s, d) => s + d.quantidade, 0);
  const data = situacaoData.map((d) => ({
    ...d,
    pct: ((d.quantidade / total) * 100).toFixed(1),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="situacao" {...axisProps} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis {...axisProps} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number, _n, p) => [`${v} processos (${p.payload.pct}%)`, "Total"]}
        />
        <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={d.situacao} fill={SITUACAO_COLORS[d.situacao] ?? CHART_COLORS[i]} />
          ))}
          <LabelList
            dataKey="quantidade"
            position="top"
            fontSize={11}
            fill="var(--foreground)"
            formatter={(v: number) => {
              const item = data.find((x) => x.quantidade === v);
              return `${v} · ${item?.pct}%`;
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AutuacaoChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={autuacaoData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="tipo" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="disponivel" name="Disponível p/ autuação" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="autuado" name="Já autuados" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ConsolidacaoChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={consolidacaoData} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="situacao" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
          {consolidacaoData.map((d, i) => (
            <Cell key={d.situacao} fill={d.destaque ? "var(--accent)" : CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
          <LabelList dataKey="quantidade" position="top" fontSize={11} fill="var(--foreground)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function OrgaosPorTipoChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={orgaosPorTipoData} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="tipo" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {orgaosPorTipoData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
          <LabelList dataKey="total" position="top" fontSize={11} fill="var(--foreground)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PrazoMedioChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={prazoMedioData} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="situacao" {...axisProps} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis {...axisProps} unit="d" />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} dias`, "Prazo médio"]} />
        <Bar dataKey="dias" radius={[4, 4, 0, 0]}>
          {prazoMedioData.map((d, i) => (
            <Cell key={d.situacao} fill={SITUACAO_COLORS[d.situacao] ?? CHART_COLORS[i]} />
          ))}
          <LabelList dataKey="dias" position="top" fontSize={11} fill="var(--foreground)" formatter={(v: number) => `${v}d`} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PendenciasChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={pendenciasData} margin={{ top: 24, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="tipo" {...axisProps} interval={0} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
          {pendenciasData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
          <LabelList dataKey="quantidade" position="top" fontSize={11} fill="var(--foreground)" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StackedHorizontalChart({ data }: { data: Record<string, string | number>[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" {...axisProps} />
        <YAxis type="category" dataKey="nome" {...axisProps} width={120} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {SITUACOES.map((s) => (
          <Bar key={s} dataKey={s} stackId="a" fill={SITUACAO_COLORS[s]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export { relatoresData, auditoresData };
