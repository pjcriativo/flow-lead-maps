import { useState } from "react";
import { toast } from "sonner";
import { MarketingTopBar } from "../MarketingTopBar";
import { ComoFuncionaModal } from "../ComoFuncionaModal";
import { AgentesHeader } from "./AgentesHeader";
import { AgentesKpiCards } from "./AgentesKpiCards";
import { AgentesSubnavTabs, type AgentesTabId } from "./AgentesSubnavTabs";
import { AgentCard } from "./AgentCard";
import { RecentStrategiesSection } from "./RecentStrategiesSection";
import { AgentesSidebarPanel } from "./AgentesSidebarPanel";
import { NovoAgenteModal } from "./NovoAgenteModal";
import { EstrategiaDetalhesDrawer } from "./EstrategiaDetalhesDrawer";
import {
  AGENTES_ITEMS,
  AGENTES_KPIS,
  RECENT_STRATEGIES,
  STRATEGIC_INSIGHTS,
  type AgentItem,
  type StrategyItem,
} from "./agentes-data";

interface AgentesEstrategiasPageProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onNavigateToProdutos?: () => void;
  onNavigateToCampanhas?: () => void;
}

export function AgentesEstrategiasPage({
  user,
  unreadNotifications = 1,
  onNavigateToProdutos,
  onNavigateToCampanhas,
}: AgentesEstrategiasPageProps) {
  const [agents, setAgents] = useState<AgentItem[]>(AGENTES_ITEMS);
  const [kpis] = useState(AGENTES_KPIS);
  const [strategies] = useState<StrategyItem[]>(RECENT_STRATEGIES);
  const [insights] = useState(STRATEGIC_INSIGHTS);

  // Estados de Navegação Interna
  const [activeTab, setActiveTab] = useState<AgentesTabId>("meus_agentes");
  const [isComoFuncionaOpen, setIsComoFuncionaOpen] = useState(false);
  const [isNovoAgenteOpen, setIsNovoAgenteOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyItem | null>(null);

  const handleConfigureAgent = (agent: AgentItem) => {
    toast.info(`Painel de configuração do "${agent.name}" em preparação operacional.`);
  };

  const handleViewStrategy = (strategy: StrategyItem) => {
    setSelectedStrategy(strategy);
  };

  const handleCriarCampanha = (strategy?: StrategyItem) => {
    if (onNavigateToCampanhas) {
      toast.info(
        strategy
          ? `Criando campanha baseada na estratégia "${strategy.title}".`
          : "Iniciando criação de campanha.",
      );
      onNavigateToCampanhas();
    } else {
      toast.info("Módulo de campanhas acionado.");
    }
  };

  const handleTabChange = (tabId: AgentesTabId) => {
    if (tabId !== "meus_agentes") {
      toast.info(
        "Esta seção faz parte da próxima fase de inteligência profunda de mercado.",
        { duration: 3500 },
      );
      setActiveTab(tabId);
    } else {
      setActiveTab("meus_agentes");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d13] text-home-foreground">
      {/* Topbar Global Superior */}
      <MarketingTopBar
        user={user}
        unreadNotifications={unreadNotifications}
      />

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabeçalho com Breadcrumb, Título e Banner */}
        <AgentesHeader
          onOpenComoFunciona={() => setIsComoFuncionaOpen(true)}
          onNavigateToProdutos={onNavigateToProdutos}
        />

        {/* 6 Indicadores Estratégicos Superiores */}
        <AgentesKpiCards kpis={kpis} />

        {/* Layout Dividido: Área Principal (75%) + Assistente Lateral (25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Principal da Esquerda (8 a 9 colunas de 12) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {/* Abas Subnav + Botão Novo Agente */}
            <AgentesSubnavTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onOpenNovoAgente={() => setIsNovoAgenteOpen(true)}
            />

            {activeTab === "meus_agentes" ? (
              <>
                {/* Bloco 1: Agentes de IA */}
                <div className="space-y-3.5">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      Agentes de IA
                    </h2>
                    <p className="text-xs text-home-muted mt-0.5">
                      Configure e gerencie seus agentes especializados para diferentes áreas de
                      marketing e vendas.
                    </p>
                  </div>

                  {/* 4 Cards de Agentes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {agents.map((agent) => (
                      <AgentCard
                        key={agent.id}
                        agent={agent}
                        onConfigure={handleConfigureAgent}
                      />
                    ))}
                  </div>
                </div>

                {/* Bloco 2: Estratégias Recentes */}
                <RecentStrategiesSection
                  strategies={strategies}
                  onViewStrategy={handleViewStrategy}
                />
              </>
            ) : (
              /* Estado da Aba Quando em Outra Seção */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-home-border/80 bg-[#121620]/90 py-20 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff751a] mb-3">
                  <span className="text-xl font-bold">✨</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Módulo em Preparação
                </h3>
                <p className="mt-1.5 text-xs text-home-muted max-w-md">
                  A visualização avançada desta aba será liberada na próxima etapa da esteira de
                  Agentes de IA.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("meus_agentes")}
                  className="mt-4 rounded-xl bg-home-surface hover:bg-home-surface-strong border border-home-border px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Voltar para Meus agentes
                </button>
              </div>
            )}
          </div>

          {/* Coluna Lateral da Direita (4 colunas de 12) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <AgentesSidebarPanel
              userName={user.name ? user.name.split(" ")[0] : "Carlos"}
              insights={insights}
              onCriarCampanha={() => handleCriarCampanha()}
            />
          </div>
        </div>
      </div>

      {/* Modal: Como Funciona */}
      <ComoFuncionaModal
        isOpen={isComoFuncionaOpen}
        onClose={() => setIsComoFuncionaOpen(false)}
      />

      {/* Modal: Novo Agente */}
      <NovoAgenteModal
        isOpen={isNovoAgenteOpen}
        onClose={() => setIsNovoAgenteOpen(false)}
        onSave={(newAgent) => setAgents((prev) => [...prev, newAgent])}
      />

      {/* Drawer: Detalhes da Estratégia */}
      <EstrategiaDetalhesDrawer
        strategy={selectedStrategy}
        isOpen={Boolean(selectedStrategy)}
        onClose={() => setSelectedStrategy(null)}
        onCriarCampanha={(s) => handleCriarCampanha(s)}
      />
    </div>
  );
}
