import { Calendar, CalendarPlus, Plus } from "lucide-react";

interface CalendarioPublicacoesHeaderProps {
  onConectarCanais: () => void;
  onNavigateToProdutos?: () => void;
}

export function CalendarioPublicacoesHeader({
  onConectarCanais,
  onNavigateToProdutos,
}: CalendarioPublicacoesHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-home-muted">
        <button
          type="button"
          onClick={onNavigateToProdutos}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Flow Marketing AI
        </button>
        <span>&gt;</span>
        <span className="text-white font-medium">Calendário de Publicações</span>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Icon, Title & Subtitle */}
        <div className="flex items-start gap-3.5">
          <div className="size-11 rounded-xl bg-gradient-to-br from-[#FF6200]/25 to-[#FF6200]/5 border border-[#FF6200]/40 flex items-center justify-center shrink-0 shadow-[0_0_18px_rgba(255,98,0,0.2)]">
            <Calendar className="size-5 text-home-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Calendário de Publicações
            </h1>
            <p className="text-xs text-home-muted mt-0.5 max-w-2xl">
              Planeje, agende e publique seus conteúdos em todos os canais. Acompanhe o status e o desempenho em tempo real.
            </p>
          </div>
        </div>

        {/* Right: Promotional Banner Card (Publicação automática) */}
        <div className="flex items-center gap-3 self-start lg:self-center bg-[#101622]/90 border border-home-border/70 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="size-8 rounded-lg bg-home-orange/15 border border-home-orange/30 flex items-center justify-center shrink-0">
            <CalendarPlus className="size-4 text-home-orange" />
          </div>
          <div className="pr-1">
            <div className="text-xs font-bold text-white">
              Publicação automática em múltiplos canais
            </div>
            <div className="text-[11px] text-home-muted">
              Conecte suas contas e deixe que a IA publique no melhor horário.
            </div>
          </div>
          <button
            type="button"
            onClick={onConectarCanais}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-home-orange hover:bg-home-orange-hover text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="size-3.5" />
            Conectar canais
          </button>
        </div>
      </div>
    </div>
  );
}
