import { memo, useEffect, useRef } from "react";
import { ArrowUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpportunityItem, PipelineStageInfo } from "./pipeline-premium-data";
import type { PipelineStageKey } from "./pipeline-premium-data";
import { OpportunityCard } from "./OpportunityCard";

interface PipelineColumnProps {
  stage: PipelineStageInfo;
  opportunities: OpportunityItem[];
  loading: boolean;
  countLoading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: (stage: PipelineStageKey) => void;
  selectedOpportunityId: string | null;
  onSelectOpportunity: (opp: OpportunityItem) => void;
  onAddLead?: (stageKey: PipelineStageKey) => void;
  onDropOpportunity: (stage: PipelineStageKey) => void;
  onDragOverStage: (stage: PipelineStageKey | null) => void;
  isDragOver: boolean;
  draggedOpportunityId: string | null;
  movingOpportunityId?: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  className?: string;
}

const EDGE_SCROLL_PX = 56;

function PipelineColumnBase({
  stage,
  opportunities,
  loading,
  countLoading,
  loadingMore,
  hasMore,
  onLoadMore,
  selectedOpportunityId,
  onSelectOpportunity,
  onAddLead,
  onDropOpportunity,
  onDragOverStage,
  isDragOver,
  draggedOpportunityId,
  movingOpportunityId,
  onDragStart,
  onDragEnd,
  className,
}: PipelineColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Carregamento progressivo: quando o fim da lista desta coluna se aproxima, pede o próximo lote.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore(stage.key);
      },
      { root, rootMargin: "240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // opportunities.length: se o lote não preencheu a coluna, o sentinela segue visível e pede mais.
  }, [hasMore, onLoadMore, stage.key, opportunities.length]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-[min(85vw,300px)] shrink-0 snap-start flex-col rounded-2xl border border-home-border/80 bg-home-surface/50 p-2.5 sm:w-[270px] xl:min-w-[250px] xl:flex-1 xl:basis-[250px]",
        isDragOver && "border-home-orange bg-home-orange/5",
        className,
      )}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOverStage(stage.key);
        // Rolagem vertical da própria coluna enquanto o card é arrastado perto das bordas.
        const list = listRef.current;
        if (!list) return;
        const bounds = list.getBoundingClientRect();
        if (event.clientY < bounds.top + EDGE_SCROLL_PX) list.scrollTop -= 16;
        else if (event.clientY > bounds.bottom - EDGE_SCROLL_PX) list.scrollTop += 16;
      }}
      onDragLeave={(event) => {
        const relatedTarget = event.relatedTarget;
        if (!(relatedTarget instanceof Node) || !event.currentTarget.contains(relatedTarget)) {
          onDragOverStage(null);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDropOpportunity(stage.key);
      }}
    >
      {/* Cabeçalho fixo da coluna */}
      <div className="mb-2.5 shrink-0 rounded-xl border border-home-border/60 bg-home-surface/80 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-tight">{stage.title}</h3>
          <ArrowUpDown className="size-3 text-home-muted/70" />
        </div>

        <div className="mt-1 flex items-baseline justify-between text-xs">
          <span className="font-bold text-white">
            {countLoading ? "…" : stage.count.toLocaleString("pt-BR")}
          </span>
          <span className="text-[11px] font-medium text-home-muted">{stage.totalValue}</span>
        </div>

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

      {/* Cards: rolagem vertical independente por coluna */}
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-0.5"
      >
        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            isSelected={selectedOpportunityId === opp.id}
            onSelect={onSelectOpportunity}
            draggable={movingOpportunityId == null}
            isDragging={draggedOpportunityId === opp.id}
            isUpdating={movingOpportunityId === opp.id}
            onDragStart={() => onDragStart(opp.id)}
            onDragEnd={onDragEnd}
          />
        ))}

        {loading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-6 text-[11px] text-home-muted">
            <Loader2 className="size-3 animate-spin" /> Carregando...
          </div>
        ) : null}

        {!loading && opportunities.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-home-border/40 p-6 text-center text-[11px] text-home-muted">
            Nenhuma oportunidade nesta etapa
          </div>
        )}

        {hasMore ? (
          <div
            ref={sentinelRef}
            className="flex shrink-0 items-center justify-center gap-2 py-2 text-[11px] text-home-muted"
          >
            {loadingMore ? (
              <>
                <Loader2 className="size-3 animate-spin" /> Carregando mais...
              </>
            ) : (
              <span>
                {countLoading
                  ? `${opportunities.length.toLocaleString("pt-BR")} carregados`
                  : `${opportunities.length.toLocaleString("pt-BR")} de ${stage.count.toLocaleString("pt-BR")}`}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// O objeto da etapa é recriado a cada render do hook; o que importa para redesenhar são seus campos.
export const PipelineColumn = memo(PipelineColumnBase, (previous, next) => {
  const { stage: a, ...restA } = previous;
  const { stage: b, ...restB } = next;
  return (
    a.key === b.key &&
    a.count === b.count &&
    a.totalValue === b.totalValue &&
    a.title === b.title &&
    (Object.keys(restA) as Array<keyof typeof restA>).every((key) => restA[key] === restB[key])
  );
});
