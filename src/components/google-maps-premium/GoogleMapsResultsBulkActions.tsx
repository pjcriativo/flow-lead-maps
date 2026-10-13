import {
  Download,
  FolderPlus,
  MapPin,
  Send,
  MoreHorizontal,
  CheckSquare,
  Square,
} from "lucide-react";

export interface GoogleMapsResultsBulkActionsProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onAdicionarALista: () => void;
  onExportarSelecionados: () => void;
  onVerNoMapa: () => void;
  onEnviarParaCampanha: () => void;
}

export function GoogleMapsResultsBulkActions({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onToggleSelectAll,
  onAdicionarALista,
  onExportarSelecionados,
  onVerNoMapa,
  onEnviarParaCampanha,
}: GoogleMapsResultsBulkActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-home-border/80 bg-[#101720]/70 px-3.5 py-2.5">
      {/* Checkbox Geral + Contador de Selecionados */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="flex items-center gap-2 text-xs font-semibold text-white hover:text-home-orange transition-colors cursor-pointer select-none"
        >
          {isAllSelected ? (
            <CheckSquare className="size-4 text-home-orange" />
          ) : (
            <Square className="size-4 text-home-muted" />
          )}
          <span>
            {selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? "empresa selecionada" : "empresas selecionadas"}`
              : "Selecionar todos da página"}
          </span>
        </button>
      </div>

      {/* Botões de Ação em Lote */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Adicionar à lista */}
        <button
          type="button"
          onClick={onAdicionarALista}
          disabled={selectedCount === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-surface/90 px-3 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <FolderPlus className="size-3.5 text-home-orange" />
          <span>Adicionar à lista</span>
        </button>

        {/* 2. Exportar selecionados */}
        <button
          type="button"
          onClick={onExportarSelecionados}
          disabled={selectedCount === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-surface/90 px-3 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Download className="size-3.5 text-home-muted" />
          <span>Exportar selecionados</span>
        </button>

        {/* 3. Ver no mapa */}
        <button
          type="button"
          onClick={onVerNoMapa}
          disabled={selectedCount === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-surface/90 px-3 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <MapPin className="size-3.5 text-home-muted" />
          <span>Ver no mapa</span>
        </button>

        {/* 4. Enviar para campanha */}
        <button
          type="button"
          onClick={onEnviarParaCampanha}
          disabled={selectedCount === 0}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-surface/90 px-3 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <Send className="size-3.5 text-home-muted" />
          <span>Enviar para campanha</span>
        </button>

        {/* 5. Mais opções (...) */}
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-home-border bg-home-surface/90 text-home-muted hover:text-white transition-colors cursor-pointer"
          title="Mais opções"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </div>
  );
}
