// Painel Detalhado da Lista Selecionada (Coluna Direita)
import { useState } from "react";
import {
  Users,
  Tag,
  Target,
  Megaphone,
  BarChart3,
  Pencil,
  Download,
  Rocket,
  Clock,
  Sparkles,
} from "lucide-react";
import { SiGooglemaps, SiInstagram, SiLinkedin } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";
import { ListaEstrategiaTab } from "./ListaEstrategiaTab";
import { ListaLeadsTab } from "./ListaLeadsTab";
import { ListaOfertaTab } from "./ListaOfertaTab";
import { ListaCampanhasTab } from "./ListaCampanhasTab";
import { ListaResultadosTab } from "./ListaResultadosTab";
import type { CampanhaComCanal, LeadListWithFullStats } from "./listas-premium-data";

export type ListaTabKey = "leads" | "oferta" | "estrategia" | "campanhas" | "resultados";

interface ListaDetailsPanelProps {
  lista: LeadListWithFullStats;
  leads: Lead[];
  leadsLoading: boolean;
  linkedCampaigns: CampanhaComCanal[];
  onRename: () => void;
  onExport: () => void;
  onCreateCampaign: () => void;
  onOpenLeadsCentral: () => void;
  onOpenCampaignsCentral: () => void;
  className?: string;
}

export function ListaDetailsPanel({
  lista,
  leads,
  leadsLoading,
  linkedCampaigns,
  onRename,
  onExport,
  onCreateCampaign,
  onOpenLeadsCentral,
  onOpenCampaignsCentral,
  className,
}: ListaDetailsPanelProps) {
  // Aba ativa selecionada por padrão é 'estrategia' (fiel à imagem)
  const [activeTab, setActiveTab] = useState<ListaTabKey>("estrategia");

  const tabs: Array<{ key: ListaTabKey; label: string; icon: typeof Users }> = [
    { key: "leads", label: "Leads", icon: Users },
    { key: "oferta", label: "Oferta", icon: Tag },
    { key: "estrategia", label: "Estratégia", icon: Target },
    { key: "campanhas", label: "Campanhas", icon: Megaphone },
    { key: "resultados", label: "Resultados", icon: BarChart3 },
  ];

  const localFormatado = [lista.city && lista.city !== "—" ? lista.city : "", lista.uf]
    .filter(Boolean)
    .join(" - ");

  const renderFonteBadge = () => {
    const f = (lista.fonte || "google").toLowerCase();
    if (f.includes("maps") || f.includes("google") || f.includes("apify") || f.includes("geoapify")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
          <SiGooglemaps className="size-3 text-blue-400" />
          Google Maps
        </span>
      );
    }
    if (f.includes("instagram")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/10 px-2 py-0.5 text-xs font-semibold text-pink-400 border border-pink-500/20">
          <SiInstagram className="size-3 text-pink-400" />
          Instagram
        </span>
      );
    }
    if (f.includes("linkedin")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
          <SiLinkedin className="size-3 text-sky-400" />
          LinkedIn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-home-surface-strong px-2 py-0.5 text-xs font-medium text-home-muted border border-home-border">
        {lista.fonte || "Busca direta"}
      </span>
    );
  };

  const renderStatusBadge = () => {
    switch (lista.status) {
      case "ativa":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/25">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Ativa
          </span>
        );
      case "em_estrategia":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/25">
            <span className="size-2 rounded-full bg-blue-400" />
            Em estratégia
          </span>
        );
      case "pausada":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/25">
            <span className="size-2 rounded-full bg-amber-400" />
            Pausada
          </span>
        );
      case "rascunho":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-bold text-slate-400 border border-slate-500/25">
            <span className="size-2 rounded-full bg-slate-400" />
            Rascunho
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border border-home-border bg-home-surface/90 backdrop-blur-md p-4 sm:p-5 shadow-xl space-y-4",
        className,
      )}
    >
      {/* 🟢 CABEÇALHO DO PAINEL DIREITO */}
      <div className="flex flex-col gap-4 rounded-2xl border border-home-border/80 bg-home-surface-strong/70 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Lado Esquerdo: Miniatura Grande + Título + Badges */}
          <div className="flex items-start gap-4">
            <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-2xl border border-home-border bg-home-surface shadow-md">
              <img
                src={lista.thumbnail_url}
                alt={lista.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-white">
                {lista.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {renderFonteBadge()}
                {lista.niche && (
                  <span className="rounded-md bg-home-surface px-2.5 py-0.5 text-xs font-medium text-home-muted border border-home-border/80">
                    {lista.niche}
                  </span>
                )}
                {localFormatado && (
                  <span className="rounded-md bg-home-surface px-2.5 py-0.5 text-xs font-medium text-home-muted border border-home-border/80">
                    {localFormatado}
                  </span>
                )}
              </div>

              {/* Três Métricas Chave do Cabeçalho */}
              <div className="flex items-center gap-5 pt-1">
                <div>
                  <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                    {lista.leads_atuais.toLocaleString("pt-BR")}
                  </span>
                  <p className="text-[10px] text-home-muted uppercase tracking-wider">
                    Total de leads
                  </p>
                </div>

                <div className="h-6 w-px bg-home-border" />

                <div>
                  <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                    {lista.com_contato_count.toLocaleString("pt-BR")}
                  </span>
                  <p className="text-[10px] text-home-muted uppercase tracking-wider">
                    Com contato
                  </p>
                </div>

                <div className="h-6 w-px bg-home-border" />

                <div>
                  <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                    {lista.taxa_contato}%
                  </span>
                  <p className="text-[10px] text-home-muted uppercase tracking-wider">
                    Taxa de contato
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Direito: Status + Tempo + Botões de Ação */}
          <div className="flex flex-col items-start sm:items-end justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              {renderStatusBadge()}
              <span className="text-[11px] text-home-muted flex items-center gap-1">
                <Clock className="size-3 text-home-muted/70" />
                Atualizada {lista.last_activity_text}
              </span>
            </div>

            {/* Três Botões de Ação Superiores */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRename}
                className="h-8 gap-1.5 border-home-border bg-home-surface text-xs font-semibold text-white hover:bg-home-surface-strong"
              >
                <Pencil className="size-3.5 text-home-muted" />
                Renomear
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 gap-1.5 border-home-border bg-home-surface text-xs font-semibold text-white hover:bg-home-surface-strong"
              >
                <Download className="size-3.5 text-home-muted" />
                Exportar
              </Button>

              <Button
                size="sm"
                onClick={onCreateCampaign}
                className="h-8 gap-1.5 bg-home-orange text-xs font-bold text-white shadow-[0_0_20px_rgba(255,98,0,0.35)] hover:bg-home-orange/90 active:scale-[0.98]"
              >
                <Rocket className="size-3.5" />
                Criar campanha
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 ABAS DO PAINEL DIREITO */}
      <div className="border-b border-home-border">
        <nav className="flex space-x-6 overflow-x-auto" aria-label="Abas da Lista">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-home-muted hover:border-home-border hover:text-white",
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-amber-500" : "text-home-muted")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 🟢 CONTEÚDO DA ABA SELECIONADA */}
      <div className="pt-1">
        {activeTab === "estrategia" && (
          <ListaEstrategiaTab
            lista={lista}
            leads={leads}
            linkedCampaigns={linkedCampaigns}
            onCreateCampaign={onCreateCampaign}
            onViewAllLeads={() => setActiveTab("leads")}
          />
        )}

        {activeTab === "leads" && (
          <ListaLeadsTab
            lista={lista}
            leads={leads}
            loading={leadsLoading}
            onOpenLeadsCentral={onOpenLeadsCentral}
          />
        )}

        {activeTab === "oferta" && <ListaOfertaTab lista={lista} />}

        {activeTab === "campanhas" && (
          <ListaCampanhasTab
            lista={lista}
            campaigns={linkedCampaigns}
            onCreateCampaign={onCreateCampaign}
            onOpenCampaignsCentral={onOpenCampaignsCentral}
          />
        )}

        {activeTab === "resultados" && <ListaResultadosTab lista={lista} />}
      </div>
    </div>
  );
}
