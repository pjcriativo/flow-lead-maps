import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedChannel: string;
  onChannelChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedList: string;
  onListChange: (value: string) => void;
  lists: Array<{ id: string; name: string }>;
  selectedResponsible: string;
  onResponsibleChange: (value: string) => void;
  responsibleOptions: Array<{ id: string; label: string }>;
  selectedScore: string;
  onScoreChange: (value: string) => void;
  activeFilterCount?: number;
  onOpenMoreFilters?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export function LeadsFiltersBar({
  searchQuery,
  onSearchChange,
  selectedChannel,
  onChannelChange,
  selectedStatus,
  onStatusChange,
  selectedList,
  onListChange,
  lists,
  selectedResponsible,
  onResponsibleChange,
  responsibleOptions,
  selectedScore,
  onScoreChange,
  activeFilterCount = 2,
  onOpenMoreFilters,
  onClearFilters,
  className,
}: LeadsFiltersBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {/* Search Input */}
      <div className="relative min-w-[260px] flex-1 sm:min-w-[320px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome, empresa, telefone, e-mail..."
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
          <option value="google_maps">Google Maps</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="manual">Cadastro manual</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 2: Todos os status */}
      <div className="relative">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="new">Novo</option>
          <option value="enriched">Enriquecido</option>
          <option value="contacted">Contatado</option>
          <option value="proposta_enviada">Proposta enviada</option>
          <option value="responded">Respondeu</option>
          <option value="meeting">Reunião</option>
          <option value="won">Ganho</option>
          <option value="lost">Perdido</option>
          <option value="nurture">Nutrição</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 3: listas persistidas */}
      <div className="relative">
        <select
          value={selectedList}
          onChange={(e) => onListChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todas as listas</option>
          <option value="none">Sem lista</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      {/* Select 4: Todos os scores */}
      <div className="relative">
        <select
          value={selectedScore}
          onChange={(e) => onScoreChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todos os scores</option>
          <option value="90+">90 ou mais (Excelente)</option>
          <option value="80+">80 a 89 (Alto)</option>
          <option value="70-79">70 a 79 (Médio)</option>
          <option value="below-70">Abaixo de 70</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
      </div>

      <div className="relative">
        <select
          value={selectedResponsible}
          onChange={(e) => onResponsibleChange(e.target.value)}
          className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
        >
          <option value="all">Todos os responsáveis</option>
          <option value="none">Sem responsável</option>
          {responsibleOptions.map((responsible) => (
            <option key={responsible.id} value={responsible.id}>
              {responsible.label}
            </option>
          ))}
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

      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="h-9.5 rounded-xl px-3 text-xs font-semibold text-home-muted transition-colors hover:bg-home-surface hover:text-white"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}
