import { ExternalLink, Sparkles, User, Zap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { StrategyItem } from "./agentes-data";

interface EstrategiaDetalhesDrawerProps {
  strategy: StrategyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCriarCampanha: (strategy: StrategyItem) => void;
}

export function EstrategiaDetalhesDrawer({
  strategy,
  isOpen,
  onClose,
  onCriarCampanha,
}: EstrategiaDetalhesDrawerProps) {
  if (!strategy) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-home-border/80 bg-[#121620] p-6 text-white overflow-y-auto scrollbar-none"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            <span>Plano Estratégico de IA</span>
          </div>
          <SheetTitle className="text-xl font-bold text-white mt-1">
            {strategy.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-home-muted">
            Produto: {strategy.productName} • {strategy.timeAgo}
          </SheetDescription>
        </SheetHeader>

        {/* Imagem de Capa */}
        <div className="mt-4 relative h-44 w-full overflow-hidden rounded-xl border border-home-border/60 bg-black/40">
          <img
            src={strategy.imageUrl}
            alt={strategy.title}
            className="size-full object-cover"
          />
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-md border border-home-border/80 bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
              {strategy.categoryTag}
            </span>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="mt-4 grid grid-cols-2 divide-x divide-home-border/60 rounded-xl border border-home-border/60 bg-home-surface/60 py-3 text-center">
          <div>
            <div className="text-base font-bold text-white flex items-center justify-center gap-1.5">
              <User className="size-4 text-home-muted" />
              <span>{strategy.recommendedActions}</span>
            </div>
            <div className="text-[10px] text-home-muted mt-0.5">Ações Recomendadas</div>
          </div>
          <div>
            <div className="text-base font-bold text-orange-400 flex items-center justify-center gap-1.5">
              <Zap className="size-4 text-orange-400" />
              <span>{strategy.impactPotential}</span>
            </div>
            <div className="text-[10px] text-home-muted mt-0.5">Potencial de Impacto</div>
          </div>
        </div>

        {/* Detalhamento do Plano */}
        <div className="mt-5 space-y-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
              Diagnóstico Estratégico
            </span>
            <p className="mt-1 text-home-foreground leading-relaxed">
              Estratégia sintetizada com base na análise do mercado concorrente e no público-alvo
              identificado para {strategy.productName}. O objetivo é otimizar o custo de aquisição e
              ampliar a taxa de conversão nas primeiras abordagens.
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-home-muted uppercase tracking-wider">
              Etapas Recomendadas
            </span>
            <ul className="mt-1.5 space-y-2 text-home-foreground">
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold mt-0.5">
                  1
                </span>
                <span>Configuração de segmentação por raio e intenção de compra.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold mt-0.5">
                  2
                </span>
                <span>Disparo de copies contextuais focadas na dor principal identificada.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold mt-0.5">
                  3
                </span>
                <span>Remarketing via WhatsApp com cadência automatizada em 4 etapas.</span>
              </li>
            </ul>
          </div>
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
              onCriarCampanha(strategy);
            }}
            className="flex-1 h-9 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] cursor-pointer"
          >
            Criar Campanha
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
