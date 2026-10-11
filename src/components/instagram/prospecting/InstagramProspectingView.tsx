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
} from "./components/ProspectingResultsTable";
import { ProspectingInsightsPanel } from "./components/ProspectingInsightsPanel";
import {
  listarInstagramLeads,
  listarInstagramLeadsPorIds,
  type InstagramLead,
} from "@/services/instagram";
import { buscarRedes, type ColetaRedes } from "@/services/whatsapp";
import { addLeadToFlowBusiness } from "@/services/flow-business";
import { mergeProspectingPages } from "@/lib/instagram-prospecting";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface InstagramProspectingViewProps {
  onNavigate?: (view: InstagramView) => void;
}
type SearchState =
  "idle" | "loading" | "success" | "empty" | "error" | "partial" | "limit" | "provider_unavailable";
type Filters = Parameters<React.ComponentProps<typeof ProspectingFilterSidebar>["onSearch"]>[0];

function formatCount(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 1_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function toProfile(item: InstagramLead): ProspectProfileItem {
  const username = item.username.replace(/^@/, "");
  const followersCount = item.followers_count == null ? null : Number(item.followers_count);
  const engagementRate = item.engagement_rate == null ? null : Number(item.engagement_rate);
  const score = item.lead.score == null ? null : Number(item.lead.score);
  return {
    id: item.lead_id,
    name: item.full_name || item.lead.business_name || username,
    username,
    category: item.business_category || item.lead.category || "—",
    location: [item.lead.city, item.lead.state].filter(Boolean).join(", ") || "—",
    followers: formatCount(followersCount),
    followersCount,
    engagement: engagementRate == null ? "—" : `${engagementRate.toFixed(1)}%`,
    engagementRate,
    relevance: score == null ? "—" : score >= 80 ? "Alta" : score >= 60 ? "Média" : "Baixa",
    avatarUrl: item.profile_pic_url || undefined,
    instagramUrl: item.lead.instagram_url || `https://www.instagram.com/${username}`,
    commercial: Boolean(item.professional || item.business_category),
  };
}

function errorFromResult(result: ColetaRedes): string {
  if (result.motivo) return result.motivo;
  if (result.reason === "limite_plano") return "O limite do plano foi atingido.";
  if (result.reason === "teto" || result.reason === "teto_no_run")
    return "A busca foi bloqueada pelo limite de custo.";
  if (result.reason === "chaves_esgotadas")
    return "O provedor de busca está temporariamente sem créditos.";
  if (result.reason === "apify_nao_configurada") return "Nenhum provedor de busca está disponível.";
  return result.detalhe || "Não foi possível concluir a busca.";
}

export function InstagramProspectingView({ onNavigate }: InstagramProspectingViewProps) {
  const [activeSubMode, setActiveSubMode] = useState<ProspectingSubMode>("hunter");
  const [state, setState] = useState<SearchState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProspectProfileItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<Filters | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitialLeads = useCallback(async () => {
    try {
      const result = await listarInstagramLeads();
      const mapped = result.slice(0, 15).map(toProfile);
      setProfiles(mapped);
      setState(mapped.length > 0 ? "success" : "idle");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível carregar os perfis.",
      );
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadInitialLeads();
  }, [loadInitialLeads]);

  const runSearch = useCallback(async (filters: Filters, cursor?: string) => {
    const loadingNextPage = Boolean(cursor);
    if (loadingNextPage) setLoadingMore(true);
    else setState("loading");
    setErrorMessage(null);
    try {
      const result = await buscarRedes(
        "IG-LOCAL",
        {
          nicho: filters.keyword || (filters.category === "all" ? "" : filters.category),
          categoria: filters.category === "all" ? "" : filters.category,
          cidade: filters.location,
          distanciaKm: Number(filters.distance),
          maxSeguidores: filters.profileSize * 1_000,
          soComerciais: filters.commercialOnly,
          exigirEmail: filters.hasEmail,
          exigirWhatsapp: filters.hasWhatsapp,
          minEngagementRate: filters.highEngagement ? 3 : undefined,
          exigirLocalidade: Boolean(filters.location.trim()),
        },
        25,
        { somenteNovos: false, cursor },
      );
      if (!result.ok) {
        const message = errorFromResult(result);
        setErrorMessage(message);
        setState(
          result.reason === "limite_plano" || result.reason?.startsWith("teto")
            ? "limit"
            : result.reason === "chaves_esgotadas" || result.reason === "apify_nao_configurada"
              ? "provider_unavailable"
              : "error",
        );
        toast.error(message);
        return;
      }
      const found = await listarInstagramLeadsPorIds(result.leadIds ?? []);
      const mapped = found.map(toProfile);
      setProfiles((current) => (loadingNextPage ? mergeProspectingPages(current, mapped) : mapped));
      setNextCursor(result.nextCursor ?? null);
      const isPartial =
        Boolean(result.nextCursor) || Boolean(result.estourou) || Boolean(result.avisoChaves);
      setState(
        mapped.length === 0 && !loadingNextPage ? "empty" : isPartial ? "partial" : "success",
      );
      toast.success(
        `${mapped.length} ${mapped.length === 1 ? "perfil encontrado" : "perfis encontrados"}.`,
      );
      if (result.costStatus === "unknown")
        toast.info("Busca concluída; o provedor não informou o custo final.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a busca.";
      setErrorMessage(message);
      setState("error");
      toast.error(message);
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const handleSearch = (filters: Filters) => {
    setLastFilters(filters);
    setNextCursor(null);
    void runSearch(filters);
  };
  const handleModeChange = (mode: ProspectingSubMode) => {
    setActiveSubMode(mode);
    if (mode === "comments") onNavigate?.("comments");
    else if (mode === "radar") onNavigate?.("radar");
    else if (mode === "niche") onNavigate?.("discover");
  };
  const handleScrollToSearch = () => {
    document.getElementById("search-filters-input")?.focus();
  };

  return (
    <div className="space-y-6">
      <ProspectingHero
        onSearchClick={handleScrollToSearch}
        onViewLeadsClick={() => onNavigate?.("crm")}
        totalFound={profiles.length}
        profiles={profiles}
      />
      <ProspectingActionCards activeMode={activeSubMode} onSelectMode={handleModeChange} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]">
        <div className="w-full">
          <ProspectingFilterSidebar onSearch={handleSearch} loading={state === "loading"} />
        </div>
        <div className="min-w-0 w-full">
          <ProspectingResultsTable
            profiles={profiles}
            state={state}
            errorMessage={errorMessage}
            hasMore={Boolean(nextCursor)}
            loadingMore={loadingMore}
            onLoadMore={() => {
              if (lastFilters && nextCursor) void runSearch(lastFilters, nextCursor);
            }}
            onSaveToCrm={async (profile) => {
              await addLeadToFlowBusiness(profile.id);
            }}
          />
        </div>
        <div className="w-full space-y-6 lg:col-span-2 xl:col-span-1">
          <ProspectingInsightsPanel
            profiles={profiles}
            onNavigateAisa={() => onNavigate?.("overview")}
            onNavigateNiches={() => onNavigate?.("discover")}
          />
        </div>
      </div>
    </div>
  );
}
