import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentesTabId =
  | "meus_agentes"
  | "estrategias_produto"
  | "analise_mercado"
  | "concorrentes"
  | "recomendacoes";

interface AgentesSubnavTabsProps {
  activeTab: AgentesTabId;
  onTabChange: (tabId: AgentesTabId) => void;
  onOpenNovoAgente: () => void;
}

const TABS: { id: AgentesTabId; label: string }[] = [
  { id: "meus_agentes", label: "Meus agentes" },
  { id: "estrategias_produto", label: "Estratégias por produto" },
  { id: "analise_mercado", label: "Análise de mercado" },
  { id: "concorrentes", label: "Concorrentes" },
  { id: "recomendacoes", label: "Recomendações" },
];

export function AgentesSubnavTabs({
  activeTab,
  onTabChange,
  onOpenNovoAgente,
}: AgentesSubnavTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-home-border/60 pb-1">
      {/* Abas com sublinhado laranja */}
      <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative pb-3 pt-1 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                isActive
                  ? "text-white font-semibold"
                  : "text-home-muted hover:text-home-foreground",
              )}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#ff6200] shadow-[0_0_8px_rgba(255,98,0,0.6)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Botão + Novo agente */}
      <button
        type="button"
        onClick={onOpenNovoAgente}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white px-4 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all duration-200 cursor-pointer self-start sm:self-auto shrink-0 mb-1"
      >
        <Plus className="size-3.5 stroke-[2.5]" />
        <span>Novo agente</span>
      </button>
    </div>
  );
}
