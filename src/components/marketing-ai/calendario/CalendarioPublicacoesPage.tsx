import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MarketingTopBar } from "../MarketingTopBar";
import {
  CALENDARIO_PUBLICACOES,
  type AssistantPublicacaoAction,
  type FilaPublicacaoItem,
  type PublicacaoItem,
} from "./calendario-data";
import { CalendarioPublicacoesHeader } from "./CalendarioPublicacoesHeader";
import { CalendarioPublicacoesKpis } from "./CalendarioPublicacoesKpis";
import {
  CalendarioPublicacoesSubnav,
  type CalendarioSubTab,
} from "./CalendarioPublicacoesSubnav";
import {
  CalendarioFiltersBar,
  type ViewMode,
} from "./CalendarioFiltersBar";
import { TimelineCalendarGrid } from "./TimelineCalendarGrid";
import { FilaPublicacaoSection } from "./FilaPublicacaoSection";
import { CalendarioSidebarPanel } from "./CalendarioSidebarPanel";
import { AgendarPublicacaoModal } from "./AgendarPublicacaoModal";
import { ConectarCanaisModal } from "./ConectarCanaisModal";
import { PublicacaoDetalhesDrawer } from "./PublicacaoDetalhesDrawer";
import { EditorialListView } from "../conteudos/EditorialListView";
import { EditorialKanbanView } from "../conteudos/EditorialKanbanView";

interface CalendarioPublicacoesPageProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onNavigateToProdutos?: () => void;
  onNavigateToAgentes?: () => void;
  onNavigateToConteudos?: () => void;
}

export function CalendarioPublicacoesPage({
  user,
  unreadNotifications = 1,
  onNavigateToProdutos,
  onNavigateToAgentes,
  onNavigateToConteudos,
}: CalendarioPublicacoesPageProps) {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<CalendarioSubTab>("calendario");
  const [selectedCanal, setSelectedCanal] = useState<string>("todos");
  const [selectedFormato, setSelectedFormato] = useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("calendario");

  // Publications state
  const [publicacoes, setPublicacoes] =
    useState<PublicacaoItem[]>(CALENDARIO_PUBLICACOES);

  // Modals & Drawer state
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [isConectarModalOpen, setIsConectarModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] =
    useState<PublicacaoItem | null>(null);

  // Filtered publications
  const filteredPubs = useMemo(() => {
    return publicacoes.filter((item) => {
      // Channel
      if (selectedCanal !== "todos" && item.platform !== selectedCanal) {
        return false;
      }
      // Format
      if (selectedFormato !== "todos" && item.format !== selectedFormato) {
        return false;
      }
      // Status
      if (selectedStatus !== "todos" && item.status !== selectedStatus) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(term);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(term);
        const matchesCopy = item.copy?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesSubtitle && !matchesCopy) {
          return false;
        }
      }
      return true;
    });
  }, [publicacoes, selectedCanal, selectedFormato, selectedStatus, searchTerm]);

  // Handle saving new publication
  const handleSavePublication = (pub: Partial<PublicacaoItem>) => {
    const newItem: PublicacaoItem = {
      id: `pub-${Date.now()}`,
      title: pub.title || "Novo Conteúdo Agendado",
      platform: pub.platform || "instagram",
      format: pub.format || "reels_shorts",
      time: pub.time || "12:00",
      timeSlot: pub.timeSlot || "12:00",
      status: pub.status || "agendado",
      imageUrl:
        pub.imageUrl ||
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80",
      dayIndex: pub.dayIndex ?? 3,
      dateIso: pub.dateIso || new Date().toISOString(),
      copy: pub.copy,
    };
    setPublicacoes((prev) => [newItem, ...prev]);
  };

  // Handle status update
  const handleStatusChange = (
    id: string,
    newStatus: PublicacaoItem["status"],
  ) => {
    setPublicacoes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );
  };

  // Assistant actions
  const handleAssistantAction = (action: AssistantPublicacaoAction) => {
    if (action.id === "act-melhor-horario") {
      toast.success(
        "IA identificou os melhores horários da semana: 12:00 e 18:00 com +35% de engajamento.",
      );
    } else if (action.id === "act-multiplos-canais") {
      setIsAgendarModalOpen(true);
    } else {
      toast.info(`Ação "${action.title}" iniciada com sucesso.`);
    }
  };

  // Convert for alternative views
  const contentsForAltViews = useMemo(() => {
    return filteredPubs.map((p) => ({
      id: p.id,
      time: p.time,
      platform: p.platform,
      format: p.format as any,
      formatLabel: p.format.replace("_", " ").toUpperCase(),
      title: p.title,
      subtitle: p.subtitle,
      status: p.status as any,
      imageUrl: p.imageUrl,
      dayIndex: p.dayIndex,
      dateIso: p.dateIso,
      copy: p.copy,
    }));
  }, [filteredPubs]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#07090E] text-white">
      {/* 1. Top Bar */}
      <MarketingTopBar
        user={user}
        unreadNotifications={unreadNotifications}
        onSearchChange={setSearchTerm}
      />

      {/* 2. Main Page Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header (Breadcrumb, Title, Subtitle, Right Banner) */}
        <CalendarioPublicacoesHeader
          onConectarCanais={() => setIsConectarModalOpen(true)}
          onNavigateToProdutos={onNavigateToProdutos}
        />

        {/* 6 Top Indicators */}
        <CalendarioPublicacoesKpis />

        {/* Subnav (Calendário, Fila de publicação, Publicados, Falhas, Aprovações) */}
        <CalendarioPublicacoesSubnav
          activeTab={activeSubTab}
          onTabChange={(tab) => {
            setActiveSubTab(tab);
            if (tab !== "calendario") {
              toast.info(
                `Aba "${tab.replace("_", " ")}" selecionada. Exibindo publicações correspondentes.`,
              );
            }
          }}
          onAgendarConteudo={() => setIsAgendarModalOpen(true)}
        />

        {/* Filters and View Switcher Bar */}
        <CalendarioFiltersBar
          selectedCanal={selectedCanal}
          onCanalChange={setSelectedCanal}
          selectedFormato={selectedFormato}
          onFormatoChange={setSelectedFormato}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenMoreFilters={() => {
            toast.info("Filtros avançados: 2 filtros inteligentes aplicados.");
          }}
        />

        {/* Layout Row: Calendar / Views (Left) + Assistant (Right) */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Left Column: Timeline Calendar / List / Kanban + Fila Section */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* View Mode Switcher */}
            {viewMode === "calendario" && (
              <TimelineCalendarGrid
                publicacoes={filteredPubs}
                onSelectPublicacao={(item) => setSelectedItemDetail(item)}
              />
            )}

            {viewMode === "lista" && (
              <EditorialListView
                contents={contentsForAltViews}
                onSelectContent={(c) => {
                  const match = publicacoes.find((p) => p.id === c.id);
                  if (match) setSelectedItemDetail(match);
                }}
              />
            )}

            {viewMode === "kanban" && (
              <EditorialKanbanView
                contents={contentsForAltViews}
                onSelectContent={(c) => {
                  const match = publicacoes.find((p) => p.id === c.id);
                  if (match) setSelectedItemDetail(match);
                }}
              />
            )}

            {/* Bottom: Fila de Publicação Section */}
            <FilaPublicacaoSection
              onSelectItem={(item) => {
                const match = publicacoes.find((p) => p.id === item.id);
                if (match) {
                  setSelectedItemDetail(match);
                } else {
                  toast.info(`Publicação ${item.title} selecionada.`);
                }
              }}
              onVerTodos={() => {
                toast.info("Exibindo todos os conteúdos da fila de publicação.");
              }}
            />
          </div>

          {/* Right Column: Assistant, Channel Status & Rocket Banner */}
          <CalendarioSidebarPanel
            userName={user.name.split(" ")[0]}
            onActionClick={handleAssistantAction}
            onGerenciarCanais={() => setIsConectarModalOpen(true)}
            onAtivarAutomacao={() => {
              toast.success("Publicação automática com IA ativada!");
            }}
          />
        </div>
      </main>

      {/* Modal Agendar Publicação */}
      <AgendarPublicacaoModal
        isOpen={isAgendarModalOpen}
        onClose={() => setIsAgendarModalOpen(false)}
        onSave={handleSavePublication}
      />

      {/* Modal Conectar Canais */}
      <ConectarCanaisModal
        isOpen={isConectarModalOpen}
        onClose={() => setIsConectarModalOpen(false)}
      />

      {/* Drawer Detalhes da Publicação */}
      <PublicacaoDetalhesDrawer
        item={selectedItemDetail}
        isOpen={!!selectedItemDetail}
        onClose={() => setSelectedItemDetail(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
