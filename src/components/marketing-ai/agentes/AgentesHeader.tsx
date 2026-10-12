import { ChevronRight, HelpCircle, Sparkles } from "lucide-react";

interface AgentesHeaderProps {
  onOpenComoFunciona: () => void;
  onNavigateToProdutos?: () => void;
}

export function AgentesHeader({
  onOpenComoFunciona,
  onNavigateToProdutos,
}: AgentesHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Breadcrumb Superior */}
      <div className="flex items-center gap-1.5 text-xs text-home-muted">
        <button
          type="button"
          onClick={onNavigateToProdutos}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Flow Marketing AI
        </button>
        <ChevronRight className="size-3 text-home-muted/60" />
        <span className="text-white font-medium">Agentes e Estratégias</span>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Título Principal com Ícone Laranja */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-10.5 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-orange-500/30 text-[#ff751a] shadow-[0_0_15px_rgba(255,98,0,0.25)] mt-0.5">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Agentes de IA e Estratégias
            </h1>
            <p className="text-xs sm:text-sm text-home-muted max-w-2xl mt-1 leading-relaxed">
              Agentes especializados que analisam seus produtos, mercado e concorrentes para criar
              estratégias personalizadas.
            </p>
          </div>
        </div>

        {/* Banner Visual à Direita */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 rounded-2xl border border-home-border/80 bg-[#121620]/90 p-3 sm:px-4.5 sm:py-3 shadow-lg shadow-black/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/30 text-[#ff7a24] shadow-[0_0_15px_rgba(255,98,0,0.2)]">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-white">
                Agentes de IA trabalhando para o seu negócio
              </h3>
              <p className="text-[11px] text-home-muted mt-0.5">
                Análise, estratégia e execução em um só lugar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenComoFunciona}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white px-3.5 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all duration-200 cursor-pointer shrink-0"
          >
            <HelpCircle className="size-3.5" />
            <span>Ver como funciona?</span>
          </button>
        </div>
      </div>
    </div>
  );
}
