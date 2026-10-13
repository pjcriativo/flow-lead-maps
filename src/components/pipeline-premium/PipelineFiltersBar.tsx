import type { ReactNode } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedChannel: string;
  onChannelChange: (value: string) => void;
  selectedStage: string;
  onStageChange: (value: string) => void;
  selectedResponsible: string;
  onResponsibleChange: (value: string) => void;
  responsibleOptions: Array<{ id: string; label: string }>;
  selectedScore: string;
  onScoreChange: (value: string) => void;
  activeFilterCount?: number;
  onOpenMoreFilters?: () => void;
  onClearFilters: () => void;
  className?: string;
}

export function PipelineFiltersBar({
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedStage,
  onStageChange,
  selectedResponsible,
  onResponsibleChange,
  responsibleOptions,
  selectedScore,
  onScoreChange,
  activeFilterCount = 0,
  onOpenMoreFilters,
  onClearFilters,
  className,
}: PipelineFiltersBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <div className="relative min-w-[240px] flex-1 sm:min-w-[280px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar oportunidades..."
          className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface/90 pl-10 pr-4 text-xs text-white placeholder:text-home-muted/80 focus:border-home-blue focus:outline-none focus:ring-1 focus:ring-home-blue"
        />
      </div>

      <FilterSelect value={selectedChannel} onChange={onChannelChange} label="Origem">
        <option value="all">Todos os canais</option>
        <option value="maps">Google Maps</option>
        <option value="instagram">Instagram</option>
        <option value="linkedin">LinkedIn</option>
        <option value="manual">Cadastro manual</option>
      </FilterSelect>

      <FilterSelect value={selectedStage} onChange={onStageChange} label="Etapa">
        <option value="all">Todas as etapas</option>
        <option value="novo">Novo Lead</option>
        <option value="contato">Em Contato</option>
        <option value="qualificacao">Qualificação</option>
        <option value="proposta">Proposta</option>
        <option value="negociacao">Negociação</option>
        <option value="fechado">Fechado</option>
      </FilterSelect>

      <FilterSelect value={selectedResponsible} onChange={onResponsibleChange} label="Responsável">
        <option value="all">Todos os responsáveis</option>
        <option value="none">Sem responsável</option>
        {responsibleOptions.map((responsible) => (
          <option key={responsible.id} value={responsible.id}>
            {responsible.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect value={selectedScore} onChange={onScoreChange} label="Score">
        <option value="all">Todos os scores</option>
        <option value="high">Alto potencial</option>
        <option value="medium">Médio potencial</option>
        <option value="qualification">Em qualificação</option>
      </FilterSelect>

      <button
        type="button"
        onClick={onOpenMoreFilters}
        className={cn(
          "inline-flex h-9.5 items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-500/10 px-3.5 text-xs font-semibold text-amber-500 transition-colors",
          "hover:border-amber-500/50 hover:bg-amber-500/20",
        )}
      >
        <SlidersHorizontal className="size-3.5" />
        <span>Mais filtros</span>
        {activeFilterCount > 0 ? (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.5)]">
            {activeFilterCount}
          </span>
        ) : null}
      </button>

      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex h-9.5 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold text-home-muted hover:bg-home-surface hover:text-white"
        >
          <X className="size-3.5" /> Limpar
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
    </div>
  );
}
