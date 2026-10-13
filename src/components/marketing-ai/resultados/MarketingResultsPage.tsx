import React, { useState } from "react";
import { MarketingResultsHeader } from "./MarketingResultsHeader";
import { MarketingResultsKpis } from "./MarketingResultsKpis";
import { MarketingResultsSubnav } from "./MarketingResultsSubnav";
import { RevenueInvestmentChart } from "./RevenueInvestmentChart";
import { LeadsByChannelChart } from "./LeadsByChannelChart";
import { ChannelPerformanceChart } from "./ChannelPerformanceChart";
import { MarketingConversionFunnel } from "./MarketingConversionFunnel";
import { TopCampaignsTable } from "./TopCampaignsTable";
import { MarketingResultsAssistantPanel } from "./MarketingResultsAssistantPanel";
import { GerarRelatorioModal } from "./GerarRelatorioModal";
import { CampanhaDetalhesDrawer } from "./CampanhaDetalhesDrawer";
import { AnalisarResultadosModal } from "./AnalisarResultadosModal";
import type { TopCampaignItem, AssistantActionItem } from "./resultados-data";

export const MarketingResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("visao_geral");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  // Modals & Drawer State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AssistantActionItem | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<TopCampaignItem | null>(null);

  const handleOpenAnalysis = (action?: AssistantActionItem) => {
    setSelectedAction(action || null);
    setIsAnalysisModalOpen(true);
  };

  const handleSelectCampaign = (camp: TopCampaignItem) => {
    setSelectedCampaign(camp);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-7 space-y-5 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb, Title and Top-right Banner */}
      <MarketingResultsHeader onAnalisarAgora={() => handleOpenAnalysis()} />

      {/* 2. Top 6 KPI Indicator Cards */}
      <MarketingResultsKpis />

      {/* 3. Subnav Tabs & Period Selector */}
      <MarketingResultsSubnav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* 4. Main Content Grid: Left Charts/Tables (approx 72%) & Right Assistant Panel (approx 28%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Visual Analytics & Campaign Table */}
        <div className="xl:col-span-9 space-y-5">
          {/* Row 1: Receita vs Investimento + Leads por canal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <RevenueInvestmentChart />
            </div>
            <div className="lg:col-span-5">
              <LeadsByChannelChart />
            </div>
          </div>

          {/* Row 2: Desempenho por canal + Conversões por etapa (Funil) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7">
              <ChannelPerformanceChart />
            </div>
            <div className="lg:col-span-5">
              <MarketingConversionFunnel
                onStageClick={(stageId) => {
                  console.log("Stage clicked:", stageId);
                }}
              />
            </div>
          </div>

          {/* Row 3: Melhores Campanhas Table */}
          <TopCampaignsTable
            onSelectCampaign={handleSelectCampaign}
            onViewAll={() => setActiveTab("campanhas")}
          />
        </div>

        {/* Right Column: AI Results Assistant & Smart Insights */}
        <div className="xl:col-span-3 space-y-5">
          <MarketingResultsAssistantPanel
            onActionClick={(action) => handleOpenAnalysis(action)}
            onGenerateReport={() => setIsReportModalOpen(true)}
            onViewAllInsights={() => console.log("Ver todos os insights")}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      <GerarRelatorioModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <AnalisarResultadosModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        selectedAction={selectedAction}
      />

      <CampanhaDetalhesDrawer
        campaign={selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onToggleStatus={(id) => {
          console.log("Toggle status campaign:", id);
        }}
      />
    </div>
  );
};

export default MarketingResultsPage;
