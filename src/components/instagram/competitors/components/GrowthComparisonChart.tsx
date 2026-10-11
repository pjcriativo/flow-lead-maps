import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildGrowthComparison, type IntelligenceMetric } from "@/lib/instagram-intelligence";
import type {
  InstagramCompetitor,
  InstagramCompetitorSnapshot,
} from "@/services/instagram-competitors";

interface GrowthComparisonChartProps {
  competitors: InstagramCompetitor[];
  snapshots: InstagramCompetitorSnapshot[];
}

const METRIC_LABELS: Record<IntelligenceMetric, string> = {
  followers: "Seguidores",
  engagement: "Engajamento",
  posts: "Publicações",
};

export function GrowthComparisonChart({ competitors, snapshots }: GrowthComparisonChartProps) {
  const [metric, setMetric] = useState<IntelligenceMetric>("followers");
  const [period, setPeriod] = useState("30");
  const chart = useMemo(
    () =>
      buildGrowthComparison({
        competitors,
        snapshots,
        metric,
        periodDays: Number(period),
      }),
    [competitors, metric, period, snapshots],
  );
  const data = chart.points.map((point) => ({
    ...point,
    date: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
      new Date(String(point.capturedAt)),
    ),
  }));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Layers className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Comparativo de crescimento</h3>
            <p className="text-[11px] text-slate-400">
              {METRIC_LABELS[metric]} nos últimos {period} dias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={metric} onValueChange={(value) => setMetric(value as IntelligenceMetric)}>
            <SelectTrigger className="h-8 w-28 rounded-xl border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="followers">Seguidores</SelectItem>
              <SelectItem value="engagement">Engajamento</SelectItem>
              <SelectItem value="posts">Publicações</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-32 rounded-xl border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="h-56 min-w-0 flex-1 sm:h-64">
          {chart.hasHistory ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: "#94A3B8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ fill: "#94A3B8" }}
                  domain={["auto", "auto"]}
                  tickFormatter={(value: number) => formatValue(value, metric)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                    fontSize: "11px",
                  }}
                  formatter={(value: number) => [formatValue(value, metric), METRIC_LABELS[metric]]}
                />
                {chart.series.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    connectNulls={false}
                    stroke={series.color}
                    strokeWidth={2.2}
                    dot
                    activeDot={{ r: 4, strokeWidth: 1 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex size-full items-center justify-center text-center text-xs text-slate-400">
              São necessários ao menos dois snapshots no período para exibir uma curva real.
            </div>
          )}
        </div>
        <div className="w-full shrink-0 space-y-2 border-t border-slate-100 pt-3 lg:w-44 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
          {chart.series.map((series) => (
            <div key={series.key} className="flex items-center justify-between text-xs">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span className="truncate text-slate-600">{series.name}</span>
              </div>
              <span className="font-bold text-slate-900">{formatValue(series.value, metric)}</span>
            </div>
          ))}
          {!chart.series.length ? (
            <p className="text-xs text-slate-400">Sem histórico comparável.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatValue(value: number, metric: IntelligenceMetric) {
  if (metric === "engagement") return `${Number(value).toFixed(2)}%`;
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
