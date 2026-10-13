import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { REVENUE_INVESTMENT_DATA } from "./resultados-data";

export function RevenueInvestmentChart() {
  const [granularity, setGranularity] = useState<"dia" | "semana" | "mes">("dia");

  return (
    <div className="flex flex-col justify-between rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-bold text-white">
          Receita vs Investimento
        </h3>

        <div className="relative">
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
            className="appearance-none bg-[#141A23] border border-home-border/60 rounded-lg pl-2.5 pr-7 py-1 text-[11px] text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange"
          >
            <option value="dia">Por dia</option>
            <option value="semana">Por semana</option>
            <option value="mes">Por mês</option>
          </select>
          <ChevronDown className="size-3 text-home-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Custom Legend */}
      <div className="flex items-center gap-4 text-[11px] font-medium pb-3 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#FF6200]" />
          <span className="text-home-muted">Receita atribuída</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#3B82F6]" />
          <span className="text-home-muted">Investimento</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={REVENUE_INVESTMENT_DATA}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6200" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF6200" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorInvestimento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `R$ ${val / 1000}K`}
              ticks={[0, 10000, 20000, 30000]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-xl border border-home-border/80 bg-[#0E131B] p-2.5 shadow-xl text-xs">
                    <span className="font-semibold text-white block mb-1">
                      {label}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-orange-400">
                        <span>Receita:</span>
                        <span className="font-bold">
                          R$ {payload[0]?.value?.toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-blue-400">
                        <span>Investimento:</span>
                        <span className="font-bold">
                          R$ {payload[1]?.value?.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="#FF6200"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorReceita)"
            />
            <Area
              type="monotone"
              dataKey="investimento"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvestimento)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
