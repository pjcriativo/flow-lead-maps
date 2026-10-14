import { useState } from "react";
import { toast } from "sonner";
import { Download, X } from "lucide-react";
import { GoogleMapsTopbar } from "./GoogleMapsTopbar";
import { GoogleMapsHistoryHeader } from "./GoogleMapsHistoryHeader";
import { GoogleMapsHistoryIndicators } from "./GoogleMapsHistoryIndicators";
import { GoogleMapsHistoryFilters } from "./GoogleMapsHistoryFilters";
import { GoogleMapsHistoryTable } from "./GoogleMapsHistoryTable";
import { GoogleMapsHistoryDetails } from "./GoogleMapsHistoryDetails";
import { GoogleMapsHistoryPagination } from "./GoogleMapsHistoryPagination";
import { useGoogleMapsHistory } from "./useGoogleMapsHistory";
import type { SearchHistoryItem } from "./google-maps-history-types";

export interface GoogleMapsHistoryViewProps {
  user: {
    name: string;
    email: string;
    avatarUrl: string;
    initials: string;
    role?: string;
  };
  unreadNotifications?: number;
  onNovaBusca: () => void;
  onVoltarParaConfig: () => void;
  onNovaBuscaComCriterios: (criterios: {
    nicho: string;
    categoria?: string;
    cidade: string;
    uf: string;
    raioKm: number;
    limite: number;
    nomeLista?: string;
  }) => void;
  onVerResultadosBusca: (item: SearchHistoryItem) => void;
  onUsarLeads: (item: SearchHistoryItem) => void;
  onOpenMinhasListas?: () => void;
  onOpenLeads?: (leadId?: string) => void;
}

export function GoogleMapsHistoryView({
  user,
  unreadNotifications = 3,
  onNovaBusca,
  onVoltarParaConfig,
  onNovaBuscaComCriterios,
  onVerResultadosBusca,
  onUsarLeads,
  onOpenMinhasListas,
  onOpenLeads,
}: GoogleMapsHistoryViewProps) {
  const {
    paginatedItems,
    totalItems,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    selectedItemLeads,
    loadingLeads,
    selectedRowIds,
    handleToggleSelectRow,
    handleToggleSelectPage,
    handleClearSelection,
    filters,
    setFilters,
    handleLimparFiltros,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    distinctNiches,
    distinctCidadeUf,
    distinctCategorias,
    indicators,
    handleExportCsv,
  } = useGoogleMapsHistory();

  // Controlar se o painel lateral está visível
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);

  // Manipular clique de ordenação
  const handleToggleSort = (field: "dataHora" | "solicitado" | "encontrados") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Ação de Ver Resultados da Busca
  const handleActionVerResultados = (item: SearchHistoryItem) => {
    if (item.hasRecoverableResults) {
      onVerResultadosBusca(item);
    } else if (item.listId) {
      toast.info("Abrindo lista confirmada com os leads persistidos...");
      onOpenMinhasListas?.();
    } else {
      toast.warning("Esta busca foi interrompida ou não gerou leads persistidos recuperáveis.");
    }
  };

  // Ação de Usar Estes Leads
  const handleActionUsarLeads = (item: SearchHistoryItem) => {
    if (item.hasRecoverableResults) {
      onUsarLeads(item);
    } else if (item.listId) {
      toast.info("Acessando leads na Central de Listas...");
      onOpenMinhasListas?.();
    } else {
      toast.warning("Não há leads disponíveis nesta pesquisa para abordagem comercial.");
    }
  };

  // Ação de Nova Busca com Critérios
  const handleActionNovaBuscaComCriterios = (item: SearchHistoryItem) => {
    toast.success(`Critérios de "${item.nicho}" carregados para a nova busca!`);
    onNovaBuscaComCriterios({
      nicho: item.nicho,
      categoria: item.categoria,
      cidade: item.cidade,
      uf: item.uf,
      raioKm: item.raioKm,
      limite: item.solicitado,
      nomeLista: item.nomeLista || undefined,
    });
  };

  const allPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((item) => selectedRowIds.has(item.id));

  return (
    <div className="min-h-screen bg-home-background text-home-foreground pb-12 select-text">
      {/* 1. Topbar Oficial do Flow Business */}
      <GoogleMapsTopbar user={user} unreadNotifications={unreadNotifications} />

      {/* Conteúdo Principal com Máxima Fidelidade Visual */}
      <main className="px-4 sm:px-6 lg:px-8 pt-5 space-y-4.5 max-w-[1720px] mx-auto">
        {/* 2. Cabeçalho: Breadcrumb, Título, Ações Superiores */}
        <GoogleMapsHistoryHeader
          quickSearch={filters.buscaTexto}
          onChangeQuickSearch={(val) => setFilters({ ...filters, buscaTexto: val })}
          onExportar={() => handleExportCsv()}
          onNovaBusca={onNovaBusca}
          onVoltarConfig={onVoltarParaConfig}
        />

        {/* 3. Seis Indicadores Superiores (KPIs da Prospecção) */}
        <GoogleMapsHistoryIndicators indicators={indicators} loading={loading} />

        {/* 4. Barra de Filtros: Período, Status, Nicho, Cidade/UF, Categoria, Busca e Limpar */}
        <GoogleMapsHistoryFilters
          filters={filters}
          onChangeFilters={setFilters}
          onLimparFiltros={handleLimparFiltros}
          distinctNiches={distinctNiches}
          distinctCidadeUf={distinctCidadeUf}
          distinctCategorias={distinctCategorias}
        />

        {/* Barra de Ações em Lote para Seleção Múltipla */}
        {selectedRowIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-home-orange/40 bg-home-orange/10 px-4 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-white font-medium">
              <span className="flex size-5 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white">
                {selectedRowIds.size}
              </span>
              <span>
                {selectedRowIds.size === 1
                  ? "1 busca selecionada"
                  : `${selectedRowIds.size} buscas selecionadas`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExportCsv()}
                className="flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-xs font-semibold text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
              >
                <Download className="size-3 text-home-muted" />
                <span>Exportar selecionadas</span>
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-home-muted hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-3" />
                <span>Limpar seleção</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Composição Principal: Tabela de Buscas (Esquerda) + Painel de Detalhes (Direita) */}
        <div className="flex flex-col lg:flex-row items-start gap-4.5">
          {/* Coluna Principal: Tabela e Paginação */}
          <section className="flex-1 w-full space-y-3 min-w-0">
            <GoogleMapsHistoryTable
              items={paginatedItems}
              selectedItemId={showDetailsPanel ? selectedItemId : null}
              onSelectItem={(item) => {
                setSelectedItemId(item.id);
                setShowDetailsPanel(true);
              }}
              selectedRowIds={selectedRowIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectPage={handleToggleSelectPage}
              allPageSelected={allPageSelected}
              onVerResultados={handleActionVerResultados}
              onNovaBuscaComCriterios={handleActionNovaBuscaComCriterios}
              onOpenLista={onOpenMinhasListas}
              sortField={sortField}
              sortDirection={sortDirection}
              onToggleSort={handleToggleSort}
            />

            {/* Paginação */}
            <GoogleMapsHistoryPagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
            />
          </section>

          {/* Coluna Lateral: Painel de Detalhes da Pesquisa Selecionada */}
          {showDetailsPanel && selectedItem && (
            <GoogleMapsHistoryDetails
              item={selectedItem}
              leads={selectedItemLeads}
              loadingLeads={loadingLeads}
              onClose={() => setShowDetailsPanel(false)}
              onVerResultados={handleActionVerResultados}
              onUsarLeads={handleActionUsarLeads}
              onNovaBuscaComCriterios={handleActionNovaBuscaComCriterios}
              onOpenLista={onOpenMinhasListas}
              onOpenLeads={onOpenLeads}
            />
          )}
        </div>
      </main>
    </div>
  );
}
