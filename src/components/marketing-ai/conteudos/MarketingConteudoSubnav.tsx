import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConteudoSubTab =
  | "planejamento"
  | "conteudos_gerados"
  | "minhas_campanhas"
  | "biblioteca_midias"
  | "aprovacao_publicacao";

interface MarketingConteudoSubnavProps {
  activeTab: ConteudoSubTab;
  onTabChange: (tab: ConteudoSubTab) => void;
  onNovoConteudo: () => void;
}

const TABS: { id: ConteudoSubTab; label: string }[] = [
  { id: "planejamento", label: "Planejamento" },
  { id: "conteudos_gerados", label: "Conteúdos gerados" },
  { id: "minhas_campanhas", label: "Minhas campanhas" },
  { id: "biblioteca_midias", label: "Biblioteca de mídias" },
  { id: "aprovacao_publicacao", label: "Aprovação e publicação" },
];

export function MarketingConteudoSubnav({
  activeTab,
  onTabChange,
  onNovoConteudo,
}: MarketingConteudoSubnavProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-home-border/60 pb-1">
      {/* Horizontal Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
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

      {/* Right: + Novo conteúdo CTA */}
      <button
        type="button"
        onClick={onNovoConteudo}
        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-home-orange hover:bg-home-orange-hover text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
      >
        <Plus className="size-3.5" />
        Novo conteúdo
      </button>
    </div>
  );
}
