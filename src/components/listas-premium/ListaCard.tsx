// Card Individual da Biblioteca de Listas
import { useState } from "react";
import {
  Users,
  Phone,
  Clock,
  MoreVertical,
  Pencil,
  Download,
  Megaphone,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { SiGooglemaps, SiInstagram, SiLinkedin } from "react-icons/si";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { LeadListWithFullStats } from "./listas-premium-data";

interface ListaCardProps {
  lista: LeadListWithFullStats;
  isSelected: boolean;
  onSelect: () => void;
  onRename: (lista: LeadListWithFullStats) => void;
  onExport: (lista: LeadListWithFullStats) => void;
  onCreateCampaign: (lista: LeadListWithFullStats) => void;
  onDelete: (lista: LeadListWithFullStats) => void;
}

export function ListaCard({
  lista,
  isSelected,
  onSelect,
  onRename,
  onExport,
  onCreateCampaign,
  onDelete,
}: ListaCardProps) {
  const [isChecked, setIsChecked] = useState(false);

  // Ícone e estilo da fonte de captura
  const renderFonteBadge = () => {
    const f = (lista.fonte || "google").toLowerCase();
    if (f.includes("maps") || f.includes("google") || f.includes("apify") || f.includes("geoapify")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20">
          <SiGooglemaps className="size-3 text-blue-400" />
          Google Maps
        </span>
      );
    }
    if (f.includes("instagram")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-pink-500/10 px-2 py-0.5 text-[11px] font-medium text-pink-400 border border-pink-500/20">
          <SiInstagram className="size-3 text-pink-400" />
          Instagram
        </span>
      );
    }
    if (f.includes("linkedin")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 border border-sky-500/20">
          <SiLinkedin className="size-3 text-sky-400" />
          LinkedIn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-home-surface-strong px-2 py-0.5 text-[11px] font-medium text-home-muted border border-home-border">
        {lista.fonte || "Busca direta"}
      </span>
    );
  };

  // Status visual badge
  const renderStatusBadge = () => {
    switch (lista.status) {
      case "ativa":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ativa
          </span>
        );
      case "em_estrategia":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/25">
            <span className="size-1.5 rounded-full bg-blue-400" />
            Em estratégia
          </span>
        );
      case "pausada":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/25">
            <span className="size-1.5 rounded-full bg-amber-400" />
            Pausada
          </span>
        );
      case "rascunho":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-400 border border-slate-500/25">
            <span className="size-1.5 rounded-full bg-slate-400" />
            Rascunho
          </span>
        );
    }
  };

  const localFormatado = [lista.city && lista.city !== "—" ? lista.city : "", lista.uf]
    .filter(Boolean)
    .join(" - ");

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 select-none",
        isSelected
          ? "border-amber-500/90 bg-home-surface-strong/95 shadow-[0_0_24px_rgba(245,158,11,0.14)] ring-1 ring-amber-500/60"
          : "border-home-border bg-home-surface/85 hover:border-home-border/90 hover:bg-home-surface-strong/75",
      )}
    >
      {/* Checkbox de seleção em lote */}
      <div
        className="pt-1"
        onClick={(e) => {
          e.stopPropagation();
          setIsChecked(!isChecked);
        }}
      >
        <div
          className={cn(
            "flex size-4.5 items-center justify-center rounded-md border transition-colors",
            isChecked
              ? "border-home-orange bg-home-orange text-white"
              : "border-home-border bg-home-surface group-hover:border-home-muted",
          )}
        >
          {isChecked && (
            <svg
              className="size-3 fill-current"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
            </svg>
          )}
        </div>
      </div>

      {/* Indicador laranja especial para o card selecionado (fiel à referência) */}
      {isSelected && (
        <div className="hidden sm:flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-black shadow-sm self-center">
          <FolderOpen className="size-4 stroke-[2.5]" />
        </div>
      )}

      {/* Miniatura temática em alta definição */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-home-border/70 bg-home-surface-strong">
        <img
          src={lista.thumbnail_url}
          alt={lista.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Conteúdo Central */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Top: Nome e Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
            {lista.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {renderStatusBadge()}
            {/* Menu Dropdown de Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex size-7 items-center justify-center rounded-lg text-home-muted hover:bg-home-surface hover:text-white transition-colors"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 border-home-border bg-home-surface-strong text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={() => onRename(lista)}
                  className="cursor-pointer gap-2 text-xs hover:bg-home-surface"
                >
                  <Pencil className="size-3.5 text-home-muted" />
                  Renomear
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onExport(lista)}
                  className="cursor-pointer gap-2 text-xs hover:bg-home-surface"
                >
                  <Download className="size-3.5 text-home-muted" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCreateCampaign(lista)}
                  className="cursor-pointer gap-2 text-xs hover:bg-home-surface text-amber-400 focus:text-amber-300"
                >
                  <Megaphone className="size-3.5 text-amber-400" />
                  Criar campanha
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-home-border" />
                <DropdownMenuItem
                  onClick={() => onDelete(lista)}
                  className="cursor-pointer gap-2 text-xs text-rose-400 hover:bg-rose-500/10 focus:text-rose-300"
                >
                  <Trash2 className="size-3.5 text-rose-400" />
                  Excluir lista
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Linha de Badges (Origem, Nicho, Cidade) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {renderFonteBadge()}
          {lista.niche && (
            <span className="rounded-md bg-home-surface-strong px-2 py-0.5 text-[11px] font-medium text-home-muted border border-home-border/80 line-clamp-1">
              {lista.niche}
            </span>
          )}
          {localFormatado && (
            <span className="rounded-md bg-home-surface-strong px-2 py-0.5 text-[11px] font-medium text-home-muted border border-home-border/80 line-clamp-1">
              {localFormatado}
            </span>
          )}
        </div>

        {/* Linha de Contadores e Atualização */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px] text-home-muted">
          <span className="inline-flex items-center gap-1 font-semibold text-white">
            <Users className="size-3.5 text-home-muted" />
            <span className="tabular-nums">{lista.leads_atuais.toLocaleString("pt-BR")}</span> leads
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-home-muted">
            <Phone className="size-3.5 text-home-muted" />
            <span className="tabular-nums">{lista.com_contato_count.toLocaleString("pt-BR")}</span> com contato
          </span>
          <span className="inline-flex items-center gap-1 text-home-muted/80">
            <Clock className="size-3 text-home-muted/60" />
            Atualizada {lista.last_activity_text}
          </span>
        </div>
      </div>
    </div>
  );
}
