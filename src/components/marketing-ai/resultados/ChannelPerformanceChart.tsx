import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CHANNEL_PERFORMANCE_DATA } from "./resultados-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

export function ChannelPerformanceChart() {
  const [metric, setMetric] = useState<"leads" | "cliques" | "vendas" | "receita">("leads");
  const maxVal = 200;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold text-white">
          Desempenho por canal
        </h3>

        <div className="relative">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as any)}
            className="appearance-none bg-[#141A23] border border-home-border/60 rounded-lg pl-2.5 pr-7 py-1 text-[11px] text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange"
          >
            <option value="leads">Leads</option>
            <option value="cliques">Cliques</option>
            <option value="vendas">Vendas</option>
            <option value="receita">Receita</option>
          </select>
          <ChevronDown className="size-3 text-home-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="relative h-52 w-full flex items-end pt-4 pb-2">
        {/* Y Axis Guide Lines */}
        <div className="absolute inset-y-0 left-0 w-8 flex flex-col justify-between text-[10px] font-mono text-home-muted/60 pointer-events-none pb-8 pt-2">
          <span>200</span>
          <span>150</span>
          <span>100</span>
          <span>50</span>
          <span>0</span>
        </div>

        {/* Bars Grid */}
        <div className="ml-10 flex-1 h-full flex items-end justify-between gap-2 border-b border-home-border/50 pb-8">
          {CHANNEL_PERFORMANCE_DATA.map((item) => {
            const barHeightPct = (item.leads / maxVal) * 100;

            return (
              <div
                key={item.channel}
                className="flex-1 flex flex-col items-center justify-end h-full group"
              >
                {/* Value on top of bar */}
                <span className="text-[11px] font-bold text-white mb-1.5 transition-transform group-hover:-translate-y-0.5">
                  {item.leads}
                </span>

                {/* Vertical Bar */}
                <div
                  className="w-full max-w-[34px] rounded-t-md transition-all duration-300 group-hover:opacity-90 shadow-xs"
                  style={{
                    height: `${barHeightPct}%`,
                    backgroundColor: item.color,
                  }}
                />

                {/* Platform Icon Below */}
                <div className="absolute -bottom-1 flex items-center justify-center">
                  {item.channel !== "outros" ? (
                    <PlatformIcon platform={item.channel as any} size="sm" />
                  ) : (
                    <span className="size-4 rounded-full bg-gray-600 flex items-center justify-center text-[9px] text-white font-bold">
                      •••
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
