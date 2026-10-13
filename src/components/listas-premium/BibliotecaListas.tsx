// Coluna Esquerda: Biblioteca de Listas
import { Search, Plus, Filter, FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListaCard } from "./ListaCard";
import type { LeadListWithFullStats } from "./listas-premium-data";
import type { ListasFilterState } from "./useListasPremium";

interface BibliotecaListasProps {
  listas: LeadListWithFullStats[];
  loading: boolean;
  selectedListId: string | null;
  filters: ListasFilterState;
  filterOptions: {
    fontes: string[];
    nichos: string[];
    cidades: string[];
  };
  onFilterChange: (updater: (prev: ListasFilterState) => ListasFilterState) => void;
  onSelectList: (id: string) => void;
  onOpenSearch: () => void;
  onNewList: () => void;
  onRenameList: (lista: LeadListWithFullStats) => void;
  onExportList: (lista: LeadListWithFullStats) => void;
  onCreateCampaign: (lista: LeadListWithFullStats) => void;
  onDeleteList: (lista: LeadListWithFullStats) => void;
  className?: string;
}

export function BibliotecaListas({
  listas,
  loading,
  selectedListId,
  filters,
  filterOptions,
  onFilterChange,
  onSelectList,
  onOpenSearch,
  onNewList,
  onRenameList,
  onExportList,
  onCreateCampaign,
  onDeleteList,
  className,
}: BibliotecaListasProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-home-border bg-home-surface/90 backdrop-blur-md p-4 sm:p-5 shadow-lg",
        className,
      )}
    >
      {/* Top Header da Biblioteca */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-home-border/80">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Biblioteca de listas
          </h2>
          <p className="text-xs text-home-muted">
            {listas.length} {listas.length === 1 ? "lista disponível" : "listas disponíveis"}
          </p>
        </div>

        {/* Botões Superiores: Nova busca & + Nova lista */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface hover:text-white"
          >
            <Search className="size-3.5 text-home-muted" />
            Nova busca
          </button>

          <button
            type="button"
            onClick={onNewList}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-3.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.3)] transition-all hover:bg-home-orange/90 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            Nova lista
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="space-y-2.5 py-4 border-b border-home-border/80">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Buscar listas por nome, nicho ou região..."
            className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface-strong pl-9.5 pr-4 text-xs text-white placeholder:text-home-muted outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 transition-colors"
          />
        </div>

        {/* Linha de Dropdowns de Filtro */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {/* Fonte */}
          <select
            value={filters.fonte}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, fonte: e.target.value }))
            }
            className="h-8 rounded-lg border border-home-border bg-home-surface-strong px-2 text-[11px] font-medium text-home-foreground outline-none focus:border-amber-500/80 cursor-pointer"
          >
            <option value="todas">Fonte: Todas</option>
            {filterOptions.fontes.map((f) => (
              <option key={f} value={f}>
                Fonte: {f}
              </option>
            ))}
          </select>

          {/* Nicho */}
          <select
            value={filters.nicho}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, nicho: e.target.value }))
            }
            className="h-8 rounded-lg border border-home-border bg-home-surface-strong px-2 text-[11px] font-medium text-home-foreground outline-none focus:border-amber-500/80 cursor-pointer"
          >
            <option value="todos">Nicho: Todos</option>
            {filterOptions.nichos.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          {/* Cidade */}
          <select
            value={filters.cidade}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, cidade: e.target.value }))
            }
            className="h-8 rounded-lg border border-home-border bg-home-surface-strong px-2 text-[11px] font-medium text-home-foreground outline-none focus:border-amber-500/80 cursor-pointer"
          >
            <option value="todas">Cidade: Todas</option>
            {filterOptions.cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange((prev) => ({ ...prev, status: e.target.value }))
            }
            className="h-8 rounded-lg border border-home-border bg-home-surface-strong px-2 text-[11px] font-medium text-home-foreground outline-none focus:border-amber-500/80 cursor-pointer"
          >
            <option value="todos">Status: Todos</option>
            <option value="ativa">Ativa</option>
            <option value="em_estrategia">Em estratégia</option>
            <option value="pausada">Pausada</option>
            <option value="rascunho">Rascunho</option>
          </select>

          {/* Ordenar por */}
          <select
            value={filters.ordenarPor}
            onChange={(e) =>
              onFilterChange((prev) => ({
                ...prev,
                ordenarPor: e.target.value as ListasFilterState["ordenarPor"],
              }))
            }
            className="col-span-2 sm:col-span-1 h-8 rounded-lg border border-home-border bg-home-surface-strong px-2 text-[11px] font-medium text-home-foreground outline-none focus:border-amber-500/80 cursor-pointer"
          >
            <option value="recentes">Mais recentes</option>
            <option value="maior_leads">Mais leads</option>
            <option value="alfabetico">Nome (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Lista de Cards com Scroll Otimizado */}
      <div className="min-h-[460px] max-h-[calc(100vh-380px)] overflow-y-auto space-y-3 pt-3 pr-1 [scrollbar-gutter:stable]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-sm text-home-muted gap-2">
            <Loader2 className="size-6 animate-spin text-amber-500" />
            Carregando biblioteca de listas...
          </div>
        ) : listas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-home-border bg-home-surface-strong/50 p-10 text-center">
            <FolderOpen className="size-8 text-home-muted" />
            <h4 className="mt-3 text-sm font-semibold text-white">Nenhuma lista encontrada</h4>
            <p className="mt-1 text-xs text-home-muted max-w-xs">
              {filters.search
                ? "Tente ajustar os filtros ou os termos de busca para encontrar suas listas salvas."
                : "Realize uma busca em Canais de Aquisição para gerar sua primeira lista comercial."}
            </p>
            <button
              type="button"
              onClick={onOpenSearch}
              className="mt-4 flex h-8 items-center gap-1.5 rounded-lg bg-home-orange px-3 text-xs font-semibold text-white"
            >
              <Search className="size-3.5" />
              Iniciar prospecção
            </button>
          </div>
        ) : (
          listas.map((lista) => (
            <ListaCard
              key={lista.id}
              lista={lista}
              isSelected={selectedListId === lista.id}
              onSelect={() => onSelectList(lista.id)}
              onRename={onRenameList}
              onExport={onExportList}
              onCreateCampaign={onCreateCampaign}
              onDelete={onDeleteList}
            />
          ))
        )}
      </div>
    </div>
  );
}
