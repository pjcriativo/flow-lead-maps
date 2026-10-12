import { useState } from "react";
import { ChevronDown, MoreHorizontal, Sparkles, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StrategyItem } from "./agentes-data";

interface RecentStrategiesSectionProps {
  strategies: StrategyItem[];
  onViewStrategy: (strategy: StrategyItem) => void;
}

const TAG_COLORS: Record<StrategyItem["categoryColor"], string> = {
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  pink: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
};

export function RecentStrategiesSection({
  strategies,
  onViewStrategy,
}: RecentStrategiesSectionProps) {
  const [productFilter, setProductFilter] = useState("all");

  const filtered = strategies.filter((item) => {
    if (productFilter === "all") return true;
    return item.productName.toLowerCase().includes(productFilter.toLowerCase());
  });

  return (
    <div className="space-y-3.5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Estratégias recentes
          </h2>
          <p className="text-xs text-home-muted mt-0.5">
            Estratégias geradas pelos seus agentes de IA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Dropdown Todos os produtos */}
          <div className="relative">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              aria-label="Filtrar por produto"
              className="h-8.5 appearance-none rounded-xl border border-home-border/80 bg-[#121620] pl-3 pr-8 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border focus:border-home-orange cursor-pointer"
            >
              <option value="all" className="bg-[#121620] text-white">
                Todos os produtos
              </option>
              <option value="Curso de Marketing" className="bg-[#121620] text-white">
                Curso de Marketing Digital
              </option>
              <option value="Consultoria" className="bg-[#121620] text-white">
                Consultoria Empresarial
              </option>
              <option value="Plano Fitness" className="bg-[#121620] text-white">
                Plano Fitness Premium
              </option>
              <option value="Hospedagem" className="bg-[#121620] text-white">
                Hospedagem Boutique
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-home-muted" />
          </div>

          <button
            type="button"
            onClick={() =>
              toast.info("Histórico completo de estratégias em expansão nas próximas fases.")
            }
            className="text-xs font-medium text-home-muted hover:text-white transition-colors cursor-pointer"
          >
            Ver todas
          </button>
        </div>
      </div>

      {/* Grid de 4 Cards de Estratégias */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.map((item) => {
          const isHigh = item.impactPotential === "Alto";

          return (
            <div
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-home-border/80 bg-[#121620]/90 transition-all duration-200 hover:border-home-border hover:shadow-xl hover:shadow-black/50"
            >
              <div>
                {/* Imagem de Capa com Tags */}
                <div className="relative h-36 w-full overflow-hidden bg-[#1b202c]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121620] via-transparent to-black/30" />

                  {/* Tag de Categoria */}
                  <div className="absolute left-2.5 top-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-md shadow-sm",
                        TAG_COLORS[item.categoryColor],
                      )}
                    >
                      {item.categoryTag}
                    </span>
                  </div>

                  {/* Tempo Relativo */}
                  <div className="absolute right-2.5 top-2.5">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-md">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Título e Produto */}
                <div className="px-3.5 pt-3">
                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-home-muted truncate">
                    {item.productName}
                  </p>
                </div>
              </div>

              {/* Indicadores e Ações */}
              <div className="px-3.5 pb-3.5 pt-3">
                {/* Métricas: Ações Recomendadas e Potencial de Impacto */}
                <div className="flex items-center justify-between border-t border-home-border/50 pt-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-home-muted">
                    <User className="size-3 text-home-muted" />
                    <span className="font-bold text-white">{item.recommendedActions}</span>
                    <span className="text-[10px]">Ações recomendadas</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Zap
                      className={cn(
                        "size-3",
                        isHigh ? "text-orange-400" : "text-amber-400",
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold text-[11px]",
                        isHigh ? "text-orange-400" : "text-amber-400",
                      )}
                    >
                      {item.impactPotential}
                    </span>
                    <span className="text-[10px] text-home-muted">Potencial de impacto</span>
                  </div>
                </div>

                {/* Botão Ver estratégia e Menu de 3 Pontos */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewStrategy(item)}
                    className="flex-1 h-8 rounded-xl border border-home-border/80 bg-home-surface text-xs font-semibold text-white/90 hover:bg-home-surface-strong hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Ver estratégia
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toast.info(`Opções para "${item.title}" em desenvolvimento.`)
                    }
                    aria-label="Mais opções"
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-home-border/80 bg-home-surface text-home-muted hover:text-white transition-colors cursor-pointer"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
