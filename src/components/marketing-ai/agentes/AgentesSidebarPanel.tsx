import {
  BarChart3,
  CalendarDays,
  Compass,
  Info,
  Rocket,
  ScanSearch,
  Share2,
  Sliders,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StrategicInsightItem } from "./agentes-data";

interface AgentesSidebarPanelProps {
  userName?: string;
  insights: StrategicInsightItem[];
  onCriarCampanha?: () => void;
}

export function AgentesSidebarPanel({
  userName = "Carlos",
  insights,
  onCriarCampanha,
}: AgentesSidebarPanelProps) {
  const handleActionClick = (actionName: string) => {
    toast.info(
      `O recurso "${actionName}" foi disparado para processamento com os Agentes de IA.`,
      { duration: 4000 },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Card Assistente de Estratégias com IA */}
      <div className="rounded-2xl border border-home-border/80 bg-[#121620]/90 p-4 shadow-lg shadow-black/40">
        {/* Header do Card */}
        <div className="flex items-center justify-between pb-3 border-b border-home-border/50">
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Assistente de Estratégias com IA
          </h2>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
            Beta
          </span>
        </div>

        {/* Saudação com Avatar com Efeito Gradiente */}
        <div className="mt-3.5 flex items-start gap-3 rounded-xl border border-home-border/60 bg-home-surface/50 p-3">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ff6200] via-rose-500 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(255,98,0,0.3)]">
            <div className="flex size-full items-center justify-center rounded-[10px] bg-[#121620]">
              <Sparkles className="size-4 text-[#ff751a]" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Olá, {userName}!</h4>
            <p className="mt-0.5 text-[11px] text-home-muted leading-relaxed">
              Vou analisar seus produtos e criar estratégias personalizadas para aumentar seus
              resultados.
            </p>
          </div>
        </div>

        {/* 6 Ações Apresentadas */}
        <div className="mt-3.5 space-y-1">
          <button
            type="button"
            onClick={() => handleActionClick("Analisar produto selecionado")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <Compass className="size-3.5 text-home-muted" />
            <span>Analisar produto selecionado</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("Criar estratégia completa")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <Sparkles className="size-3.5 text-home-muted" />
            <span>Criar estratégia completa</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("Sugerir canais de aquisição")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <Share2 className="size-3.5 text-home-muted" />
            <span>Sugerir canais de aquisição</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("Gerar calendário de conteúdos")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <CalendarDays className="size-3.5 text-home-muted" />
            <span>Gerar calendário de conteúdos</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("Analisar concorrentes")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <ScanSearch className="size-3.5 text-home-muted" />
            <span>Analisar concorrentes</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("Otimizar campanhas existentes")}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
          >
            <Sliders className="size-3.5 text-home-muted" />
            <span>Otimizar campanhas existentes</span>
          </button>
        </div>
      </div>

      {/* 2. Card Insights Estratégicos da IA */}
      <div className="rounded-2xl border border-home-border/80 bg-[#121620]/90 p-4 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between pb-3 border-b border-home-border/50">
          <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight">
            Insights estratégicos da IA
          </h2>
          <button
            type="button"
            onClick={() =>
              toast.info("Histórico completo de insights em expansão com a esteira de análise.")
            }
            className="text-[11px] font-medium text-home-muted hover:text-white transition-colors cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {insights.map((insight) => {
            const isGreen = insight.badgeColor === "green";
            const isBlue = insight.badgeColor === "blue";

            return (
              <div
                key={insight.id}
                className="flex items-start gap-2.5 rounded-xl border border-home-border/60 bg-home-surface/40 p-2.5 transition-colors hover:bg-home-surface/70"
              >
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border mt-0.5",
                    isGreen && "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
                    isBlue && "border-blue-500/30 bg-blue-500/15 text-blue-400",
                    !isGreen && !isBlue && "border-purple-500/30 bg-purple-500/15 text-purple-400",
                  )}
                >
                  {isGreen && <TrendingUp className="size-3" />}
                  {isBlue && <Info className="size-3" />}
                  {!isGreen && !isBlue && <Sparkles className="size-3" />}
                </div>

                <div>
                  <div
                    className={cn(
                      "text-[11px] font-bold leading-tight",
                      isGreen && "text-emerald-400",
                      isBlue && "text-blue-400",
                      !isGreen && !isBlue && "text-purple-400",
                    )}
                  >
                    {insight.badgeLabel}
                  </div>
                  <p className="mt-1 text-[11px] text-home-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Card Promocional Inferior: Implemente suas estratégias */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#1b1c2b] via-[#161726] to-[#0d0e18] p-4.5 shadow-xl shadow-black/50">
        {/* Efeito de iluminação suave */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 size-48 rounded-full bg-gradient-to-br from-orange-500/30 via-red-500/20 to-transparent blur-2xl" />

        <div className="relative z-10 max-w-[190px]">
          <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
            Implemente suas estratégias
          </h3>
          <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
            Transforme as recomendações em campanhas reais com um clique.
          </p>

          <button
            type="button"
            onClick={onCriarCampanha}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white px-3.5 py-1.5 text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all duration-200 cursor-pointer"
          >
            <span>Criar campanha agora</span>
          </button>
        </div>

        {/* Ilustração Gráfica do Foguete */}
        <div className="absolute -bottom-2 -right-1 z-0 opacity-90 transition-transform duration-300 hover:scale-105 pointer-events-none">
          <div className="relative flex items-center justify-center size-28">
            <div className="absolute bottom-2 right-4 h-16 w-24 bg-gradient-to-r from-transparent via-orange-500/60 to-amber-400/80 blur-md transform rotate-[-25deg] rounded-full" />
            <Rocket className="size-16 text-[#ff751a] stroke-[1.7] transform rotate-45 drop-shadow-[0_0_15px_rgba(255,98,0,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
