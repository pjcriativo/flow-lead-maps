import { useCallback, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import type { Campanha } from "@/types";
import { ResultadosActivityTimeline } from "./ResultadosActivityTimeline";
import { ResultadosChannelsCard } from "./ResultadosChannelsCard";
import { ResultadosEvolutionChart } from "./ResultadosEvolutionChart";
import { ResultadosFunnelCard } from "./ResultadosFunnelCard";
import { ResultadosHeader } from "./ResultadosHeader";
import { ResultadosKpiCards } from "./ResultadosKpiCards";
import { ResultadosPerformanceTable } from "./ResultadosPerformanceTable";
import {
  CAMPANHAS_PERFORMANCE_TABLE,
  CHANNELS_DATA,
  EVOLUTION_CHART_DATA,
  FUNNEL_STAGES,
  RECENT_ACTIVITIES,
  RESULTADOS_KPIS,
  type CampanhaPerformanceRow,
} from "./resultados-campanha-data";

interface ResultadosCampanhaViewProps {
  campanha?: Campanha;
  onBackToCentral: () => void;
  onBackToProducao: () => void;
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
}

export function ResultadosCampanhaView({
  campanha,
  onBackToCentral,
  onBackToProducao,
  user = {
    name: "Carlos Mendes",
    avatarUrl: "",
    initials: "CM",
  },
  unreadNotifications = 1,
}: ResultadosCampanhaViewProps) {
  const [kpis] = useState(RESULTADOS_KPIS);
  const [chartData] = useState(EVOLUTION_CHART_DATA);
  const [funnelStages] = useState(FUNNEL_STAGES);
  const [channels] = useState(CHANNELS_DATA);
  const [performanceRows] = useState(CAMPANHAS_PERFORMANCE_TABLE);
  const [activities] = useState(RECENT_ACTIVITIES);

  const campanhaNome = campanha?.nome || "Restaurante Premium SP";

  // Exportar relatório
  const handleExportReport = useCallback(() => {
    const csvContent =
      "Campanha,Canal,Leads,Sites,Enviados,Aberturas,Cliques,Interessados,Status\n" +
      performanceRows
        .map(
          (r) =>
            `"${r.name}","${r.channel}","${r.leads}","${r.sites}","${r.enviados}","${r.aberturas?.count || 0}","${r.cliques?.count || 0}","${r.interessados.count}","${r.status}"`,
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `relatorio-${campanhaNome.toLowerCase().replace(/\s+/g, "-")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de resultados exportado com sucesso.");
  }, [campanhaNome, performanceRows]);

  // Compartilhar relatório
  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do relatório copiado para a área de transferência.");
    } else {
      toast.info("Compartilhamento de relatório em preparação.");
    }
  }, []);

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      {/* Topbar Global */}
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        {/* Cabeçalho da Tela: Breadcrumbs + Título + Status + Ações */}
        <ResultadosHeader
          campanhaNome={campanhaNome}
          status={campanha?.status === "concluida" ? "concluida" : "em_producao"}
          onBackToCentral={onBackToCentral}
          onBackToProducao={onBackToProducao}
          onExportReport={handleExportReport}
          onShare={handleShare}
        />

        {/* 6 Cards Superiores de Indicadores (KPIs) */}
        <ResultadosKpiCards kpis={kpis} />

        {/* Linha Central: Gráfico de Desempenho (Esquerda) + Funil de Conversão (Direita) */}
        <section className="grid gap-4 items-stretch lg:grid-cols-[1.25fr_0.75fr] xl:grid-cols-[1.3fr_0.7fr]">
          <ResultadosEvolutionChart data={chartData} />
          <ResultadosFunnelCard stages={funnelStages} />
        </section>

        {/* Linha Inferior: Tabela de Desempenho (Esquerda) + Canais e Atividades (Direita) */}
        <section className="grid gap-4 items-start lg:grid-cols-[1.25fr_0.75fr] xl:grid-cols-[1.3fr_0.7fr]">
          {/* Tabela de Campanhas com Abas e Filtros */}
          <div className="min-w-0">
            <ResultadosPerformanceTable
              campanhas={performanceRows}
              onSelectCampanha={(c: CampanhaPerformanceRow) => {
                toast.info(`Campanha selecionada: ${c.name}`);
              }}
            />
          </div>

          {/* Coluna Direita: Canais da Campanha + Últimas Atividades */}
          <div className="min-w-0 space-y-4">
            <ResultadosChannelsCard channels={channels} totalEnvios={145} />
            <ResultadosActivityTimeline activities={activities} />
          </div>
        </section>
      </main>
    </div>
  );
}
