import { HelpCircle, Sparkles } from "lucide-react";

interface MarketingHeaderProps {
  onOpenComoFunciona: () => void;
}

export function MarketingHeader({ onOpenComoFunciona }: MarketingHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Título e Subtítulo Principal */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ff6200]/15 text-[#ff802b] border border-[#ff6200]/30">
          <span>Em breve</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Flow Marketing AI
        </h1>
        <p className="text-xs sm:text-sm text-home-muted max-w-2xl">
          Transforme seus produtos e serviços em campanhas de alto desempenho com agentes de IA.
        </p>
      </div>

      {/* Banner Visual: Agentes de IA trabalhando para o seu negócio */}
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
              Da análise do seu produto à execução das campanhas, tudo em um só lugar.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenComoFunciona}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white px-3.5 py-2 text-xs font-semibold shadow-[0_0_20px_rgba(255,98,0,0.35)] transition-all duration-200 cursor-pointer shrink-0"
        >
          <HelpCircle className="size-3.5" />
          <span>Como funciona?</span>
        </button>
      </div>
    </div>
  );
}
