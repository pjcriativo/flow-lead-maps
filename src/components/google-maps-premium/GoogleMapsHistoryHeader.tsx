import { ChevronRight, Download, MapPin, Plus, Search } from "lucide-react";

interface GoogleMapsHistoryHeaderProps {
  quickSearch: string;
  onChangeQuickSearch: (value: string) => void;
  onExportar: () => void;
  onNovaBusca: () => void;
  onVoltarConfig: () => void;
}

export function GoogleMapsHistoryHeader({
  quickSearch,
  onChangeQuickSearch,
  onExportar,
  onNovaBusca,
  onVoltarConfig,
}: GoogleMapsHistoryHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb Oficial */}
      <nav
        aria-label="Navegação"
        className="flex items-center gap-1.5 text-xs text-home-muted select-none"
      >
        <button
          type="button"
          onClick={onVoltarConfig}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Google Maps
        </button>
        <ChevronRight className="size-3.5 text-home-muted/60" />
        <span className="font-semibold text-white">Histórico de Buscas</span>
      </nav>

      {/* Cabeçalho Principal e Ações Superiores */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Ícone Squircle Laranja, Título e Subtítulo */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.35)]">
            <MapPin className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Histórico de Buscas</h1>
            <p className="text-xs text-home-muted mt-0.5 max-w-2xl">
              Acompanhe todas as suas prospecções realizadas, consulte os resultados, acesse as
              listas criadas e retome suas estratégias.
            </p>
          </div>
        </div>

        {/* Lado Direito: Buscar no histórico, Exportar histórico e + Nova busca */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Campo Rápido: Buscar no histórico */}
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => onChangeQuickSearch(e.target.value)}
              placeholder="Buscar no histórico..."
              className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface/90 pl-9 pr-3 text-xs text-home-foreground placeholder:text-home-muted/80 outline-none transition-colors focus:border-home-orange/60 focus:ring-1 focus:ring-home-orange/30"
            />
          </div>

          {/* Botão: Exportar histórico */}
          <button
            type="button"
            onClick={onExportar}
            className="flex h-9.5 items-center gap-2 rounded-xl border border-home-border bg-home-surface/90 px-3.5 text-xs font-semibold text-white transition-all hover:bg-home-surface-strong hover:border-home-border-strong cursor-pointer shadow-sm"
          >
            <Download className="size-3.5 text-home-muted" />
            <span>Exportar histórico</span>
          </button>

          {/* Botão: + Nova busca (Laranja Primário) */}
          <button
            type="button"
            onClick={onNovaBusca}
            className="flex h-9.5 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all hover:bg-home-orange-dark cursor-pointer active:scale-[0.98]"
          >
            <Plus className="size-4" />
            <span>Nova busca</span>
          </button>
        </div>
      </div>
    </div>
  );
}
