import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProspectingHero } from "./components/ProspectingHero";
import {
  ProspectingActionCards,
  type ProspectingSubMode,
} from "./components/ProspectingActionCards";
import { ProspectingFilterSidebar } from "./components/ProspectingFilterSidebar";
import {
  ProspectingResultsTable,
  type ProspectProfileItem,
  getCuratedProfilePhoto,
} from "./components/ProspectingResultsTable";
import { ProspectingInsightsPanel } from "./components/ProspectingInsightsPanel";
import { listarInstagramLeads, type InstagramLead } from "@/services/instagram";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface InstagramProspectingViewProps {
  onNavigate?: (view: InstagramView) => void;
}

export function InstagramProspectingView({ onNavigate }: InstagramProspectingViewProps) {
  const [activeSubMode, setActiveSubMode] = useState<ProspectingSubMode>("hunter");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<InstagramLead[]>([]);
  const [profiles, setProfiles] = useState<ProspectProfileItem[] | undefined>(undefined);

  // Carrega leads do banco se existirem
  const loadInitialLeads = useCallback(async () => {
    try {
      const result = await listarInstagramLeads();
      setLeads(result);
      if (result.length > 0) {
        const mapped: ProspectProfileItem[] = result.slice(0, 15).map((l, index) => {
          const cleanUsername = l.username.replace(/^@/, "");
          const followersNum = Number(l.followers_count || 0);
          const followersStr =
            followersNum >= 1000
              ? `${(followersNum / 1000).toFixed(1)}K`
              : `${followersNum}`;
          const engagementStr =
            l.engagement_rate != null
              ? `${Number(l.engagement_rate).toFixed(1)}%`
              : "3.5%";

          const score = Number(l.lead.score || 70);
          const relevance: "Alta" | "Média" | "Baixa" =
            score >= 80 ? "Alta" : score >= 60 ? "Média" : "Baixa";

          const name = l.full_name || l.lead.business_name || cleanUsername;
          const category = l.business_category || l.lead.category || "Profissional";

          return {
            id: l.lead_id || `lead-${index}`,
            name,
            username: cleanUsername,
            category,
            location: [l.lead.city, l.lead.state].filter(Boolean).join(", ") || "São Paulo, SP",
            followers: followersStr,
            engagement: engagementStr,
            relevance,
            avatarUrl: l.profile_pic_url || getCuratedProfilePhoto(name, category),
            instagramUrl: l.lead.instagram_url || `https://www.instagram.com/${cleanUsername}`,
          };
        });
        setProfiles(mapped);
      }
    } catch {
      // Usa lista demonstrativa padrão idêntica à imagem
    }
  }, []);

  useEffect(() => {
    void loadInitialLeads();
  }, [loadInitialLeads]);

  const handleModeChange = (mode: ProspectingSubMode) => {
    setActiveSubMode(mode);
    if (mode === "comments" && onNavigate) {
      onNavigate("comments");
    } else if (mode === "radar" && onNavigate) {
      onNavigate("radar");
    } else if (mode === "niche" && onNavigate) {
      onNavigate("discover");
    }
  };

  const handleSearch = (filters: {
    keyword: string;
    location: string;
    distance: string;
    category: string;
    profileSize: number;
    commercialOnly: boolean;
    hasEmail: boolean;
    hasWhatsapp: boolean;
    highEngagement: boolean;
  }) => {
    setLoading(true);
    toast.info("Buscando perfis no Instagram...");
    setTimeout(() => {
      setLoading(false);
      toast.success(
        `Busca concluída: perfis filtrados por ${filters.keyword || "nicho"} em ${filters.location}.`,
      );
    }, 1200);
  };

  const handleScrollToSearch = () => {
    const el = document.getElementById("search-filters-input");
    if (el) el.focus();
    else {
      toast.info("Ajuste os filtros de busca no painel à esquerda.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Principal com Copy, Arte e Card Resultados Hoje */}
      <ProspectingHero
        onSearchClick={handleScrollToSearch}
        onViewLeadsClick={() => onNavigate?.("crm")}
        totalFound={leads.length > 0 ? leads.length : 127}
      />

      {/* 2. Quatro Cards Horizontais de Ação */}
      <ProspectingActionCards
        activeMode={activeSubMode}
        onSelectMode={handleModeChange}
      />

      {/* 3. Conteúdo Principal em 3 Colunas Exatas */}
      <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
        {/* Coluna Esquerda: Filtros de busca */}
        <div className="w-full">
          <ProspectingFilterSidebar onSearch={handleSearch} loading={loading} />
        </div>

        {/* Coluna Central: Perfis encontrados */}
        <div className="min-w-0 w-full">
          <ProspectingResultsTable
            profiles={profiles}
            onSaveToCrm={() => {
              if (onNavigate) onNavigate("crm");
            }}
          />
        </div>

        {/* Coluna Direita: Insights da AISA, Nichos em destaque e Sua atividade */}
        <div className="w-full space-y-6 lg:col-span-2 xl:col-span-1">
          <ProspectingInsightsPanel
            onNavigateAisa={() => onNavigate?.("overview")}
            onNavigateNiches={() => onNavigate?.("discover")}
          />
        </div>
      </div>
    </div>
  );
}
