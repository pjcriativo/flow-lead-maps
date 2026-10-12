import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "calendario" | "lista" | "kanban";

interface MarketingConteudoFiltersBarProps {
  selectedCanal: string;
  onCanalChange: (canal: string) => void;
  selectedFormato: string;
  onFormatoChange: (formato: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenMoreFilters?: () => void;
}

export function MarketingConteudoFiltersBar({
  selectedCanal,
  onCanalChange,
  selectedFormato,
  onFormatoChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onOpenMoreFilters,
}: MarketingConteudoFiltersBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
      {/* Left side: Date navigation & Dropdown filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Month selector pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E131B] border border-home-border/60 text-xs text-white">
          <Calendar className="size-3.5 text-home-muted" />
          <span className="font-medium">Agosto 2024</span>
          <div className="flex items-center gap-0.5 ml-1 text-home-muted">
            <button
              type="button"
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              className="p-0.5 hover:text-white transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Channel Dropdown */}
        <div className="relative">
          <select
            value={selectedCanal}
            onChange={(e) => onCanalChange(e.target.value)}
            className="appearance-none bg-[#0E131B] border border-home-border/60 hover:border-home-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange transition-colors"
          >
            <option value="todos">Todos os canais</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <ChevronDown className="size-3.5 text-home-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Format Dropdown */}
        <div className="relative">
          <select
            value={selectedFormato}
            onChange={(e) => onFormatoChange(e.target.value)}
            className="appearance-none bg-[#0E131B] border border-home-border/60 hover:border-home-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange transition-colors"
          >
            <option value="todos">Todos os formatos</option>
            <option value="post_simples">Post simples</option>
            <option value="carrossel">Carrossel</option>
            <option value="reels_shorts">Reels / Shorts</option>
            <option value="video_completo">Vídeo completo</option>
            <option value="story">Story</option>
            <option value="artigo_blog">Artigo / Blog</option>
            <option value="email">E-mail</option>
            <option value="anuncio">Anúncio</option>
          </select>
          <ChevronDown className="size-3.5 text-home-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none bg-[#0E131B] border border-home-border/60 hover:border-home-border rounded-lg pl-3 pr-8 py-1.5 text-xs text-white font-medium cursor-pointer focus:outline-none focus:border-home-orange transition-colors"
          >
            <option value="todos">Todos os status</option>
            <option value="publicado">Publicado</option>
            <option value="agendado">Agendado</option>
            <option value="em_revisao">Em revisão</option>
            <option value="em_producao">Em produção</option>
            <option value="rascunho">Rascunho</option>
          </select>
          <ChevronDown className="size-3.5 text-home-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Mais filtros button */}
        <button
          type="button"
          onClick={onOpenMoreFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E131B] border border-home-border/60 hover:border-home-border text-xs text-white font-medium transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="size-3.5 text-home-muted" />
          <span>Mais filtros</span>
          <span className="size-4 rounded-full bg-home-orange text-white text-[10px] font-bold flex items-center justify-center">
            2
          </span>
        </button>
      </div>

      {/* Right side: View mode toggle pills (Calendário, Lista, Kanban) */}
      <div className="flex items-center gap-1 bg-[#0E131B] p-1 rounded-lg border border-home-border/60 self-start lg:self-auto">
        <button
          type="button"
          onClick={() => onViewModeChange("calendario")}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
            viewMode === "calendario"
              ? "bg-home-orange text-white shadow-[0_0_12px_rgba(255,98,0,0.35)]"
              : "text-home-muted hover:text-white",
          )}
        >
          Calendário
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("lista")}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewMode === "lista"
              ? "bg-home-orange text-white shadow-[0_0_12px_rgba(255,98,0,0.35)]"
              : "text-home-muted hover:text-white",
          )}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("kanban")}
          className={cn(
            "px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
            viewMode === "kanban"
              ? "bg-home-orange text-white shadow-[0_0_12px_rgba(255,98,0,0.35)]"
              : "text-home-muted hover:text-white",
          )}
        >
          Kanban
        </button>
      </div>
    </div>
  );
}
