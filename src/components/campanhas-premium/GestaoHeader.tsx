import { CheckCircle2, ChevronRight, Download, RefreshCw, Settings, Utensils } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GestaoHeaderProps {
  campanhaNome: string;
  status: "ativa" | "concluida" | string;
  onBack: () => void;
  onOpenConfig: () => void;
  onExport: () => void;
  onToggleStatus: () => void;
  className?: string;
}

export function GestaoHeader({
  campanhaNome,
  status,
  onBack,
  onOpenConfig,
  onExport,
  onToggleStatus,
  className,
}: GestaoHeaderProps) {
  const isConcluida = status === "concluida";

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-home-muted">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Campanhas
        </button>
        <ChevronRight className="size-3.5 text-home-muted/60" />
        <span className="font-medium text-white">{campanhaNome}</span>
      </nav>

      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Badge Icon do Nicho / Campanha */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-sm">
            <Utensils className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {campanhaNome}
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
              Gerencie os leads desta campanha, gere sites e propostas com IA e envie para seus contatos.
            </p>
          </div>
        </div>

        {/* Botões de Ação no Topo Direito */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenConfig}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
          >
            <Settings className="size-3.5 text-home-muted" />
            Configurações
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
          >
            <Download className="size-3.5 text-home-muted" />
            Exportar
          </button>

          <button
            type="button"
            onClick={onToggleStatus}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all duration-200 active:scale-[0.98]",
              isConcluida
                ? "border border-home-border bg-home-surface text-home-foreground hover:bg-home-surface-strong"
                : "bg-home-orange text-white shadow-[0_0_24px_rgba(255,98,0,0.35)] hover:bg-home-orange/90 hover:shadow-[0_0_30px_rgba(255,98,0,0.5)]",
            )}
          >
            {isConcluida ? (
              <>
                <RefreshCw className="size-3.5" />
                Reabrir campanha
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5" />
                Concluir campanha
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
