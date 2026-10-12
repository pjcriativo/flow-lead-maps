import { useState } from "react";
import {
  Archive,
  BarChart2,
  Copy,
  Edit2,
  ExternalLink,
  MoreHorizontal,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProductItem, ProductStatus } from "./marketing-data";

interface ProductCardProps {
  product: ProductItem;
  onViewDetails: (product: ProductItem) => void;
  onPrimaryAction: (product: ProductItem) => void;
  onEdit?: (product: ProductItem) => void;
  onTogglePause?: (product: ProductItem) => void;
  onArchive?: (product: ProductItem) => void;
}

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; badgeClasses: string; dotClass: string }
> = {
  ativo: {
    label: "Ativo",
    badgeClasses: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  em_analise: {
    label: "Em análise",
    badgeClasses: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-400",
  },
  rascunho: {
    label: "Rascunho",
    badgeClasses: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  pausado: {
    label: "Pausado",
    badgeClasses: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  arquivado: {
    label: "Arquivado",
    badgeClasses: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    dotClass: "bg-zinc-400",
  },
  erro: {
    label: "Erro de análise",
    badgeClasses: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
};

export function ProductCard({
  product,
  onViewDetails,
  onPrimaryAction,
  onEdit,
  onTogglePause,
  onArchive,
}: ProductCardProps) {
  const statusCfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.ativo;
  const isPaused = product.status === "pausado";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-home-border/80 bg-[#121620]/90 transition-all duration-200 hover:border-home-border hover:shadow-xl hover:shadow-black/50">
      {/* Topo: Imagem com Badges Flutuantes */}
      <div>
        <div className="relative h-44 w-full overflow-hidden bg-[#1b202c]">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Gradiente sutil escuro para contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-transparent to-black/40" />

          {/* Badge de Status no Canto Superior Esquerdo */}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm",
                statusCfg.badgeClasses,
              )}
            >
              <span className={cn("size-1.5 rounded-full", statusCfg.dotClass)} />
              {statusCfg.label}
            </span>
          </div>

          {/* Menu de Ações (3 Pontos) no Canto Superior Direito */}
          <div className="absolute right-3 top-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Opções do produto"
                  className="flex size-7.5 items-center justify-center rounded-lg border border-white/10 bg-black/50 text-white/80 backdrop-blur-md transition-colors hover:bg-black/70 hover:text-white cursor-pointer"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 rounded-xl border-home-border bg-[#121620] p-1 text-xs text-home-foreground"
              >
                <DropdownMenuItem
                  onClick={() => onViewDetails(product)}
                  className="gap-2 cursor-pointer focus:bg-home-surface-strong focus:text-white"
                >
                  <ExternalLink className="size-3.5 text-home-muted" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit?.(product)}
                  className="gap-2 cursor-pointer focus:bg-home-surface-strong focus:text-white"
                >
                  <Edit2 className="size-3.5 text-home-muted" />
                  Editar produto
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onTogglePause?.(product)}
                  className="gap-2 cursor-pointer focus:bg-home-surface-strong focus:text-white"
                >
                  {isPaused ? (
                    <>
                      <Play className="size-3.5 text-emerald-400" />
                      Reativar
                    </>
                  ) : (
                    <>
                      <Pause className="size-3.5 text-amber-400" />
                      Pausar
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-home-border/60" />
                <DropdownMenuItem
                  onClick={() => onArchive?.(product)}
                  className="gap-2 text-rose-400 cursor-pointer focus:bg-rose-500/10 focus:text-rose-300"
                >
                  <Archive className="size-3.5" />
                  Arquivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Informações Textuais */}
        <div className="px-4 pt-3.5">
          <h3 className="text-sm font-bold text-white tracking-tight line-clamp-1">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-home-muted line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-3">
            <span className="inline-block rounded-md border border-home-border/60 bg-home-surface/90 px-2 py-0.5 text-[10px] font-medium text-home-muted">
              {product.category}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas e Botões Inferiores */}
      <div className="px-4 pb-4 pt-3.5">
        {/* Linha de Métricas: Leads, Propostas, Vendas */}
        <div className="grid grid-cols-3 divide-x divide-home-border/60 rounded-xl border border-home-border/60 bg-home-surface/40 py-2.5 text-center">
          <div>
            <div className="text-sm font-bold text-white leading-none">
              {product.metrics.leads}
            </div>
            <div className="mt-1 text-[10px] font-medium text-home-muted">Leads</div>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">
              {product.metrics.proposals}
            </div>
            <div className="mt-1 text-[10px] font-medium text-home-muted">Propostas</div>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">
              {product.metrics.sales > 0 ? product.metrics.sales : "—"}
            </div>
            <div className="mt-1 text-[10px] font-medium text-home-muted">Vendas</div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewDetails(product)}
            className="flex-1 h-8.5 rounded-xl border border-home-border/80 bg-home-surface text-xs font-semibold text-white/90 hover:bg-home-surface-strong hover:text-white transition-colors cursor-pointer"
          >
            Ver detalhes
          </button>
          <button
            type="button"
            onClick={() => onPrimaryAction(product)}
            className="flex-1 h-8.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all duration-200 cursor-pointer"
          >
            {product.primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
