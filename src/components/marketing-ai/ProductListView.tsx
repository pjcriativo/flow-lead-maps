import { ExternalLink, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductItem, ProductStatus } from "./marketing-data";

interface ProductListViewProps {
  products: ProductItem[];
  onViewDetails: (product: ProductItem) => void;
  onPrimaryAction: (product: ProductItem) => void;
}

const STATUS_BADGES: Record<ProductStatus, { label: string; badge: string }> = {
  ativo: {
    label: "Ativo",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  em_analise: {
    label: "Em análise",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  rascunho: {
    label: "Rascunho",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  pausado: {
    label: "Pausado",
    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  arquivado: {
    label: "Arquivado",
    badge: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  },
  erro: {
    label: "Erro",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
};

export function ProductListView({
  products,
  onViewDetails,
  onPrimaryAction,
}: ProductListViewProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-home-border/80 bg-[#121620] py-16 text-center">
        <p className="text-sm font-medium text-white">Nenhum produto encontrado</p>
        <p className="mt-1 text-xs text-home-muted">Ajuste os filtros de busca ou cadastre uma nova oferta.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-home-border/80 bg-[#121620]/90">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/60 bg-home-surface/60 text-home-muted">
              <th className="py-3 pl-4 pr-3 font-semibold">Produto / Oferta</th>
              <th className="px-3 py-3 font-semibold">Categoria</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold text-center">Leads</th>
              <th className="px-3 py-3 font-semibold text-center">Propostas</th>
              <th className="px-3 py-3 font-semibold text-center">Vendas</th>
              <th className="py-3 pl-3 pr-4 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/50">
            {products.map((product) => {
              const statusCfg = STATUS_BADGES[product.status] || STATUS_BADGES.ativo;

              return (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-home-surface/30 group"
                >
                  <td className="py-3.5 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="size-11 rounded-xl object-cover shrink-0 border border-home-border/60 bg-home-surface"
                      />
                      <div>
                        <div className="font-bold text-white group-hover:text-home-orange transition-colors">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-home-muted line-clamp-1 max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="rounded-md border border-home-border/60 bg-home-surface px-2 py-0.5 text-[10px] font-medium text-home-muted">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        statusCfg.badge,
                      )}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold text-white">
                    {product.metrics.leads}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold text-white">
                    {product.metrics.proposals}
                  </td>
                  <td className="px-3 py-3.5 text-center font-bold text-white">
                    {product.metrics.sales > 0 ? product.metrics.sales : "—"}
                  </td>
                  <td className="py-3.5 pl-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(product)}
                        className="h-7 rounded-lg border border-home-border/80 bg-home-surface px-2.5 text-[11px] font-semibold text-white/90 hover:bg-home-surface-strong cursor-pointer"
                      >
                        Ver detalhes
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrimaryAction(product)}
                        className="h-7 rounded-lg bg-[#ff6200] hover:bg-[#ff751a] px-3 text-[11px] font-semibold text-white shadow-sm transition-all cursor-pointer"
                      >
                        {product.primaryActionLabel}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
