import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { CHART_SERIES, type ChartDataPoint } from "./campanhas-premium-data";

interface CampanhasPerformanceChartProps {
  data?: ChartDataPoint[];
  className?: string;
}

const CAMPAIGN_COLORS = [
  { key: "odontoPrime", label: "Odonto Prime", color: "#FF6200" }, // Orange
  { key: "clinicaVida", label: "Clínica Vida", color: "#A855F7" }, // Purple
  { key: "saborArte", label: "Sabor & Arte", color: "#EC4899" }, // Rose
  { key: "mendesAdvocacia", label: "Mendes Advocacia", color: "#3B82F6" }, // Blue
  { key: "autoCenter", label: "Auto Center", color: "#10B981" }, // Green
  { key: "esteticaBemEstar", label: "Estética Bem Estar", color: "#EAB308" }, // Yellow
  { key: "techSolutions", label: "Tech Solutions", color: "#06B6D4" }, // Cyan
];

export function CampanhasPerformanceChart({
  data = CHART_SERIES,
  className,
}: CampanhasPerformanceChartProps) {
  const [metricType, setMetricType] = useState<string>("leads_gerados");

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] space-y-4",
        className,
      )}
    >
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Desempenho por campanha
          </h3>
          <p className="text-xs text-home-muted mt-0.5">
            Leads gerados ao longo do tempo em cada campanha
          </p>
        </div>

        <select
          value={metricType}
          onChange={(e) => setMetricType(e.target.value)}
          className="h-8.5 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="leads_gerados">Leads gerados</option>
          <option value="propostas_enviadas">Propostas enviadas</option>
          <option value="aberturas">Aberturas de e-mail</option>
          <option value="cliques">Cliques no site</option>
        </select>
      </div>

      {/* Gráfico Recharts Multi-Line */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#262626"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#262626" }}
            />
            <YAxis
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 200]}
              ticks={[0, 50, 100, 150, 200]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-home-border bg-[#121212]/95 p-3 shadow-xl backdrop-blur-md">
                      <div className="mb-2 text-xs font-semibold text-white">
                        Período: {label}
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex items-center justify-between gap-4 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-home-muted">{entry.name}:</span>
                            </div>
                            <span className="font-semibold text-white tabular-nums">
                              {entry.value} leads
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {CAMPAIGN_COLORS.map((c) => (
              <Line
                key={c.key}
                type="monotone"
                dataKey={c.key}
                name={c.label}
                stroke={c.color}
                strokeWidth={2}
                dot={{ r: 2.5, fill: c.color, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#121212", strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda inferior */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-home-border/60 pt-3 text-[11px]">
        {CAMPAIGN_COLORS.map((c) => (
          <div key={c.key} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            <span className="text-home-muted hover:text-white transition-colors cursor-pointer">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
