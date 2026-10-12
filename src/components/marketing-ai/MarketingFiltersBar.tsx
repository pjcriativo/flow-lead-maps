import { ChevronDown, LayoutGrid, List, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductStatus } from "./marketing-data";

export type ViewMode = "grid" | "list";

interface MarketingFiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todos os status" },
  { value: "ativo", label: "Ativo" },
  { value: "em_analise", label: "Em análise" },
  { value: "rascunho", label: "Rascunho" },
  { value: "pausado", label: "Pausado" },
  { value: "arquivado", label: "Arquivado" },
];

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todas as categorias" },
  { value: "Restaurante", label: "Restaurante" },
  { value: "Hotelaria", label: "Hotelaria" },
  { value: "Saúde e Bem-estar", label: "Saúde e Bem-estar" },
  { value: "Imóveis", label: "Imóveis" },
  { value: "Consultoria", label: "Consultoria" },
  { value: "Beleza e Estética", label: "Beleza e Estética" },
];

export function MarketingFiltersBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  viewMode,
  onViewModeChange,
}: MarketingFiltersBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
      {/* Busca por Produto ou Serviço */}
      <div className="relative flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar produtos ou serviços..."
          className="h-9 w-full rounded-xl border border-home-border/80 bg-[#121620] pl-9.5 pr-4 text-xs text-home-foreground placeholder:text-home-muted/80 outline-none transition-colors focus:border-home-orange focus:ring-1 focus:ring-home-orange/30"
        />
      </div>

      {/* Filtros de Status, Categoria e Alternador Grid/Lista */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Filtro Status */}
        <div className="relative">
          <select
            value={statusFilter}
            aria-label="Filtro de status"
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-home-border/80 bg-[#121620] pl-3.5 pr-8 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border focus:border-home-orange cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#121620] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
        </div>

        {/* Filtro Categoria */}
        <div className="relative">
          <select
            value={categoryFilter}
            aria-label="Filtro de categoria"
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-9 appearance-none rounded-xl border border-home-border/80 bg-[#121620] pl-3.5 pr-8 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border focus:border-home-orange cursor-pointer"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#121620] text-white">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
        </div>

        {/* Alternância Grid e Lista */}
        <div className="flex items-center rounded-xl border border-home-border/80 bg-[#121620] p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-label="Visualização em grade"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
              viewMode === "grid"
                ? "bg-home-surface-strong text-white shadow-sm"
                : "text-home-muted hover:text-white",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-label="Visualização em lista"
            className={cn(
              "flex size-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
              viewMode === "list"
                ? "bg-home-surface-strong text-white shadow-sm"
                : "text-home-muted hover:text-white",
            )}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
