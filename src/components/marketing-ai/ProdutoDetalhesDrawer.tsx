import { ExternalLink, Package, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProductItem } from "./marketing-data";

interface ProdutoDetalhesDrawerProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPrimaryAction: (product: ProductItem) => void;
}

export function ProdutoDetalhesDrawer({
  product,
  isOpen,
  onClose,
  onPrimaryAction,
}: ProdutoDetalhesDrawerProps) {
  if (!product) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-home-border/80 bg-[#121620] p-6 text-white overflow-y-auto scrollbar-none"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
            <Package className="size-3.5" />
            <span>Detalhes da Oferta</span>
          </div>
          <SheetTitle className="text-xl font-bold text-white mt-1">
            {product.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-home-muted">
            Cadastrado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
          </SheetDescription>
        </SheetHeader>

        {/* Imagem de Capa */}
        <div className="mt-4 relative h-48 w-full overflow-hidden rounded-xl border border-home-border/60 bg-black/40">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="size-full object-cover"
          />
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-md border border-home-border/80 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
              {product.category}
            </span>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-home-border/60 rounded-xl border border-home-border/60 bg-home-surface/60 py-3 text-center">
          <div>
            <div className="text-base font-bold text-white">{product.metrics.leads}</div>
            <div className="text-[10px] text-home-muted mt-0.5">Leads</div>
          </div>
          <div>
            <div className="text-base font-bold text-white">{product.metrics.proposals}</div>
            <div className="text-[10px] text-home-muted mt-0.5">Propostas</div>
          </div>
          <div>
            <div className="text-base font-bold text-white">
              {product.metrics.sales > 0 ? product.metrics.sales : "—"}
            </div>
            <div className="text-[10px] text-home-muted mt-0.5">Vendas</div>
          </div>
        </div>

        {/* Informações detalhadas */}
        <div className="mt-5 space-y-3.5 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
              Descrição
            </span>
            <p className="mt-1 text-home-foreground leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.price ? (
            <div>
              <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                Valor Base
              </span>
              <p className="mt-1 font-bold text-emerald-400 text-sm">
                {product.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: product.currency || "BRL",
                })}
              </p>
            </div>
          ) : null}

          {product.targetAudience && (
            <div>
              <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                Público-Alvo
              </span>
              <p className="mt-1 text-home-foreground leading-relaxed">
                {product.targetAudience}
              </p>
            </div>
          )}

          {product.mainBenefits && (
            <div>
              <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                Benefícios Principais
              </span>
              <p className="mt-1 text-home-foreground leading-relaxed">
                {product.mainBenefits}
              </p>
            </div>
          )}

          {product.salesPageUrl && (
            <div>
              <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                Página de Vendas
              </span>
              <a
                href={product.salesPageUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-orange-400 hover:underline break-all"
              >
                <ExternalLink className="size-3.5 shrink-0" />
                <span>{product.salesPageUrl}</span>
              </a>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-6 pt-4 border-t border-home-border/60 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-home-border/80 bg-home-surface text-xs font-semibold text-white/90 hover:bg-home-surface-strong cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onPrimaryAction(product);
            }}
            className="flex-1 h-9 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] cursor-pointer"
          >
            {product.primaryActionLabel}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
