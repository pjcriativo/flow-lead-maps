import { cn } from "@/lib/utils";
import type { OpportunityItem, PipelineStageInfo } from "./pipeline-premium-data";
import { PipelineColumn } from "./PipelineColumn";

interface PipelineBoardProps {
  stages: PipelineStageInfo[];
  opportunities: OpportunityItem[];
  selectedOpportunityId: string | null;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  onAddLead?: (stageKey: string) => void;
  className?: string;
}

export function PipelineBoard({
  stages,
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  onAddLead,
  className,
}: PipelineBoardProps) {
  return (
    <div
      className={cn(
        "flex gap-2.5 overflow-x-auto pb-4",
        className,
      )}
    >
      {stages.map((stage) => {
        const stageOpps = opportunities.filter((opp) => opp.stage === stage.key);

        return (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            opportunities={stageOpps}
            selectedOpportunityId={selectedOpportunityId}
            onSelectOpportunity={onSelectOpportunity}
            onAddLead={onAddLead}
          />
        );
      })}
    </div>
  );
}
