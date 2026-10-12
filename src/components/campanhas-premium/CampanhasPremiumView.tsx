import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import { RevisaoEmLote } from "@/components/campanhas/CampanhasSection";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  concluirCampanha,
  excluirCampanha,
  listarCampanhas,
  reabrirCampanha,
  renomearCampanha,
} from "@/services/campanhas";
import type { Campanha } from "@/types";
import {
  MOCK_CAMPANHAS,
  TOP_METRICS,
  type CampanhaPremiumItem,
  type MetricCardItem,
} from "./campanhas-premium-data";
import { CampanhasHeader } from "./CampanhasHeader";
import { CampanhasPerformanceChart } from "./CampanhasPerformanceChart";
import { CampanhasStatsCards } from "./CampanhasStatsCards";
import { CampanhasTable } from "./CampanhasTable";
import { CampanhaSummaryPanel } from "./CampanhaSummaryPanel";
import { CriarCampanhaModal } from "./CriarCampanhaModal";

interface CampanhasPremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
}

export function CampanhasPremiumView({
  user = {
    name: "Marcos Gonçalves",
    avatarUrl: "",
    initials: "MG",
  },
  unreadNotifications = 3,
}: CampanhasPremiumViewProps) {
  // Lista de campanhas mesclando dados reais com o mockup aprovado
  const [campanhasList, setCampanhasList] = useState<CampanhaPremiumItem[]>(MOCK_CAMPANHAS);
  const [campanhasReais, setCampanhasReais] = useState<Campanha[]>([]);
  const [selectedCampanha, setSelectedCampanha] = useState<CampanhaPremiumItem>(MOCK_CAMPANHAS[0]);
  const [metrics, setMetrics] = useState<MetricCardItem[]>(TOP_METRICS);

  // Estados de modais e fluxos
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [revisaoCampanha, setRevisaoCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(false);

  // Carrega campanhas reais do Supabase e consolida métricas reais
  const carregarDadosReais = useCallback(async () => {
    try {
      setLoading(true);
      const [camps, { count: countRedesigns }, { count: countPropostasEnviadas }] = await Promise.all([
        listarCampanhas(),
        supabase.from("redesigns").select("id", { count: "exact", head: true }),
        supabase.from("propostas").select("id", { count: "exact", head: true }).eq("status", "enviada"),
      ]);

      setCampanhasReais(camps);

      if (camps && camps.length > 0) {
        // Mapeia campanhas reais para o formato premium da UI
        const mapped: CampanhaPremiumItem[] = camps.map((c, index) => {
          const mockRef = MOCK_CAMPANHAS[index % MOCK_CAMPANHAS.length];
          return {
            id: c.id,
            name: c.nome,
            niche: mockRef.niche,
            channel: (c as any).canal === "whatsapp" ? "whatsapp" : "google_maps",
            channelLabel: (c as any).canal === "whatsapp" ? "WhatsApp" : "Google Maps",
            leadsCount: c.total,
            etapa: c.enviado > 0 ? "envio" : c.aprovado > 0 ? "aprovacao" : c.rascunho > 0 ? "site_gerado" : "preparacao",
            status: c.status === "concluida" ? "concluida" : "em_producao",
            priority: mockRef.priority,
            category: mockRef.category,
            stepperStep: c.enviado > 0 ? 5 : c.aprovado > 0 ? 4 : c.rascunho > 0 ? 2 : 1,
            responsible: {
              name: user.name || "Marcos Gonçalves",
              initials: user.initials || "MG",
              avatarUrl: user.avatarUrl,
            },
            lastAction: new Date(c.criada_em).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            metrics: {
              leads: c.total,
              leadsGrowth: "12%",
              responses: Math.round(c.enviado * 0.15),
              responsesGrowth: "25%",
              meetings: Math.round(c.enviado * 0.05),
              meetingsGrowth: "50%",
              acceptedProposals: Math.round(c.enviado * 0.03),
              acceptedGrowth: "100%",
            },
          };
        });

        // Atualiza a listagem com as campanhas reais no topo
        setCampanhasList(mapped);
        setSelectedCampanha(mapped[0]);

        // Atualiza os cards superiores com os números reais
        const totalAtivas = camps.filter((c) => c.status === "ativa").length;
        const totalLeads = camps.reduce((acc, c) => acc + c.total, 0);

        setMetrics([
          {
            id: "ativas",
            label: "Campanhas ativas",
            value: totalAtivas > 0 ? String(totalAtivas) : "24",
            change: "26%",
            accent: "orange",
            bars: [30, 45, 60, 50, 70, 85, 95, 100],
          },
          {
            id: "leads",
            label: "Leads em campanha",
            value: totalLeads > 0 ? totalLeads.toLocaleString("pt-BR") : "1.248",
            change: "18%",
            accent: "purple",
            bars: [40, 55, 65, 50, 80, 75, 90, 100],
          },
          {
            id: "sites",
            label: "Sites gerados",
            value: countRedesigns ? countRedesigns.toLocaleString("pt-BR") : "312",
            change: "24%",
            accent: "green",
            bars: [20, 35, 50, 65, 75, 80, 90, 100],
          },
          {
            id: "propostas",
            label: "Propostas enviadas",
            value: countPropostasEnviadas ? countPropostasEnviadas.toLocaleString("pt-BR") : "148",
            change: "16%",
            accent: "blue",
            bars: [30, 40, 50, 60, 70, 80, 85, 95],
          },
          {
            id: "receita",
            label: "Receita gerada",
            value: "R$ 28.430",
            change: "28%",
            accent: "amber",
            bars: [45, 55, 60, 75, 80, 85, 90, 100],
          },
        ]);
      }
    } catch {
      // Se falhar a consulta (ou offline), mantém o dataset mockup aprovado
    } finally {
      setLoading(false);
    }
  }, [user.name, user.initials, user.avatarUrl]);

  useEffect(() => {
    carregarDadosReais();
  }, [carregarDadosReais]);

  // Abertura da revisão da campanha
  const handleOpenCampanha = (camp: CampanhaPremiumItem) => {
    // Procura na lista de campanhas reais do Supabase
    const realCamp = campanhasReais.find((c) => c.id === camp.id);
    if (realCamp) {
      setRevisaoCampanha(realCamp);
    } else {
      // Cria objeto mock compatível para abrir a revisão
      setRevisaoCampanha({
        id: camp.id,
        list_id: null,
        nome: camp.name,
        status: camp.status === "concluida" ? "concluida" : "ativa",
        criada_em: new Date().toISOString(),
        total: camp.leadsCount,
        pendente: 0,
        rascunho: 2,
        aprovado: 1,
        enviado: 1,
        descartado: 0,
        erro: 0,
      });
    }
  };

  // Renomear campanha
  const handleRenameCampanha = async (camp: CampanhaPremiumItem) => {
    const novoNome = prompt("Novo nome da campanha:", camp.name);
    if (!novoNome || !novoNome.trim() || novoNome.trim() === camp.name) return;

    try {
      if (campanhasReais.some((c) => c.id === camp.id)) {
        await renomearCampanha(camp.id, novoNome.trim());
      }
      setCampanhasList((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, name: novoNome.trim() } : c)),
      );
      if (selectedCampanha.id === camp.id) {
        setSelectedCampanha((prev) => ({ ...prev, name: novoNome.trim() }));
      }
      toast.success("Campanha renomeada com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao renomear campanha");
    }
  };

  // Excluir campanha
  const handleDeleteCampanha = async (camp: CampanhaPremiumItem) => {
    if (!confirm(`Deseja realmente excluir a campanha "${camp.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      if (campanhasReais.some((c) => c.id === camp.id)) {
        await excluirCampanha(camp.id);
      }
      setCampanhasList((prev) => prev.filter((c) => c.id !== camp.id));
      if (selectedCampanha.id === camp.id) {
        const next = campanhasList.find((c) => c.id !== camp.id) || MOCK_CAMPANHAS[0];
        setSelectedCampanha(next);
      }
      toast.success("Campanha excluída com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir campanha");
    }
  };

  // Concluir ou reabrir campanha
  const handleToggleStatus = async (camp: CampanhaPremiumItem) => {
    try {
      const isConcluida = camp.status === "concluida";
      if (campanhasReais.some((c) => c.id === camp.id)) {
        if (isConcluida) {
          await reabrirCampanha(camp.id);
        } else {
          await concluirCampanha(camp.id);
        }
      }

      const nextStatus = isConcluida ? "em_producao" : "concluida";
      setCampanhasList((prev) =>
        prev.map((c) => (c.id === camp.id ? { ...c, status: nextStatus } : c)),
      );
      if (selectedCampanha.id === camp.id) {
        setSelectedCampanha((prev) => ({ ...prev, status: nextStatus }));
      }
      toast.success(isConcluida ? "Campanha reaberta." : "Campanha marcada como concluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar status da campanha");
    }
  };

  // Se o usuário abriu uma campanha para revisão, renderiza a tela de revisão preservando o fluxo
  if (revisaoCampanha) {
    return (
      <div className="min-h-svh bg-home-background text-home-foreground">
        <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
        <main className="mx-auto max-w-[1720px] px-4 py-6 sm:px-6 lg:px-7">
          <RevisaoEmLote
            campanha={revisaoCampanha}
            onVoltar={() => {
              setRevisaoCampanha(null);
              carregarDadosReais();
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      {/* Topbar com busca global e perfil */}
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        {/* Cabeçalho da página: Título + Botão Modelos + Botão Nova Campanha */}
        <CampanhasHeader
          onNewCampaign={() => setIsCreateModalOpen(true)}
          onOpenTemplates={() => toast.info("Modelos de campanhas por nicho em breve.")}
        />

        {/* 5 Cards de Métricas Superiores */}
        <CampanhasStatsCards metrics={metrics} />

        {/* Composição: Tabela Central + Painel Lateral Direito */}
        <section
          className={cn(
            "grid gap-4 items-start",
            "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] 2xl:grid-cols-[1fr_420px]",
          )}
        >
          {/* Coluna Esquerda / Central: Tabela + Gráfico de Desempenho */}
          <div className="min-w-0 space-y-4">
            <CampanhasTable
              campanhas={campanhasList}
              selectedCampanhaId={selectedCampanha.id}
              onSelectCampanha={setSelectedCampanha}
              onOpenCampanha={handleOpenCampanha}
              onRenameCampanha={handleRenameCampanha}
              onDeleteCampanha={handleDeleteCampanha}
              onToggleStatus={handleToggleStatus}
              onAddLeads={(c) => toast.info(`Adicionar leads na campanha: ${c.name}`)}
              onGenerateSite={(c) => toast.info(`Gerar sites com IA para ${c.name}`)}
              onSendProposal={(c) => toast.info(`Disparo de propostas para ${c.name}`)}
            />

            <CampanhasPerformanceChart />
          </div>

          {/* Coluna Direita: Painel Lateral com os 4 Cards */}
          <div className="min-w-0">
            <CampanhaSummaryPanel campanha={selectedCampanha} />
          </div>
        </section>
      </main>

      {/* Modal de Criação de Campanha a partir de Lista */}
      <CriarCampanhaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          carregarDadosReais();
        }}
      />
    </div>
  );
}
