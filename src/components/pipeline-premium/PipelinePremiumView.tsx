import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import { cn } from "@/lib/utils";
import {
  MOCK_OPPORTUNITIES,
  PIPELINE_METRICS,
  PIPELINE_STAGES,
  type OpportunityItem,
  type PipelineStageKey,
} from "./pipeline-premium-data";
import { PipelineBoard } from "./PipelineBoard";
import { PipelineFiltersBar } from "./PipelineFiltersBar";
import { PipelineHeader } from "./PipelineHeader";
import { PipelineStatsCards } from "./PipelineStatsCards";
import { OpportunityDetailsPanel } from "./OpportunityDetailsPanel";

interface PipelinePremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
}

export function PipelinePremiumView({
  user = {
    name: "Marcos Gonçalves",
    avatarUrl: "",
    initials: "MG",
  },
  unreadNotifications = 3,
}: PipelinePremiumViewProps) {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(MOCK_OPPORTUNITIES);
  // Por padrão, a primeira oportunidade (Clínica Odonto Prime) fica selecionada, exatamente como na tela aprovada
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(
    MOCK_OPPORTUNITIES[0] || null,
  );

  // Controles de visualização e filtros
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedResponsible, setSelectedResponsible] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");

  // Filtra as oportunidades conforme os critérios
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          opp.company.toLowerCase().includes(q) ||
          opp.category.toLowerCase().includes(q) ||
          (opp.contactName && opp.contactName.toLowerCase().includes(q)) ||
          opp.value.toLowerCase().includes(q) ||
          (opp.tags && opp.tags.some((t) => t.toLowerCase().includes(q)));

        if (!matchesQuery) return false;
      }

      // Canal
      if (selectedChannel !== "all" && opp.channel !== selectedChannel) {
        return false;
      }

      // Etapa
      if (selectedStage !== "all" && opp.stage !== selectedStage) {
        return false;
      }

      // Tag
      if (selectedTag !== "all" && (!opp.tags || !opp.tags.includes(selectedTag))) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, selectedChannel, selectedStage, selectedTag]);

  const handleSelectOpportunity = (opp: OpportunityItem) => {
    setSelectedOpportunity(opp);
  };

  const handleClosePanel = () => {
    setSelectedOpportunity(null);
  };

  const handleNewOpportunity = () => {
    toast.info("Nova oportunidade: Abrindo modal para cadastrar oportunidade comercial.");
  };

  const handleAddLeadToStage = (stageKey: string) => {
    toast.info(`Adicionar lead à etapa: ${stageKey}`);
  };

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      {/* Topbar com busca global e perfil */}
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        {/* Cabeçalho da página: Título + Alternância Kanban/Lista + Filtros de Topo + Botão Primário */}
        <PipelineHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          selectedResponsible={selectedResponsible}
          onResponsibleChange={setSelectedResponsible}
          onNewOpportunity={handleNewOpportunity}
        />

        {/* Linha de Indicadores / Métricas (5 Cards) */}
        <PipelineStatsCards metrics={PIPELINE_METRICS} />

        {/* Barra de Filtros */}
        <PipelineFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          selectedStage={selectedStage}
          onStageChange={setSelectedStage}
          selectedResponsible={selectedResponsible}
          onResponsibleChange={setSelectedResponsible}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          activeFilterCount={2}
          onOpenMoreFilters={() => toast.info("Painel de filtros avançados")}
        />

        {/* Composição: Funil Kanban (6 Colunas) + Painel Lateral Direito */}
        <section
          className={cn(
            "grid gap-4 items-start",
            selectedOpportunity
              ? "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] 2xl:grid-cols-[1fr_420px]"
              : "grid-cols-1",
          )}
        >
          {/* Funil Kanban */}
          <div className="min-w-0">
            <PipelineBoard
              stages={PIPELINE_STAGES}
              opportunities={filteredOpportunities}
              selectedOpportunityId={selectedOpportunity?.id || null}
              onSelectOpportunity={handleSelectOpportunity}
              onAddLead={handleAddLeadToStage}
            />
          </div>

          {/* Painel Lateral Direito de Detalhes da Oportunidade */}
          {selectedOpportunity && (
            <div className="min-w-0 sticky top-5">
              <OpportunityDetailsPanel
                opportunity={selectedOpportunity}
                onClose={handleClosePanel}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
