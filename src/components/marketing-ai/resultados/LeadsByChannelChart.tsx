import { LEADS_BY_CHANNEL } from "./resultados-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

export function LeadsByChannelChart() {
  const totalLeads = 486;

  // Calcula os arcos para o SVG do Donut
  let cumulativePercentage = 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 shadow-sm">
      {/* Header */}
      <div className="pb-2">
        <h3 className="text-sm font-bold text-white">
          Leads por canal
        </h3>
      </div>

      {/* Donut and Legend row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* SVG Donut Chart */}
        <div className="relative size-40 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            {LEADS_BY_CHANNEL.map((item) => {
              const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              cumulativePercentage += item.percentage;

              return (
                <circle
                  key={item.channel}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="13"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  pathLength="100"
                  className="transition-all duration-300 hover:opacity-85"
                />
              );
            })}
          </svg>

          {/* Central Highlight */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              {totalLeads}
            </span>
            <span className="text-[10px] font-medium text-home-muted mt-0.5">
              Leads gerados
            </span>
          </div>
        </div>

        {/* Breakdown Legend */}
        <div className="flex-1 w-full flex flex-col divide-y divide-home-border/30 text-xs">
          {LEADS_BY_CHANNEL.map((item) => (
            <div
              key={item.channel}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                {item.channel !== "outros" ? (
                  <PlatformIcon platform={item.channel as any} size="sm" />
                ) : (
                  <span className="size-3.5 rounded-full bg-gray-500 shrink-0" />
                )}
                <span className="font-medium text-white/90 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right shrink-0">
                <span className="font-bold text-white">
                  {item.leads}
                </span>
                <span className="text-home-muted text-[11px] w-8">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
