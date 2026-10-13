import React, { useState } from "react";
import { InfluencersHeader } from "./InfluencersHeader";
import { InfluencersKpis } from "./InfluencersKpis";
import { InfluencersHeroBanner } from "./InfluencersHeroBanner";
import { AvataresDestaqueSection } from "./AvataresDestaqueSection";
import { MeusUltimosVideosSection } from "./MeusUltimosVideosSection";
import { InfluencersAssistantPanel } from "./InfluencersAssistantPanel";
import { CriarVideoModal } from "./CriarVideoModal";
import { CriarAvatarModal } from "./CriarAvatarModal";
import { AvatarDetalhesDrawer } from "./AvatarDetalhesDrawer";
import { VideoPlayerModal } from "./VideoPlayerModal";
import type {
  FeaturedAvatarItem,
  RecentVideoItem,
  AssistantActionItem,
  VideoTemplateItem,
} from "./influencers-data";

interface AIInfluencersStudioPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToPlanos?: () => void;
}

export const AIInfluencersStudioPage: React.FC<AIInfluencersStudioPageProps> = ({
  user,
  unreadNotifications,
  onNavigateToPlanos,
}) => {
  // Modal states
  const [isCriarVideoOpen, setIsCriarVideoOpen] = useState(false);
  const [isCriarAvatarOpen, setIsCriarAvatarOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<FeaturedAvatarItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<RecentVideoItem | null>(null);

  // Handlers
  const handleOpenCriarVideo = (avatar?: FeaturedAvatarItem) => {
    if (avatar) setSelectedAvatar(avatar);
    setIsCriarVideoOpen(true);
  };

  const handleOpenCriarAvatar = () => {
    setIsCriarAvatarOpen(true);
  };

  const handleSelectAvatar = (avatar: FeaturedAvatarItem) => {
    setSelectedAvatar(avatar);
  };

  const handlePlayVideo = (video: RecentVideoItem) => {
    setSelectedVideo(video);
  };

  const handleAssistantAction = (action: AssistantActionItem) => {
    if (action.id === "act-criar-video") {
      setIsCriarVideoOpen(true);
    } else if (action.id === "act-escolher-avatar") {
      // scrolls or focuses avatar section
      const el = document.getElementById("avatares-destaque");
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      setIsCriarVideoOpen(true);
    }
  };

  const handleUsarTemplate = (template?: VideoTemplateItem) => {
    setIsCriarVideoOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-7 space-y-5 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumb, Title & Top-Right CTA Banner */}
      <InfluencersHeader onCriarVideo={() => handleOpenCriarVideo()} />

      {/* 2. Top 6 KPI Cards */}
      <InfluencersKpis />

      {/* 3. Main Content Grid: Left Main Studio (approx 72%) & Right Assistant Panel (approx 28%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Hero, Avatares em destaque & Meus últimos vídeos */}
        <div className="xl:col-span-9 space-y-5">
          {/* Hero Banner with Avatar Showcase & CTAs */}
          <InfluencersHeroBanner
            onCriarVideo={() => handleOpenCriarVideo()}
            onVerComoFunciona={() => {
              setSelectedVideo({
                id: "demo-hero",
                title: "Como criar vídeos com avatares de IA",
                date: "Hoje",
                duration: "01:15",
                status: "concluido",
                thumbnailUrl:
                  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
                avatarName: "Isabella",
              });
            }}
            onPlayDemo={() => {
              setSelectedVideo({
                id: "demo-hero",
                title: "Apresentação Isabella • Flow Business",
                date: "Hoje",
                duration: "00:45",
                status: "concluido",
                thumbnailUrl:
                  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
                avatarName: "Isabella",
              });
            }}
          />

          {/* Section: Avatares em destaque */}
          <div id="avatares-destaque">
            <AvataresDestaqueSection
              onSelectAvatar={handleSelectAvatar}
              onViewAll={() => {
                const el = document.getElementById("avatares-destaque");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>

          {/* Section: Meus últimos vídeos */}
          <MeusUltimosVideosSection
            onPlayVideo={handlePlayVideo}
            onViewAll={() => console.log("Ver todos os vídeos")}
          />
        </div>

        {/* Right Column: AI Avatar Assistant, Quick Actions, Templates & Plans */}
        <div className="xl:col-span-3 space-y-5">
          <InfluencersAssistantPanel
            onActionClick={handleAssistantAction}
            onCriarAvatar={handleOpenCriarAvatar}
            onGerarUgc={() => handleOpenCriarVideo()}
            onUsarTemplate={handleUsarTemplate}
            onImportarRoteiro={() => handleOpenCriarVideo()}
            onVerPlanos={() => {
              if (onNavigateToPlanos) {
                onNavigateToPlanos();
              } else {
                console.log("Ver planos");
              }
            }}
            onVerTodosTemplates={() => handleUsarTemplate()}
          />
        </div>
      </div>

      {/* Modals & Drawer */}
      <CriarVideoModal
        isOpen={isCriarVideoOpen}
        onClose={() => setIsCriarVideoOpen(false)}
        selectedAvatar={selectedAvatar}
      />

      <CriarAvatarModal
        isOpen={isCriarAvatarOpen}
        onClose={() => setIsCriarAvatarOpen(false)}
      />

      <AvatarDetalhesDrawer
        avatar={selectedAvatar}
        onClose={() => setSelectedAvatar(null)}
        onUsarEmVideo={(av) => handleOpenCriarVideo(av)}
      />

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
};

export default AIInfluencersStudioPage;
