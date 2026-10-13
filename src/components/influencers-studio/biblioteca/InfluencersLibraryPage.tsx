import React, { useState } from "react";
import { InfluencersLibraryHeader } from "./InfluencersLibraryHeader";
import { NicheCategoriesBar } from "./NicheCategoriesBar";
import { InfluencersFiltersBar } from "./InfluencersFiltersBar";
import { InfluencersCatalogGrid } from "./InfluencersCatalogGrid";
import { InfluencerDetailsSidebar } from "./InfluencerDetailsSidebar";
import { InfluencersBottomPromoCards } from "./InfluencersBottomPromoCards";
import { UsarInfluencerModal } from "./UsarInfluencerModal";
import { CriarAvatarModal } from "../CriarAvatarModal";
import { VideoPlayerModal } from "../VideoPlayerModal";
import { INFLUENCERS_CATALOG, type InfluencerCatalogItem } from "./biblioteca-data";
import type { RecentVideoItem } from "../influencers-data";

interface InfluencersLibraryPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToCriador?: () => void;
  onNavigateToUgcStudio?: () => void;
}

export const InfluencersLibraryPage: React.FC<InfluencersLibraryPageProps> = ({
  user,
  unreadNotifications,
  onNavigateToCriador,
  onNavigateToUgcStudio,
}) => {
  // Category state
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Selected influencer in right details panel (defaults to Isabella as in mockup)
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerCatalogItem>(
    INFLUENCERS_CATALOG[0]
  );

  // Modal states
  const [isUsarModalOpen, setIsUsarModalOpen] = useState(false);
  const [isCriarAvatarModalOpen, setIsCriarAvatarModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RecentVideoItem | null>(null);

  // Handlers
  const handleSelectInfluencer = (inf: InfluencerCatalogItem) => {
    setSelectedInfluencer(inf);
  };

  const handleUseInfluencer = (inf: InfluencerCatalogItem) => {
    setSelectedInfluencer(inf);
    setIsUsarModalOpen(true);
  };

  const handlePlayPreview = (inf: InfluencerCatalogItem) => {
    setSelectedVideo({
      id: `sample-${inf.id}`,
      title: `Apresentação • ${inf.name}`,
      date: "Disponível na plataforma",
      duration: "00:32",
      status: "concluido",
      thumbnailUrl: inf.imageUrl,
      avatarName: inf.name,
    });
  };

  const handlePlaySampleVideo = (title: string) => {
    setSelectedVideo({
      id: `sample-${selectedInfluencer.id}`,
      title: `${title} • ${selectedInfluencer.name}`,
      date: "Disponível na plataforma",
      duration: "00:30",
      status: "concluido",
      thumbnailUrl: selectedInfluencer.imageUrl,
      avatarName: selectedInfluencer.name,
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-7 space-y-5 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb, Title and Top-right CTA Banner */}
      <InfluencersLibraryHeader
        onCriarAvatar={() => {
          if (onNavigateToCriador) {
            onNavigateToCriador();
          } else {
            setIsCriarAvatarModalOpen(true);
          }
        }}
      />

      {/* 2. Niche Categories Ribbon (10 items, "Todos" active) */}
      <NicheCategoriesBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 3. Filters and Sorting Bar */}
      <InfluencersFiltersBar />

      {/* 4. Main Content Layout: Left Grid & Right Selected Influencer Details Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column (Catalog Grid 2x5 + Bottom Promo Cards) */}
        <div className="xl:col-span-9 space-y-4">
          <InfluencersCatalogGrid
            selectedInfluencerId={selectedInfluencer.id}
            onSelectInfluencer={handleSelectInfluencer}
            onUseInfluencer={handleUseInfluencer}
            onPlayPreview={handlePlayPreview}
            filterCategory={selectedCategory}
          />

          {/* Bottom 2 Promo Cards */}
          <InfluencersBottomPromoCards
            onCriarAvatar={() => {
              if (onNavigateToCriador) {
                onNavigateToCriador();
              } else {
                setIsCriarAvatarModalOpen(true);
              }
            }}
            onAbrirVideoStudio={() => {
              if (onNavigateToUgcStudio) {
                onNavigateToUgcStudio();
              } else {
                handleUseInfluencer(selectedInfluencer);
              }
            }}
          />
        </div>

        {/* Right Column: Selected Influencer Details Sidebar */}
        <div className="xl:col-span-3">
          <InfluencerDetailsSidebar
            influencer={selectedInfluencer}
            onUseInfluencer={handleUseInfluencer}
            onVerPerfilCompleto={() => handleUseInfluencer(selectedInfluencer)}
            onPlaySampleVideo={handlePlaySampleVideo}
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <UsarInfluencerModal
        isOpen={isUsarModalOpen}
        onClose={() => setIsUsarModalOpen(false)}
        influencer={selectedInfluencer}
      />

      <CriarAvatarModal
        isOpen={isCriarAvatarModalOpen}
        onClose={() => setIsCriarAvatarModalOpen(false)}
      />

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
};

export default InfluencersLibraryPage;
