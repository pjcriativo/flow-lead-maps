import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { OpportunityItem, PipelineStageInfo, PipelineStageKey } from "./pipeline-premium-data";
import { PipelineColumn } from "./PipelineColumn";

interface PipelineBoardProps {
  stages: PipelineStageInfo[];
  opportunities: OpportunityItem[];
  selectedOpportunityId: string | null;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  onMoveOpportunity: (opp: OpportunityItem, stage: PipelineStageKey) => void;
  movingOpportunityId?: string | null;
  onAddLead?: (stageKey: PipelineStageKey) => void;
  className?: string;
}

export function PipelineBoard({
  stages,
  opportunities,
  selectedOpportunityId,
  onSelectOpportunity,
  onMoveOpportunity,
  movingOpportunityId,
  onAddLead,
  className,
}: PipelineBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStageKey | null>(null);

  const finishDrag = () => {
    setDraggedId(null);
    setOverStage(null);
  };
  const dropOn = (stage: PipelineStageKey) => {
    const opportunity = opportunities.find((item) => item.id === draggedId);
    finishDrag();
    if (opportunity && opportunity.stage !== stage) onMoveOpportunity(opportunity, stage);
  };
  const autoScroll = (clientX: number) => {
    const board = boardRef.current;
    if (!board || !draggedId) return;
    const bounds = board.getBoundingClientRect();
    if (clientX < bounds.left + 90) board.scrollLeft -= 22;
    if (clientX > bounds.right - 90) board.scrollLeft += 22;
  };

  return (
    <div
      ref={boardRef}
      onDragOver={(event) => autoScroll(event.clientX)}
      className={cn("flex gap-2.5 overflow-x-auto overflow-y-hidden pb-4", className)}
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
            onDropOpportunity={dropOn}
            onDragOverStage={setOverStage}
            isDragOver={overStage === stage.key}
            draggedOpportunityId={draggedId}
            movingOpportunityId={movingOpportunityId}
            onDragStart={setDraggedId}
            onDragEnd={finishDrag}
          />
        );
      })}
    </div>
  );
}
