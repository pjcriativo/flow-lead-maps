import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import { GestaoProducaoView } from "./GestaoProducaoView";
import { ResultadosCampanhaView } from "./ResultadosCampanhaView";
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
import { type CampanhaPremiumItem, type MetricCardItem } from "./campanhas-premium-data";
import { CampanhasHeader } from "./CampanhasHeader";
import { CampanhasPerformanceChart } from "./CampanhasPerformanceChart";
import { CampanhasStatsCards } from "./CampanhasStatsCards";
import { CampanhasTable } from "./CampanhasTable";
import { CampanhaSummaryPanel } from "./CampanhaSummaryPanel";
import { CriarCampanhaModal } from "./CriarCampanhaModal";
import { SelecionarCampanhaModal } from "./SelecionarCampanhaModal";

export type CampanhasSubView = "central" | "gestao" | "resultados";

export interface CampanhasPremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  activeSubView?: CampanhasSubView;
  onSubViewChange?: (subView: CampanhasSubView) => void;
  selectedCampanhaContext?: Campanha | null;
  onSelectCampanhaContext?: (c: Campanha | null) => void;
}

export function CampanhasPremiumView({
  user = {
    name: "Usuário",
    avatarUrl: "",
    initials: "U",
  },
  unreadNotifications = 0,
  activeSubView,
  onSubViewChange,
  selectedCampanhaContext,
  onSelectCampanhaContext,
}: CampanhasPremiumViewProps) {
  // Controle de subview ativa e contexto compartilhado da campanha selecionada
  const [internalSubView, setInternalSubView] = useState<CampanhasSubView>("central");
  const [internalCampanha, setInternalCampanha] = useState<Campanha | null>(null);

  const currentSubView = activeSubView ?? internalSubView;
  const currentCampanha =
    selectedCampanhaContext !== undefined ? selectedCampanhaContext : internalCampanha;

  const handleSubViewChange = (sub: CampanhasSubView) => {
    setInternalSubView(sub);
    onSubViewChange?.(sub);
  };

  const handleSetCampanha = (camp: Campanha | null) => {
    setInternalCampanha(camp);
    onSelectCampanhaContext?.(camp);
  };

  // A central só apresenta registros confirmados pelo backend.
  const [campanhasList, setCampanhasList] = useState<CampanhaPremiumItem[]>([]);
  const [campanhasReais, setCampanhasReais] = useState<Campanha[]>([]);
  const [selectedCampanha, setSelectedCampanha] = useState<CampanhaPremiumItem | null>(null);
  const [metrics, setMetrics] = useState<MetricCardItem[]>([]);

  // Estados de modais e fluxos
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Carrega campanhas reais do Supabase e consolida métricas reais
  const carregarDadosReais = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [camps, redesignsResult, propostasResult] = await Promise.all([
        listarCampanhas(),
        supabase.from("redesigns").select("id", { count: "exact", head: true }),
        supabase
          .from("propostas")
          .select("id", { count: "exact", head: true })
          .eq("status", "enviada"),
      ]);
      if (redesignsResult.error) throw redesignsResult.error;
      if (propostasResult.error) throw propostasResult.error;
      const countRedesigns = redesignsResult.count ?? 0;
      const countPropostasEnviadas = propostasResult.count ?? 0;

      setCampanhasReais(camps);
      const mapped: CampanhaPremiumItem[] = camps.map((c) => ({
        id: c.id,
        name: c.nome,
        niche: "Não informado",
        channel: "email",
        channelLabel: "E-mail",
        leadsCount: c.total,
        etapa:
          c.enviado > 0
            ? "envio"
            : c.aprovado > 0
              ? "aprovacao"
              : c.rascunho > 0
                ? "site_gerado"
                : "preparacao",
        status: c.status === "concluida" ? "concluida" : "em_producao",
        stepperStep: c.enviado > 0 ? 5 : c.aprovado > 0 ? 4 : c.rascunho > 0 ? 2 : 1,
        responsible: {
          name: user.name || "Usuário",
          initials: user.initials || "U",
          avatarUrl: user.avatarUrl,
        },
        lastAction: new Date(c.criada_em).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setCampanhasList(mapped);
      setSelectedCampanha(
        (current) => mapped.find((c) => c.id === current?.id) ?? mapped[0] ?? null,
      );

      const totalAtivas = camps.filter((c) => c.status === "ativa").length;
      const totalLeads = camps.reduce((acc, c) => acc + c.total, 0);
      const totalFalhas = camps.reduce((acc, c) => acc + c.erro, 0);

      setMetrics([
        {
          id: "ativas",
          label: "Campanhas ativas",
          value: String(totalAtivas),
          change: "",
          accent: "orange",
          bars: [],
        },
        {
          id: "leads",
          label: "Leads em campanha",
          value: totalLeads.toLocaleString("pt-BR"),
          change: "",
          accent: "purple",
          bars: [],
        },
        {
          id: "sites",
          label: "Sites gerados",
          value: countRedesigns.toLocaleString("pt-BR"),
          change: "",
          accent: "green",
          bars: [],
        },
        {
          id: "propostas",
          label: "Propostas enviadas",
          value: countPropostasEnviadas.toLocaleString("pt-BR"),
          change: "",
          accent: "blue",
          bars: [],
        },
        {
          id: "falhas",
          label: "Falhas registradas",
          value: totalFalhas.toLocaleString("pt-BR"),
          change: "",
          accent: "amber",
          bars: [],
        },
      ]);
    } catch (error) {
      setCampanhasReais([]);
      setCampanhasList([]);
      setSelectedCampanha(null);
      setMetrics([]);
      setLoadError(error instanceof Error ? error.message : "Falha ao carregar campanhas");
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
    if (!realCamp) {
      toast.error("Campanha não encontrada. Atualize a listagem.");
      return;
    }
    handleSetCampanha(realCamp);
    handleSubViewChange("gestao");
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
      if (selectedCampanha?.id === camp.id) {
        setSelectedCampanha((prev) => (prev ? { ...prev, name: novoNome.trim() } : null));
      }
      toast.success("Campanha renomeada com sucesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao renomear campanha");
    }
  };

  // Excluir campanha
  const handleDeleteCampanha = async (camp: CampanhaPremiumItem) => {
    if (
      !confirm(
        `Deseja realmente excluir a campanha "${camp.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    try {
      if (campanhasReais.some((c) => c.id === camp.id)) {
        await excluirCampanha(camp.id);
      }
      setCampanhasList((prev) => prev.filter((c) => c.id !== camp.id));
      if (selectedCampanha?.id === camp.id) {
        const next = campanhasList.find((c) => c.id !== camp.id) ?? null;
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
      if (selectedCampanha?.id === camp.id) {
        setSelectedCampanha((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      toast.success(isConcluida ? "Campanha reaberta." : "Campanha marcada como concluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao alterar status da campanha");
    }
  };

  // Se a subview for Resultados e Métricas (Tela 3)
  if (currentSubView === "resultados") {
    if (currentCampanha) {
      return (
        <ResultadosCampanhaView
          campanha={currentCampanha}
          user={user}
          unreadNotifications={unreadNotifications}
          onBackToCentral={() => handleSubViewChange("central")}
          onBackToProducao={() => handleSubViewChange("gestao")}
        />
      );
    }

    // Se nenhuma campanha estiver selecionada (Regra 5), apresenta o seletor modal com as campanhas reais
    return (
      <div className="relative min-h-svh bg-home-background">
        <div className="opacity-40 pointer-events-none filter blur-[1px]">
          <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
          <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
            <CampanhasHeader
              onNewCampaign={() => setIsCreateModalOpen(true)}
              onOpenTemplates={() => toast.info("Modelos de campanhas por nicho em breve.")}
            />
            <CampanhasStatsCards metrics={metrics} />
          </main>
        </div>

        <SelecionarCampanhaModal
          isOpen={true}
          targetView="resultados"
          campanhas={campanhasReais}
          isLoading={loading}
          onSelect={(c) => {
            handleSetCampanha(c);
          }}
          onClose={() => {
            handleSubViewChange("central");
          }}
          onCreateNew={() => {
            handleSubViewChange("central");
            setIsCreateModalOpen(true);
          }}
        />
      </div>
    );
  }

  // Se a subview for Gestão e Produção (Tela 2)
  if (currentSubView === "gestao") {
    if (currentCampanha) {
      return (
        <GestaoProducaoView
          campanha={currentCampanha}
          user={user}
          unreadNotifications={unreadNotifications}
          onBack={() => {
            handleSubViewChange("central");
            carregarDadosReais();
          }}
        />
      );
    }

    // Se nenhuma campanha estiver selecionada (Regra 5), apresenta o seletor modal com as campanhas reais
    return (
      <div className="relative min-h-svh bg-home-background">
        <div className="opacity-40 pointer-events-none filter blur-[1px]">
          <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
          <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
            <CampanhasHeader
              onNewCampaign={() => setIsCreateModalOpen(true)}
              onOpenTemplates={() => toast.info("Modelos de campanhas por nicho em breve.")}
            />
            <CampanhasStatsCards metrics={metrics} />
          </main>
        </div>

        <SelecionarCampanhaModal
          isOpen={true}
          targetView="gestao"
          campanhas={campanhasReais}
          isLoading={loading}
          onSelect={(c) => {
            handleSetCampanha(c);
          }}
          onClose={() => {
            handleSubViewChange("central");
          }}
          onCreateNew={() => {
            handleSubViewChange("central");
            setIsCreateModalOpen(true);
          }}
        />
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
              selectedCampanhaId={selectedCampanha?.id ?? null}
              onSelectCampanha={setSelectedCampanha}
              onOpenCampanha={handleOpenCampanha}
              onRenameCampanha={handleRenameCampanha}
              onDeleteCampanha={handleDeleteCampanha}
              onToggleStatus={handleToggleStatus}
              onAddLeads={(c) => toast.info(`Adicionar leads na campanha: ${c.name}`)}
              onGenerateSite={(c) => toast.info(`Gerar sites com IA para ${c.name}`)}
              onSendProposal={(c) => toast.info(`Disparo de propostas para ${c.name}`)}
            />

            <CampanhasPerformanceChart data={[]} />
          </div>

          {/* Coluna Direita: Painel Lateral com os 4 Cards */}
          <div className="min-w-0">
            {selectedCampanha ? (
              <CampanhaSummaryPanel campanha={selectedCampanha} />
            ) : (
              <div className="rounded-2xl border border-dashed border-home-border bg-home-surface/80 p-8 text-center text-sm text-home-muted">
                {loadError
                  ? `Não foi possível carregar as campanhas: ${loadError}`
                  : loading
                    ? "Carregando campanhas..."
                    : "Nenhuma campanha real disponível."}
              </div>
            )}
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
