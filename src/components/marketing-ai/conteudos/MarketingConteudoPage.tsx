import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MarketingTopBar } from "../MarketingTopBar";
import {
  SCHEDULED_CONTENTS,
  type AiAssistantAction,
  type ConteudoItem,
  type FormatoConteudo,
} from "./conteudos-data";
import { MarketingConteudoHeader } from "./MarketingConteudoHeader";
import { MarketingConteudoKpis } from "./MarketingConteudoKpis";
import {
  MarketingConteudoSubnav,
  type ConteudoSubTab,
} from "./MarketingConteudoSubnav";
import {
  MarketingConteudoFiltersBar,
  type ViewMode,
} from "./MarketingConteudoFiltersBar";
import { EditorialCalendarGrid } from "./EditorialCalendarGrid";
import { EditorialListView } from "./EditorialListView";
import { EditorialKanbanView } from "./EditorialKanbanView";
import { TiposConteudoSection } from "./TiposConteudoSection";
import { ConteudoAssistantPanel } from "./ConteudoAssistantPanel";
import { NovoConteudoModal } from "./NovoConteudoModal";
import { ConteudoDetalhesDrawer } from "./ConteudoDetalhesDrawer";

interface MarketingConteudoPageProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onNavigateToProdutos?: () => void;
  onNavigateToAgentes?: () => void;
  onNavigateToCampanhas?: () => void;
}

export function MarketingConteudoPage({
  user,
  unreadNotifications = 1,
  onNavigateToProdutos,
  onNavigateToAgentes,
  onNavigateToCampanhas,
}: MarketingConteudoPageProps) {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<ConteudoSubTab>("planejamento");
  const [selectedCanal, setSelectedCanal] = useState<string>("todos");
  const [selectedFormato, setSelectedFormato] = useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("calendario");

  // Content items state (can receive new items)
  const [contents, setContents] = useState<ConteudoItem[]>(SCHEDULED_CONTENTS);

  // Modals & Drawers state
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [selectedFormatForCreation, setSelectedFormatForCreation] =
    useState<FormatoConteudo>("post_simples");
  const [selectedContentDetail, setSelectedContentDetail] =
    useState<ConteudoItem | null>(null);

  // Filtered contents
  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
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
  }, [contents, selectedCanal, selectedFormato, selectedStatus, searchTerm]);

  // Handle adding new content
  const handleSaveNewContent = (newContent: Partial<ConteudoItem>) => {
    const item: ConteudoItem = {
      id: `content-${Date.now()}`,
      time: newContent.time || "10:00",
      platform: newContent.platform || "instagram",
      format: newContent.format || "post_simples",
      formatLabel: newContent.formatLabel || "Post simples",
      title: newContent.title || "Novo Conteúdo",
      subtitle: newContent.subtitle || "",
      status: newContent.status || "agendado",
      imageUrl:
        newContent.imageUrl ||
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop&q=80",
      dayIndex: newContent.dayIndex ?? 3,
      dateIso: newContent.dateIso || new Date().toISOString(),
      copy: newContent.copy,
      hashtags: newContent.hashtags,
    };
    setContents((prev) => [item, ...prev]);
  };

  // Handle status update
  const handleStatusChange = (id: string, newStatus: ConteudoItem["status"]) => {
    setContents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  // Assistant action handler
  const handleAssistantAction = (action: AiAssistantAction) => {
    if (action.id === "action-carrossel") {
      setSelectedFormatForCreation("carrossel");
    } else if (action.id === "action-roteiro") {
      setSelectedFormatForCreation("video_completo");
    } else if (action.id === "action-posts") {
      setSelectedFormatForCreation("post_simples");
    }
    setIsNovoModalOpen(true);
  };

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
        <MarketingConteudoHeader
          onNovoConteudo={() => setIsNovoModalOpen(true)}
          onNavigateToProdutos={onNavigateToProdutos}
          onNavigateToAgentes={onNavigateToAgentes}
        />

        {/* 6 Top Indicators */}
        <MarketingConteudoKpis />

        {/* Subnav (Planejamento, Conteúdos gerados, Minhas campanhas, Biblioteca de mídias, Aprovação) */}
        <MarketingConteudoSubnav
          activeTab={activeSubTab}
          onTabChange={(tab) => {
            setActiveSubTab(tab);
            if (tab !== "planejamento") {
              toast.info(
                `Aba "${tab.replace("_", " ")}" carregada. Mostrando conteúdos relacionados.`,
              );
            }
          }}
          onNovoConteudo={() => setIsNovoModalOpen(true)}
        />

        {/* Filters and View Switcher Bar */}
        <MarketingConteudoFiltersBar
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
          {/* Left Column: Calendar / List / Kanban + Types Section */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* View Mode Switcher */}
            {viewMode === "calendario" && (
              <EditorialCalendarGrid
                contents={filteredContents}
                onSelectContent={(item) => setSelectedContentDetail(item)}
              />
            )}

            {viewMode === "lista" && (
              <EditorialListView
                contents={filteredContents}
                onSelectContent={(item) => setSelectedContentDetail(item)}
              />
            )}

            {viewMode === "kanban" && (
              <EditorialKanbanView
                contents={filteredContents}
                onSelectContent={(item) => setSelectedContentDetail(item)}
              />
            )}

            {/* Bottom: Tipos de Conteúdo Section */}
            <TiposConteudoSection
              onSelectFormat={(format) => {
                setSelectedFormatForCreation(format);
                setIsNovoModalOpen(true);
              }}
              onVerTodos={() => {
                toast.info("Exibindo todos os 8 formatos de conteúdo disponíveis.");
              }}
            />
          </div>

          {/* Right Column: Assistant, Suggestions & Promo Card */}
          <ConteudoAssistantPanel
            userName={user.name.split(" ")[0]}
            onActionClick={handleAssistantAction}
            onNovoConteudo={() => setIsNovoModalOpen(true)}
            onVerTodasSugestoes={() => {
              toast.info("Todas as 4 sugestões estratégicas estão ativas.");
            }}
          />
        </div>
      </main>

      {/* Modal Criar Novo Conteúdo com IA */}
      <NovoConteudoModal
        isOpen={isNovoModalOpen}
        onClose={() => setIsNovoModalOpen(false)}
        onSaveContent={handleSaveNewContent}
        initialFormat={selectedFormatForCreation}
      />

      {/* Drawer Detalhes do Conteúdo */}
      <ConteudoDetalhesDrawer
        item={selectedContentDetail}
        isOpen={!!selectedContentDetail}
        onClose={() => setSelectedContentDetail(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
