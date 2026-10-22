import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { StageFeed } from "./usePipelinePremium";
import type { OpportunityItem, PipelineStageInfo, PipelineStageKey } from "./pipeline-premium-data";
import { PipelineColumn } from "./PipelineColumn";
import { useFillViewportHeight } from "./use-fill-viewport-height";

interface PipelineBoardProps {
  stages: PipelineStageInfo[];
  feeds: Record<PipelineStageKey, StageFeed>;
  selectedOpportunityId: string | null;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  onMoveOpportunity: (opp: OpportunityItem, stage: PipelineStageKey) => void;
  movingOpportunityId?: string | null;
  onAddLead?: (stageKey: PipelineStageKey) => void;
  className?: string;
}

export function PipelineBoard({
  stages,
  feeds,
  selectedOpportunityId,
  onSelectOpportunity,
  onMoveOpportunity,
  movingOpportunityId,
  onAddLead,
  className,
}: PipelineBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const height = useFillViewportHeight(boardRef);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStageKey | null>(null);

  // Os handlers ficam estáveis (via ref) para que arrastar ou rolar uma coluna não re-renderize as outras.
  const feedsRef = useRef(feeds);
  feedsRef.current = feeds;
  const draggedRef = useRef<string | null>(null);
  const handlersRef = useRef({ onSelectOpportunity, onMoveOpportunity, onAddLead });
  handlersRef.current = { onSelectOpportunity, onMoveOpportunity, onAddLead };
  const selectOpportunity = useCallback(
    (opportunity: OpportunityItem) => handlersRef.current.onSelectOpportunity(opportunity),
    [],
  );
  const addLead = useCallback(
    (stageKey: PipelineStageKey) => handlersRef.current.onAddLead?.(stageKey),
    [],
  );

  const startDrag = useCallback((id: string) => {
    draggedRef.current = id;
    setDraggedId(id);
  }, []);
  const finishDrag = useCallback(() => {
    draggedRef.current = null;
    setDraggedId(null);
    setOverStage(null);
  }, []);
  const dropOn = useCallback(
    (stage: PipelineStageKey) => {
      const id = draggedRef.current;
      const opportunity = id
        ? Object.values(feedsRef.current)
            .flatMap((feed) => feed.opportunities)
            .find((item) => item.id === id)
        : undefined;
      finishDrag();
      if (opportunity && opportunity.stage !== stage) {
        handlersRef.current.onMoveOpportunity(opportunity, stage);
      }
    },
    [finishDrag],
  );
  const loadMore = useCallback((stage: PipelineStageKey) => feedsRef.current[stage].loadMore(), []);
  const autoScroll = (clientX: number) => {
    const board = boardRef.current;
    if (!board || !draggedRef.current) return;
    const bounds = board.getBoundingClientRect();
    if (clientX < bounds.left + 90) board.scrollLeft -= 22;
    if (clientX > bounds.right - 90) board.scrollLeft += 22;
  };

  return (
    <div
      ref={boardRef}
      style={height ? { height } : undefined}
      onDragOver={(event) => autoScroll(event.clientX)}
      className={cn(
        "flex min-h-[420px] snap-x gap-2.5 overflow-x-auto overflow-y-hidden pb-3 md:snap-none",
        className,
      )}
    >
      {stages.map((stage) => {
        const feed = feeds[stage.key];
        return (
          <PipelineColumn
            key={stage.key}
            stage={stage}
            opportunities={feed.opportunities}
            loading={feed.loading}
            countLoading={feed.countLoading}
            loadingMore={feed.loadingMore}
            hasMore={feed.hasMore}
            onLoadMore={loadMore}
            selectedOpportunityId={selectedOpportunityId}
            onSelectOpportunity={selectOpportunity}
            onAddLead={addLead}
            onDropOpportunity={dropOn}
            onDragOverStage={setOverStage}
            isDragOver={overStage === stage.key}
            draggedOpportunityId={
              draggedId && feed.opportunities.some((item) => item.id === draggedId)
                ? draggedId
                : null
            }
            movingOpportunityId={movingOpportunityId}
            onDragStart={startDrag}
            onDragEnd={finishDrag}
          />
        );
      })}
    </div>
  );
}
