import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
import {
  EVOLUTION_CHART_DATA,
  type ChartDataPoint,
} from "./resultados-campanha-data";

interface ResultadosEvolutionChartProps {
  data?: ChartDataPoint[];
  className?: string;
}

export function ResultadosEvolutionChart({
  data = EVOLUTION_CHART_DATA,
  className,
}: ResultadosEvolutionChartProps) {
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("dia");

  return (
    <div
      className={cn(
        "rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between",
        className,
      )}
    >
      {/* Cabeçalho do Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Desempenho da campanha
          </h2>
          <p className="mt-0.5 text-xs text-home-muted">
            Visualize a evolução dos envios, aberturas e cliques ao longo do tempo.
          </p>
        </div>

        {/* Dropdown de Agrupamento */}
        <div className="relative">
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-xl border border-home-border bg-home-background px-3 text-xs font-semibold text-home-foreground hover:bg-home-surface-strong transition-colors"
          >
            {periodo === "dia" ? "Por dia" : periodo === "semana" ? "Por semana" : "Por mês"}
            <ChevronDown className="size-3.5 text-home-muted" />
          </button>
        </div>
      </div>

      {/* Legenda Customizada */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#F97316]" />
          <span className="text-home-muted">Envios</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#3B82F6]" />
          <span className="text-home-muted">Aberturas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#10B981]" />
          <span className="text-home-muted">Cliques</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#A855F7]" />
          <span className="text-home-muted">Interessados</span>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <div className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272A"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-home-border bg-[#090A0F] p-3 shadow-2xl text-xs space-y-1.5 min-w-[130px]">
                      <div className="font-bold text-white border-b border-home-border/60 pb-1">
                        {label}, 2024
                      </div>
                      <div className="flex items-center justify-between text-orange-400">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-[#F97316]" />
                          Envios
                        </span>
                        <span className="font-bold tabular-nums">
                          {payload.find((p) => p.dataKey === "envios")?.value}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-blue-400">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-[#3B82F6]" />
                          Aberturas
                        </span>
                        <span className="font-bold tabular-nums">
                          {payload.find((p) => p.dataKey === "aberturas")?.value}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-[#10B981]" />
                          Cliques
                        </span>
                        <span className="font-bold tabular-nums">
                          {payload.find((p) => p.dataKey === "cliques")?.value}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-purple-400">
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full bg-[#A855F7]" />
                          Interessados
                        </span>
                        <span className="font-bold tabular-nums">
                          {payload.find((p) => p.dataKey === "interessados")?.value}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="envios"
              stroke="#F97316"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#F97316", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="aberturas"
              stroke="#3B82F6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3B82F6", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="cliques"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10B981", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="interessados"
              stroke="#A855F7"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#A855F7", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
