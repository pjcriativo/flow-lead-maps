import { Calendar, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import type { SearchHistoryFilters, SearchHistoryPeriod } from "./google-maps-history-types";

interface GoogleMapsHistoryFiltersProps {
  filters: SearchHistoryFilters;
  onChangeFilters: (filters: SearchHistoryFilters) => void;
  onLimparFiltros: () => void;
  distinctNiches: string[];
  distinctCidadeUf: string[];
  distinctCategorias: string[];
}

export function GoogleMapsHistoryFilters({
  filters,
  onChangeFilters,
  onLimparFiltros,
  distinctNiches,
  distinctCidadeUf,
  distinctCategorias,
}: GoogleMapsHistoryFiltersProps) {
  const hasActiveFilters =
    filters.periodo !== "tudo" ||
    filters.status !== "todos" ||
    filters.nicho !== "todos" ||
    filters.cidadeUf !== "todas" ||
    filters.categoria !== "todas" ||
    filters.buscaTexto.trim().length > 0;

  return (
    <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-3 sm:p-3.5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* 1. Período */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Período
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <select
              value={filters.periodo}
              onChange={(e) =>
                onChangeFilters({ ...filters, periodo: e.target.value as SearchHistoryPeriod })
              }
              aria-label="Filtrar por período"
              className="h-9 w-full appearance-none rounded-xl border border-home-border bg-home-surface pl-8 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong focus:border-home-orange/60 cursor-pointer"
            >
              <option value="7d" className="bg-[#121214] text-white">Últimos 7 dias</option>
              <option value="30d" className="bg-[#121214] text-white">Últimos 30 dias</option>
              <option value="90d" className="bg-[#121214] text-white">Últimos 90 dias</option>
              <option value="tudo" className="bg-[#121214] text-white">Todo o histórico</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>
        </div>

        {/* 2. Status */}
        <div className="flex flex-col gap-1 min-w-[120px] flex-1 sm:flex-initial">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
              aria-label="Filtrar por status"
              className="h-9 w-full appearance-none rounded-xl border border-home-border bg-home-surface pl-3 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong focus:border-home-orange/60 cursor-pointer"
            >
              <option value="todos" className="bg-[#121214] text-white">Todos</option>
              <option value="concluida" className="bg-[#121214] text-white">Concluída</option>
              <option value="parcial" className="bg-[#121214] text-white">Parcial</option>
              <option value="interrompida" className="bg-[#121214] text-white">Interrompida</option>
              <option value="erro" className="bg-[#121214] text-white">Erro</option>
              <option value="nao_confirmado" className="bg-[#121214] text-white">Status não confirmado</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>
        </div>

        {/* 3. Nicho */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Nicho
          </label>
          <div className="relative">
            <select
              value={filters.nicho}
              onChange={(e) => onChangeFilters({ ...filters, nicho: e.target.value })}
              aria-label="Filtrar por nicho"
              className="h-9 w-full appearance-none rounded-xl border border-home-border bg-home-surface pl-3 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong focus:border-home-orange/60 cursor-pointer"
            >
              <option value="todos" className="bg-[#121214] text-white">Todos</option>
              {distinctNiches.map((n) => (
                <option key={n} value={n} className="bg-[#121214] text-white">
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>
        </div>

        {/* 4. Cidade / UF */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Cidade / UF
          </label>
          <div className="relative">
            <select
              value={filters.cidadeUf}
              onChange={(e) => onChangeFilters({ ...filters, cidadeUf: e.target.value })}
              aria-label="Filtrar por cidade e estado"
              className="h-9 w-full appearance-none rounded-xl border border-home-border bg-home-surface pl-3 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong focus:border-home-orange/60 cursor-pointer"
            >
              <option value="todas" className="bg-[#121214] text-white">Todas</option>
              {distinctCidadeUf.map((loc) => (
                <option key={loc} value={loc} className="bg-[#121214] text-white">
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>
        </div>

        {/* 5. Categoria */}
        <div className="flex flex-col gap-1 min-w-[130px] flex-1 sm:flex-initial">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Categoria
          </label>
          <div className="relative">
            <select
              value={filters.categoria}
              onChange={(e) => onChangeFilters({ ...filters, categoria: e.target.value })}
              aria-label="Filtrar por categoria"
              className="h-9 w-full appearance-none rounded-xl border border-home-border bg-home-surface pl-3 pr-7 text-xs text-home-foreground outline-none transition-colors hover:border-home-border-strong focus:border-home-orange/60 cursor-pointer"
            >
              <option value="todas" className="bg-[#121214] text-white">Todas</option>
              {distinctCategorias.map((c) => (
                <option key={c} value={c} className="bg-[#121214] text-white">
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>
        </div>

        {/* 6. Busca textual livre */}
        <div className="flex flex-col gap-1 min-w-[200px] flex-1">
          <label className="text-[10px] font-medium text-home-muted uppercase tracking-wider">
            Busca textual
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <input
              type="text"
              value={filters.buscaTexto}
              onChange={(e) => onChangeFilters({ ...filters, buscaTexto: e.target.value })}
              placeholder="Buscar por nicho, cidade ou nome da lista..."
              className="h-9 w-full rounded-xl border border-home-border bg-home-surface pl-9 pr-3 text-xs text-home-foreground placeholder:text-home-muted/80 outline-none transition-colors focus:border-home-orange/60 focus:ring-1 focus:ring-home-orange/30"
            />
          </div>
        </div>

        {/* 7. Limpar filtros */}
        {hasActiveFilters && (
          <div className="flex items-end self-end pt-5">
            <button
              type="button"
              onClick={onLimparFiltros}
              className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-home-orange hover:text-home-orange-dark transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Limpar filtros</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
