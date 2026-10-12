import { ArrowUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityItem, PipelineStageInfo } from "./pipeline-premium-data";
import { OpportunityCard } from "./OpportunityCard";

interface PipelineColumnProps {
  stage: PipelineStageInfo;
  opportunities: OpportunityItem[];
  selectedOpportunityId: string | null;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  onAddLead?: (stageKey: string) => void;
  className?: string;
}

export function PipelineColumn({
  stage,
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  onAddLead,
  className,
}: PipelineColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col min-w-[210px] w-full flex-1 rounded-2xl border border-home-border/80 bg-home-surface/50 p-2.5",
        className,
      )}
    >
      {/* Column Header */}
      <div className="mb-2.5 rounded-xl border border-home-border/60 bg-home-surface/80 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-tight">
            {stage.title}
          </h3>
          <ArrowUpDown className="size-3 text-home-muted/70" />
        </div>

        <div className="mt-1 flex items-baseline justify-between text-xs">
          <span className="font-bold text-white">{stage.count}</span>
          <span className="text-[11px] font-medium text-home-muted">
            {stage.totalValue}
          </span>
        </div>

        {/* Button: + Adicionar lead */}
        <button
          type="button"
          onClick={() => onAddLead?.(stage.key)}
          className={cn(
            "mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-home-border/80 bg-home-surface-strong/60 py-1.5",
            "text-[11px] font-semibold text-home-muted transition-colors hover:border-home-border hover:bg-home-surface hover:text-white",
          )}
        >
          <Plus className="size-3" />
          <span>Adicionar lead</span>
        </button>
      </div>

      {/* Cards List */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isSelected={selectedOpportunityId === opp.id}
            onSelect={onSelectOpportunity}
          />
        ))}

        {opportunities.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-home-border/40 p-6 text-center text-[11px] text-home-muted">
            Nenhuma oportunidade nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
