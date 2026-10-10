import { useState } from "react";
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

export interface GrowthDataPoint {
  date: string;
  baggio: number;
  forneria: number;
  brasa: number;
  bella: number;
  casa: number;
}

export const DEFAULT_GROWTH_DATA: GrowthDataPoint[] = [
  { date: "01 Jun", baggio: 36000, forneria: 29500, brasa: 29000, bella: 15200, casa: 13200 },
  { date: "05 Jun", baggio: 37500, forneria: 30100, brasa: 28800, bella: 15800, casa: 13500 },
  { date: "10 Jun", baggio: 39200, forneria: 30800, brasa: 28600, bella: 16400, casa: 13800 },
  { date: "15 Jun", baggio: 41800, forneria: 31200, brasa: 28400, bella: 17100, casa: 14000 },
  { date: "20 Jun", baggio: 44200, forneria: 31900, brasa: 28300, bella: 17700, casa: 14200 },
  { date: "25 Jun", baggio: 46800, forneria: 32300, brasa: 28200, bella: 18400, casa: 14400 },
  { date: "30 Jun", baggio: 48200, forneria: 32700, brasa: 28100, bella: 18900, casa: 14600 },
];

export const COMPETITOR_SERIES = [
  { key: "baggio", name: "Baggio Pizzaria", color: "#2563EB", value: "48.2K" },
  { key: "forneria", name: "Forneria Original", color: "#8B5CF6", value: "32.7K" },
  { key: "brasa", name: "Pizza na Brasa", color: "#EC4899", value: "28.1K" },
  { key: "bella", name: "Bella Pizza SP", color: "#F97316", value: "18.9K" },
  { key: "casa", name: "Casa da Pizza", color: "#F43F5E", value: "14.6K" },
];

interface GrowthComparisonChartProps {
  data?: GrowthDataPoint[];
}

export function GrowthComparisonChart({ data = DEFAULT_GROWTH_DATA }: GrowthComparisonChartProps) {
  const [metric, setMetric] = useState("seguidores");
  const [period, setPeriod] = useState("30d");

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card com Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Layers className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Comparativo de crescimento</h3>
            <p className="text-[11px] text-slate-400">
              Evolução de seguidores nos últimos 30 dias
            </p>
          </div>
        </div>

        {/* Dropdowns de filtro */}
        <div className="flex items-center gap-2">
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="h-8 w-28 rounded-xl border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seguidores">Seguidores</SelectItem>
              <SelectItem value="engajamento">Engajamento</SelectItem>
              <SelectItem value="posts">Publicações</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-32 rounded-xl border-slate-200 bg-white text-xs text-slate-700 shadow-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Área do Gráfico + Legenda */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Gráfico Recharts */}
        <div className="h-56 min-w-0 flex-1 sm:h-64">
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
                domain={[0, 60000]}
                ticks={[0, 20000, 40000, 60000]}
                tickFormatter={(value) => (value === 0 ? "0" : `${value / 1000}K`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.96)",
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  fontSize: "11px",
                }}
                formatter={(val: number) => [
                  new Intl.NumberFormat("pt-BR").format(val),
                  "Seguidores",
                ]}
              />
              {COMPETITOR_SERIES.map((serie) => (
                <Line
                  key={serie.key}
                  type="monotone"
                  dataKey={serie.key}
                  stroke={serie.color}
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda Lateral com Valores */}
        <div className="w-full shrink-0 space-y-2 border-t border-slate-100 pt-3 lg:w-44 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
          {COMPETITOR_SERIES.map((serie) => (
            <div key={serie.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: serie.color }} />
                <span className="truncate text-slate-600">{serie.name}</span>
              </div>
              <span className="font-bold text-slate-900">{serie.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
