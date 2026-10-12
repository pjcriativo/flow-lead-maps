import { ChevronDown, LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineHeaderProps {
  viewMode: "kanban" | "lista";
  onViewModeChange: (mode: "kanban" | "lista") => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  selectedResponsible: string;
  onResponsibleChange: (resp: string) => void;
  onNewOpportunity?: () => void;
  className?: string;
}

export function PipelineHeader({
  viewMode,
  onViewModeChange,
  selectedChannel,
  onChannelChange,
  selectedResponsible,
  onResponsibleChange,
  onNewOpportunity,
  className,
}: PipelineHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {/* Title + Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
          Pipeline
        </h1>
        <p className="mt-1 text-xs text-home-muted sm:text-[13px]">
          Acompanhe e gerencie suas oportunidades de vendas em todas as etapas.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Toggle Kanban / Lista */}
        <div className="flex items-center rounded-xl border border-home-border bg-home-surface/80 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              viewMode === "kanban"
                ? "border border-home-orange/40 bg-home-orange/15 text-home-orange shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                : "text-home-muted hover:text-white",
            )}
          >
            <LayoutGrid className="size-3.5" />
            <span>Kanban</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              viewMode === "lista"
                ? "border border-home-orange/40 bg-home-orange/15 text-home-orange shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                : "text-home-muted hover:text-white",
            )}
          >
            <List className="size-3.5" />
            <span>Lista</span>
          </button>
        </div>

        {/* Dropdown Todos os canais */}
        <div className="relative">
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
          >
            <option value="all">Todos os canais</option>
            <option value="maps">Google Maps</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
        </div>

        {/* Dropdown Todos os responsáveis */}
        <div className="relative">
          <select
            value={selectedResponsible}
            onChange={(e) => onResponsibleChange(e.target.value)}
            className="h-9.5 appearance-none rounded-xl border border-home-border bg-home-surface/90 pl-3.5 pr-8 text-xs font-medium text-white transition-colors hover:bg-home-surface focus:border-home-blue focus:outline-none"
          >
            <option value="all">Todos os responsáveis</option>
            <option value="Marcos Gonçalves">Marcos Gonçalves</option>
            <option value="Equipe Comercial">Equipe Comercial</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
        </div>

        {/* Botão + Nova oportunidade */}
        <button
          type="button"
          onClick={onNewOpportunity}
          className={cn(
            "inline-flex h-9.5 items-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.36)] transition-all",
            "hover:bg-home-orange/90 hover:shadow-[0_0_28px_rgba(255,98,0,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
          )}
        >
          <Plus className="size-4" />
          <span>Nova oportunidade</span>
        </button>
      </div>
    </div>
  );
}
