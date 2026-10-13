// Visão Principal da Central de Listas Premium do Flow Business
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ListasTopbar } from "./ListasTopbar";
import { ListasHeader } from "./ListasHeader";
import { ListasStatsCards } from "./ListasStatsCards";
import { BibliotecaListas } from "./BibliotecaListas";
import { ListaDetailsPanel } from "./ListaDetailsPanel";
import { RenomearListaModal } from "./RenomearListaModal";
import { NovaListaModal } from "./NovaListaModal";
import { CriarCampanhaModal } from "@/components/campanhas-premium/CriarCampanhaModal";
import { exportLeadsCsv, type LeadListWithFullStats } from "./listas-premium-data";
import { useListasPremium } from "./useListasPremium";

export interface ListasPremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
    plan?: string;
  };
  unreadNotifications?: number;
  onOpenSearch?: () => void;
  onOpenLeads?: (listId?: string) => void;
  onOpenCampaigns?: (campId?: string) => void;
  onBack?: () => void;
}

export function ListasPremiumView({
  user = {
    name: "João Silva",
    avatarUrl: "",
    initials: "JS",
    plan: "Plano Pro",
  },
  unreadNotifications = 0,
  onOpenSearch = () => {},
  onOpenLeads = () => {},
  onOpenCampaigns = () => {},
  onBack,
}: ListasPremiumViewProps) {
  const {
    listas,
    filteredListas,
    loading,
    selectedListId,
    selectedList,
    selectedLeads,
    leadsLoading,
    linkedCampaigns,
    kpis,
    filters,
    setFilters,
    filterOptions,
    setSelectedListId,
    refresh,
    handleRenomear,
    handleExcluir,
  } = useListasPremium();

  // Modais
  const [renomearTarget, setRenomearTarget] = useState<LeadListWithFullStats | null>(null);
  const [isNovaListaOpen, setIsNovaListaOpen] = useState(false);
  const [isCriarCampanhaOpen, setIsCriarCampanhaOpen] = useState(false);

  const handleOpenRename = (lista: LeadListWithFullStats) => {
    setRenomearTarget(lista);
  };

  const handleExport = (lista: LeadListWithFullStats) => {
    if (selectedList && selectedList.id === lista.id && selectedLeads.length > 0) {
      exportLeadsCsv(selectedLeads, lista.name);
      toast.success(`Exportando ${selectedLeads.length} leads de "${lista.name}"...`);
    } else {
      toast.info(`Exportando lista "${lista.name}"...`);
    }
  };

  return (
    <div className="min-h-svh w-full bg-home-background text-home-foreground flex flex-col">
      {/* 🟢 Topbar Fixa com Busca Global e Perfil */}
      <ListasTopbar
        user={user}
        unreadNotifications={unreadNotifications}
        onBack={onBack}
        onSearchGlobal={(query) => {
          setFilters((prev) => ({ ...prev, search: query }));
        }}
      />

      {/* 🟢 Conteúdo Principal */}
      <main className="mx-auto w-full max-w-[1780px] flex-1 space-y-4 px-3 py-4 sm:px-5 sm:py-5 lg:px-7">
        {/* Cabeçalho "Minhas Listas" com Background Fotográfico de Montanhas */}
        <ListasHeader />

        {/* 5 Indicadores Superiores da Referência Aprovada */}
        <ListasStatsCards kpis={kpis} />

        {/* Grid Principal: Biblioteca de Listas (Esquerda) + Painel Detalhado (Direita) */}
        <div className="grid grid-cols-1 gap-4 items-start lg:grid-cols-12">
          {/* Coluna Esquerda: Biblioteca de Listas (4 cols no lg / 5 cols no xl) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 min-w-0">
            <BibliotecaListas
              listas={filteredListas}
              loading={loading}
              selectedListId={selectedListId}
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={setFilters}
              onSelectList={setSelectedListId}
              onOpenSearch={onOpenSearch}
              onNewList={() => setIsNovaListaOpen(true)}
              onRenameList={handleOpenRename}
              onExportList={handleExport}
              onCreateCampaign={(l) => {
                setSelectedListId(l.id);
                setIsCriarCampanhaOpen(true);
              }}
              onDeleteList={(l) => handleExcluir(l.id)}
            />
          </div>

          {/* Coluna Direita: Painel Detalhado da Lista Selecionada (7 cols no lg / 7 cols no xl) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 min-w-0">
            {selectedList ? (
              <ListaDetailsPanel
                lista={selectedList}
                leads={selectedLeads}
                leadsLoading={leadsLoading}
                linkedCampaigns={linkedCampaigns}
                onRename={() => handleOpenRename(selectedList)}
                onExport={() => handleExport(selectedList)}
                onCreateCampaign={() => setIsCriarCampanhaOpen(true)}
                onOpenLeadsCentral={() => onOpenLeads(selectedList.id)}
                onOpenCampaignsCentral={() => onOpenCampaigns()}
              />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-home-border bg-home-surface/60 p-16 text-center text-home-muted">
                <p className="text-sm font-semibold text-white">Nenhuma lista selecionada</p>
                <p className="mt-1 text-xs max-w-sm">
                  Selecione uma lista na biblioteca à esquerda para visualizar suas estratégias, campanhas e leads.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 🟢 MODAL: Renomear Lista */}
      <RenomearListaModal
        isOpen={Boolean(renomearTarget)}
        lista={renomearTarget}
        onClose={() => setRenomearTarget(null)}
        onConfirm={async (novoNome) => {
          if (renomearTarget) {
            await handleRenomear(renomearTarget.id, novoNome);
          }
        }}
      />

      {/* 🟢 MODAL: Nova Lista Comercial */}
      <NovaListaModal
        isOpen={isNovaListaOpen}
        onClose={() => setIsNovaListaOpen(false)}
        onOpenSearch={onOpenSearch}
        onOpenLeadsCentral={() => onOpenLeads()}
      />

      {/* 🟢 MODAL: Criar Campanha a partir da Lista */}
      <CriarCampanhaModal
        isOpen={isCriarCampanhaOpen}
        onClose={() => setIsCriarCampanhaOpen(false)}
        onCreated={() => {
          setIsCriarCampanhaOpen(false);
          refresh();
          toast.success("Campanha iniciada com sucesso a partir da lista selecionada.");
        }}
      />
    </div>
  );
}
