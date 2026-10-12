import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
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
  selectedTag: string;
  onTagChange: (value: string) => void;
  activeFilterCount?: number;
  onOpenMoreFilters?: () => void;
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
  selectedTag,
  onTagChange,
  activeFilterCount = 2,
  onOpenMoreFilters,
  className,
}: PipelineFiltersBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5",
        className,
      )}
    >
      {/* Search Input */}
      <div className="relative min-w-[240px] flex-1 sm:min-w-[280px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar oportunidades..."
          className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface/90 pl-10 pr-4 text-xs text-white placeholder:text-home-muted/80 focus:border-home-blue focus:outline-none focus:ring-1 focus:ring-home-blue"
        />
      </div>

      {/* Select 1: Todos os canais */}
      <div className="relative">
        <select
          value={selectedChannel}
          onChange={(e) => onChannelChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todos os canais</option>
          <option value="maps">Google Maps</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 2: Todas as etapas */}
      <div className="relative">
        <select
          value={selectedStage}
          onChange={(e) => onStageChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todas as etapas</option>
          <option value="novo">Novo Lead</option>
          <option value="contato">Em Contato</option>
          <option value="qualificacao">Qualificação</option>
          <option value="proposta">Proposta</option>
          <option value="negociacao">Negociação</option>
          <option value="fechado">Fechado</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 3: Todos os responsáveis */}
      <div className="relative">
        <select
          value={selectedResponsible}
          onChange={(e) => onResponsibleChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todos os responsáveis</option>
          <option value="Marcos Gonçalves">Marcos Gonçalves</option>
          <option value="Equipe Comercial">Equipe Comercial</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 4: Todas as tags */}
      <div className="relative">
        <select
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todas as tags</option>
          <option value="Alto potencial">Alto potencial</option>
          <option value="Médio potencial">Médio potencial</option>
          <option value="Odontologia">Odontologia</option>
          <option value="Saúde">Saúde</option>
          <option value="Tecnologia">Tecnologia</option>
          <option value="Fitness">Fitness</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Button: Mais filtros with Badge 2 */}
      <button
        type="button"
        onClick={onOpenMoreFilters}
        className={cn(
          "inline-flex h-9.5 items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-500/10 px-3.5 text-xs font-semibold text-amber-500 transition-colors",
          "hover:border-amber-500/50 hover:bg-amber-500/20",
        )}
      >
        <SlidersHorizontal className="size-3.5 text-amber-500" />
        <span>Mais filtros</span>
        {activeFilterCount > 0 && (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.5)]">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
