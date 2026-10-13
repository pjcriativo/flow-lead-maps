import React, { useState, useMemo } from "react";
import { ProjetosHeader } from "./ProjetosHeader";
import { ProjetosMetricsBlock } from "./ProjetosMetricsBlock";
import { ProjetosFilterBar } from "./ProjetosFilterBar";
import { ProjetosLibraryGrid } from "./ProjetosLibraryGrid";
import { ProjetoDetailsSidebar } from "./ProjetoDetailsSidebar";
import { VideoPlayerModal } from "../VideoPlayerModal";
import {
  PROJETOS_VIDEOS_MOCK,
  type ProjetoVideoItem,
} from "./projetos-data";
import {
  Sparkles,
  Video,
  UserPlus,
  Send,
  X,
  CheckCircle2,
  Trash2,
  Share2,
} from "lucide-react";

interface ProjetosBibliotecaPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToUgcStudio?: () => void;
  onNavigateToCriador?: () => void;
  onNavigateToBiblioteca?: () => void;
  onNavigateToVisaoGeral?: () => void;
}

export const ProjetosBibliotecaPage: React.FC<ProjetosBibliotecaPageProps> = ({
  onNavigateToUgcStudio,
  onNavigateToCriador,
  onNavigateToVisaoGeral,
}) => {
  // State for filtering & searching
  const [selectedTab, setSelectedTab] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recentes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Secondary filters
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("todos");
  const [selectedProduct, setSelectedProduct] = useState<string>("todos");
  const [selectedFormat, setSelectedFormat] = useState<string>("todos");
  const [selectedChannel, setSelectedChannel] = useState<string>("todos");

  // Currently selected video project (Card 1 selected by default)
  const [selectedVideo, setSelectedVideo] = useState<ProjetoVideoItem>(
    PROJETOS_VIDEOS_MOCK[0]
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Modals & Feedback
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isNovoProjetoModalOpen, setIsNovoProjetoModalOpen] = useState(false);
  const [isPublicarModalOpen, setIsPublicarModalOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter & Search computation
  const filteredVideos = useMemo(() => {
    return PROJETOS_VIDEOS_MOCK.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesAvatar = item.avatarName.toLowerCase().includes(q);
        const matchesProduct = item.productName.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesAvatar && !matchesProduct && !matchesTag) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== "todos" && item.status !== selectedStatus) {
        return false;
      }

      // Avatar
      if (selectedAvatar !== "todos" && item.avatarName !== selectedAvatar) {
        return false;
      }

      // Format
      if (selectedFormat !== "todos") {
        if (selectedFormat === "vertical" && !item.format.includes("9:16")) return false;
        if (selectedFormat === "horizontal" && !item.format.includes("16:9")) return false;
        if (selectedFormat === "quadrado" && !item.format.includes("1:1")) return false;
      }

      // Channel
      if (selectedChannel !== "todos" && item.channel !== selectedChannel) {
        return false;
      }

      return true;
    });
  }, [
    searchQuery,
    selectedStatus,
    selectedAvatar,
    selectedFormat,
    selectedChannel,
  ]);

  // Actions handlers
  const handleBaixarVideo = (project: ProjetoVideoItem) => {
    showToast(`Download de "${project.title}.mp4" iniciado em alta resolução (1080p).`);
  };

  const handleEditarProjeto = (project: ProjetoVideoItem) => {
    if (onNavigateToUgcStudio) {
      onNavigateToUgcStudio();
    } else {
      showToast(`Abrindo editor para o projeto "${project.title}"...`);
    }
  };

  const handleDuplicar = (project: ProjetoVideoItem) => {
    showToast(`Projeto "${project.title}" duplicado com sucesso!`);
  };

  const handleCompartilhar = (project: ProjetoVideoItem) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(
        `https://business.flowgenius.com.br/projetos/${project.id}`
      );
    }
    showToast(`Link de visualização de "${project.title}" copiado para a área de transferência!`);
  };

  const handlePublicar = (_project: ProjetoVideoItem) => {
    setIsPublicarModalOpen(true);
  };

  const handleExcluir = (_project: ProjetoVideoItem) => {
    setIsExcluirModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070C15] text-white flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#0F172A] border border-orange-500/50 rounded-xl shadow-2xl text-xs font-semibold text-white animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-[1720px] w-full mx-auto">
        {/* 1. Header with Breadcrumb, Title and "+ Novo projeto" Banner */}
        <ProjetosHeader
          onNovoProjeto={() => setIsNovoProjetoModalOpen(true)}
          onNavigateToVisaoGeral={onNavigateToVisaoGeral}
        />

        {/* 2. Top 6 Metrics Block with Sparkline Bars */}
        <ProjetosMetricsBlock />

        {/* 3. Filter Bar (Category Pills, Search, Sort, View Toggle & Dropdowns) */}
        <ProjetosFilterBar
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedAvatar={selectedAvatar}
          onAvatarChange={setSelectedAvatar}
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          onOpenAdvancedFilters={() => {
            showToast("Painel de filtros avançados aplicado com sucesso.");
          }}
        />

        {/* 4. Main Two-Column Layout (Left Grid ~65% / Right Sidebar ~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Projects Library Grid */}
          <div className="lg:col-span-8 flex flex-col">
            <ProjetosLibraryGrid
              videos={filteredVideos}
              selectedVideoId={selectedVideo.id}
              onSelectVideo={(video) => setSelectedVideo(video)}
              onPlayVideo={(video) => {
                setSelectedVideo(video);
                setIsPlayerModalOpen(true);
              }}
              onOpenCardMenu={(video) => {
                setSelectedVideo(video);
                showToast(`Opções rápidas para "${video.title}" carregadas no painel lateral.`);
              }}
              currentPage={currentPage}
              totalPages={8}
              onPageChange={setCurrentPage}
              totalItems={48}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>

          {/* Right Column: Detailed Selected Project Panel */}
          <div className="lg:col-span-4 flex flex-col">
            <ProjetoDetailsSidebar
              project={selectedVideo}
              onBaixarVideo={handleBaixarVideo}
              onEditarProjeto={handleEditarProjeto}
              onDuplicar={handleDuplicar}
              onCompartilhar={handleCompartilhar}
              onPublicar={handlePublicar}
              onExcluir={handleExcluir}
              onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modal 1: Video Player Modal */}
      <VideoPlayerModal
        video={{
          id: selectedVideo.id,
          title: selectedVideo.title,
          date: selectedVideo.createdDate,
          duration: selectedVideo.duration,
          status: selectedVideo.status === "falha" ? "em_processamento" : selectedVideo.status,
          thumbnailUrl: selectedVideo.thumbnailUrl,
          avatarName: selectedVideo.avatarName,
        }}
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
      />

      {/* Modal 2: Novo Projeto Modal */}
      {isNovoProjetoModalOpen && (
        <div
          onClick={() => setIsNovoProjetoModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl relative"
          >
            <button
              onClick={() => setIsNovoProjetoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Criar Novo Projeto</h3>
                <p className="text-xs text-slate-400">
                  Escolha como deseja iniciar a produção do seu vídeo
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsNovoProjetoModalOpen(false);
                  if (onNavigateToUgcStudio) onNavigateToUgcStudio();
                }}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/50 flex flex-col gap-2.5 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                  AI UGC Video Studio
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gere vídeos comerciais e anúncios com produtos e roteiros automatizados.
                </p>
              </button>

              <button
                onClick={() => {
                  setIsNovoProjetoModalOpen(false);
                  if (onNavigateToCriador) onNavigateToCriador();
                }}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/50 flex flex-col gap-2.5 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  Criar Avatar Exclusivo
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Crie um influencer virtual personalizado sob medida para sua marca.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Publicar Modal */}
      {isPublicarModalOpen && (
        <div
          onClick={() => setIsPublicarModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl relative"
          >
            <button
              onClick={() => setIsPublicarModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Publicar Vídeo</h3>
                <p className="text-xs text-slate-400">{selectedVideo.title}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <label className="text-[11px] font-semibold text-slate-400">Canal de Destino</label>
              <select className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white">
                <option>Instagram Reels (@bellavita.oficial)</option>
                <option>TikTok Ads (@bellavitabrazil)</option>
                <option>YouTube Shorts (Bella Vita Channel)</option>
              </select>

              <label className="text-[11px] font-semibold text-slate-400 mt-2">Data e Hora</label>
              <input
                type="text"
                defaultValue="Imediato (Agora)"
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsPublicarModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsPublicarModalOpen(false);
                  showToast(`Vídeo "${selectedVideo.title}" enviado para publicação com sucesso!`);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Confirmar Publicação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Excluir Modal */}
      {isExcluirModalOpen && (
        <div
          onClick={() => setIsExcluirModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F1626] border border-rose-500/30 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-2xl relative"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Projeto</h3>
                <p className="text-xs text-slate-400">Tem certeza que deseja excluir?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              O projeto <strong className="text-white">"{selectedVideo.title}"</strong> e todos os
              arquivos de renderização associados serão removidos permanentemente.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsExcluirModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsExcluirModalOpen(false);
                  showToast(`Projeto "${selectedVideo.title}" removido com sucesso.`);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
