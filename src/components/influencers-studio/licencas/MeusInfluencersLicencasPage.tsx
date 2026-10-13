import React, { useState, useMemo } from "react";
import { LicencasHeader } from "./LicencasHeader";
import { LicencasMetricsBlock } from "./LicencasMetricsBlock";
import { LicencasFilterBar } from "./LicencasFilterBar";
import { LicencasLibraryGrid } from "./LicencasLibraryGrid";
import { LicencaDetailsSidebar } from "./LicencaDetailsSidebar";
import {
  MEUS_INFLUENCERS_MOCK,
  type InfluencerLicenciadoItem,
} from "./licencas-data";
import {
  Sparkles,
  UserPlus,
  Users,
  X,
  CheckCircle2,
  Trash2,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface MeusInfluencersLicencasPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToUgcStudio?: (influencerId?: string) => void;
  onNavigateToCriador?: () => void;
  onNavigateToBiblioteca?: () => void;
  onNavigateToVisaoGeral?: () => void;
}

export const MeusInfluencersLicencasPage: React.FC<MeusInfluencersLicencasPageProps> = ({
  onNavigateToUgcStudio,
  onNavigateToCriador,
  onNavigateToBiblioteca,
  onNavigateToVisaoGeral,
}) => {
  // Filters & Tabs state
  const [selectedTab, setSelectedTab] = useState<string>("meus_avatares");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recentes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Secondary filters
  const [selectedType, setSelectedType] = useState<string>("todos");
  const [selectedNiche, setSelectedNiche] = useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("todos");
  const [selectedChannel, setSelectedChannel] = useState<string>("todos");

  // Active Selected Influencer (Isabella by default)
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerLicenciadoItem>(
    MEUS_INFLUENCERS_MOCK[0]
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);

  // Modals & Feedback
  const [isNovoInfluencerModalOpen, setIsNovoInfluencerModalOpen] = useState(false);
  const [isGerenciarModalOpen, setIsGerenciarModalOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter Computation
  const filteredInfluencers = useMemo(() => {
    return MEUS_INFLUENCERS_MOCK.filter((item) => {
      // Tab filter
      if (selectedTab === "meus_avatares" && item.type !== "meu_avatar") {
        return false;
      }
      if (selectedTab === "licencas_contratos" && item.type !== "licenciado") {
        return false;
      }
      if (selectedTab === "renovacoes" && item.licenseStatus !== "renovacao_breve") {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesNiche = item.niche.toLowerCase().includes(q);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesNiche && !matchesTags) {
          return false;
        }
      }

      // Secondary filters
      if (selectedType !== "todos" && item.type !== selectedType) {
        return false;
      }
      if (selectedNiche !== "todos" && !item.niche.toLowerCase().includes(selectedNiche.toLowerCase())) {
        return false;
      }
      if (selectedStatus !== "todos" && item.licenseStatus !== selectedStatus) {
        return false;
      }
      if (selectedLanguage !== "todos" && !item.language.includes(selectedLanguage)) {
        return false;
      }
      if (selectedChannel !== "todos" && !item.authorizedChannels.includes(selectedChannel.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [
    selectedTab,
    searchQuery,
    selectedType,
    selectedNiche,
    selectedStatus,
    selectedLanguage,
    selectedChannel,
  ]);

  // Actions
  const handleCriarVideo = (influencer: InfluencerLicenciadoItem) => {
    if (onNavigateToUgcStudio) {
      onNavigateToUgcStudio(influencer.id);
    } else {
      showToast(`Iniciando estúdio UGC para ${influencer.name}...`);
    }
  };

  const handleGerenciar = (influencer: InfluencerLicenciadoItem) => {
    setSelectedInfluencer(influencer);
    setIsGerenciarModalOpen(true);
  };

  const handleDuplicar = (influencer: InfluencerLicenciadoItem) => {
    showToast(`Configurações de avatar de "${influencer.name}" duplicadas com sucesso!`);
  };

  const handleExportar = (influencer: InfluencerLicenciadoItem) => {
    showToast(`Exportando ficha técnica e certificado de licença de "${influencer.name}"...`);
  };

  const handleCompartilhar = (influencer: InfluencerLicenciadoItem) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(
        `https://business.flowgenius.com.br/influencers/${influencer.id}`
      );
    }
    showToast(`Link seguro do influencer "${influencer.name}" copiado para a área de transferência!`);
  };

  const handleClearFilters = () => {
    setSelectedType("todos");
    setSelectedNiche("todos");
    setSelectedStatus("todos");
    setSelectedLanguage("todos");
    setSelectedChannel("todos");
    setSearchQuery("");
    showToast("Filtros limpos com sucesso.");
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
        {/* 1. Header with Breadcrumb, Title and "+ Novo influencer" Banner */}
        <LicencasHeader
          onNovoInfluencer={() => setIsNovoInfluencerModalOpen(true)}
          onNavigateToVisaoGeral={onNavigateToVisaoGeral}
        />

        {/* 2. Top 5 Metrics Block with Sparkline Bars */}
        <LicencasMetricsBlock />

        {/* 3. Filter Bar (Category Pills, Search, Sort, View Toggle & Dropdowns) */}
        <LicencasFilterBar
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedNiche={selectedNiche}
          onNicheChange={setSelectedNiche}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          onOpenAdvancedFilters={() => {
            showToast("Painel de filtros avançados aplicado com sucesso.");
          }}
          onClearFilters={handleClearFilters}
        />

        {/* 4. Main Two-Column Layout (Left Grid ~65% / Right Sidebar ~35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Influencers Library Grid */}
          <div className="lg:col-span-8 flex flex-col">
            <LicencasLibraryGrid
              influencers={filteredInfluencers.length > 0 ? filteredInfluencers : MEUS_INFLUENCERS_MOCK}
              selectedInfluencerId={selectedInfluencer.id}
              onSelectInfluencer={(inf) => setSelectedInfluencer(inf)}
              onGerenciar={handleGerenciar}
              onOpenCardMenu={(inf) => {
                setSelectedInfluencer(inf);
                showToast(`Opções rápidas para "${inf.name}" carregadas no painel.`);
              }}
              currentPage={currentPage}
              totalPages={8}
              onPageChange={setCurrentPage}
              totalItems={12}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>

          {/* Right Column: Detailed Selected Influencer Panel */}
          <div className="lg:col-span-4 flex flex-col">
            <LicencaDetailsSidebar
              influencer={selectedInfluencer}
              onCriarVideo={handleCriarVideo}
              onEditar={(inf) => {
                showToast(`Modo de edição para "${inf.name}" ativado.`);
              }}
              onDuplicar={handleDuplicar}
              onExportar={handleExportar}
              onCompartilhar={handleCompartilhar}
              onExcluir={() => setIsExcluirModalOpen(true)}
              onOpenPreview={(inf) => {
                showToast(`Abrindo prévia de vídeo em alta resolução de ${inf.name}...`);
              }}
            />
          </div>
        </div>
      </main>

      {/* Modal 1: Novo Influencer Modal */}
      {isNovoInfluencerModalOpen && (
        <div
          onClick={() => setIsNovoInfluencerModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-5 shadow-2xl relative"
          >
            <button
              onClick={() => setIsNovoInfluencerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Adicionar Novo Influencer</h3>
                <p className="text-xs text-slate-400">
                  Escolha como deseja expandir sua coleção de personagens virtuais
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsNovoInfluencerModalOpen(false);
                  if (onNavigateToCriador) onNavigateToCriador();
                }}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-orange-500/50 flex flex-col gap-2.5 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                  Criar Avatar Exclusivo
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Crie um personagem único com tom de pele, rosto e voz sob medida para sua marca.
                </p>
              </button>

              <button
                onClick={() => {
                  setIsNovoInfluencerModalOpen(false);
                  if (onNavigateToBiblioteca) onNavigateToBiblioteca();
                }}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 flex flex-col gap-2.5 text-left transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  Explorar Biblioteca
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Contrate influencers prontos e verificados da plataforma para campanhas imediatas.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Gerenciar Licença Modal */}
      {isGerenciarModalOpen && (
        <div
          onClick={() => setIsGerenciarModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl relative"
          >
            <button
              onClick={() => setIsGerenciarModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Gerenciar Licença</h3>
                <p className="text-xs text-slate-400">{selectedInfluencer.name}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Contrato:</span>
                <span className="text-white font-mono font-semibold">
                  {selectedInfluencer.licenseDetails.contractRef}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status atual:</span>
                <span className="text-emerald-400 font-semibold">
                  {selectedInfluencer.licenseStatusLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiração:</span>
                <span className="text-amber-400 font-semibold">
                  {selectedInfluencer.licenseDetails.renewalDate}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsGerenciarModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setIsGerenciarModalOpen(false);
                  showToast(`Solicitação de renovação para "${selectedInfluencer.name}" registrada!`);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Renovar Licença
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Excluir Modal */}
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
                <h3 className="text-base font-bold text-white">Desvincular Avatar</h3>
                <p className="text-xs text-slate-400">Tem certeza que deseja prosseguir?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              O influencer <strong className="text-white">"{selectedInfluencer.name}"</strong> será
              arquivado do seu workspace. Os vídeos já produzidos continuarão disponíveis na biblioteca.
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
                  showToast(`Influencer "${selectedInfluencer.name}" arquivado.`);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
