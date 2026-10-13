import { ChevronDown } from "lucide-react";
import { RESULTS_SUBTABS } from "./resultados-data";
import { cn } from "@/lib/utils";

interface MarketingResultsSubnavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export function MarketingResultsSubnav({
  activeTab,
  onTabChange,
  selectedPeriod,
  onPeriodChange,
}: MarketingResultsSubnavProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-home-border/60 pb-1">
      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {RESULTS_SUBTABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative py-2.5 px-3.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap",
                isActive
                  ? "text-white font-bold"
                  : "text-home-muted hover:text-white/90",
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-home-orange rounded-full shadow-[0_0_8px_rgba(255,98,0,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Period selector dropdown (Últimos 30 dias) */}
      <div className="relative self-start sm:self-auto">
        <select
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="appearance-none bg-[#0E131B] border border-home-border/60 hover:border-home-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange transition-colors"
        >
          <option value="30d">Últimos 30 dias</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="15d">Últimos 15 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="ano">Ano atual</option>
        </select>
        <ChevronDown className="size-3.5 text-home-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
