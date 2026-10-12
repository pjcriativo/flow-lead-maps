import { ChevronRight, Download, Eye, Share2, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultadosHeaderProps {
  campanhaNome?: string;
  status?: "em_producao" | "concluida" | string;
  onBackToCentral: () => void;
  onBackToProducao: () => void;
  onExportReport: () => void;
  onShare: () => void;
  className?: string;
}

export function ResultadosHeader({
  campanhaNome = "Restaurante Premium SP",
  status = "em_producao",
  onBackToCentral,
  onBackToProducao,
  onExportReport,
  onShare,
  className,
}: ResultadosHeaderProps) {
  const isConcluida = status === "concluida";

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Breadcrumb de 3 Níveis */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-home-muted">
        <button
          type="button"
          onClick={onBackToCentral}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Campanhas
        </button>
        <ChevronRight className="size-3.5 text-home-muted/60" />
        <button
          type="button"
          onClick={onBackToProducao}
          className="hover:text-white transition-colors cursor-pointer"
        >
          {campanhaNome}
        </button>
        <ChevronRight className="size-3.5 text-home-muted/60" />
        <span className="font-medium text-white">Resultados</span>
      </nav>

      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Badge Icon do Nicho */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-sm">
            <Utensils className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Resultados da Campanha
              </h1>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                  isConcluida
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/15 text-amber-400",
                )}
              >
                {isConcluida ? "Concluída" : "Em produção"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-home-muted sm:text-sm">
              Acompanhe o desempenho, analise os resultados e identifique novas oportunidades de negócio.
            </p>
          </div>
        </div>

        {/* Botões de Ação no Topo Direito */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onExportReport}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
          >
            <Download className="size-3.5 text-home-muted" />
            Exportar relatório
          </button>

          <button
            type="button"
            onClick={onShare}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
          >
            <Share2 className="size-3.5 text-home-muted" />
            Compartilhar
          </button>

          <button
            type="button"
            onClick={onBackToProducao}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.35)] transition-all duration-200 hover:bg-home-orange/90 hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] active:scale-[0.98]"
          >
            <Eye className="size-3.5" />
            Ver campanha
          </button>
        </div>
      </div>
    </div>
  );
}
