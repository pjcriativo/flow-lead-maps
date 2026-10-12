import {
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock,
  HelpCircle,
  Megaphone,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ComoFuncionaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComoFuncionaModal({ isOpen, onClose }: ComoFuncionaModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none rounded-2xl border-home-border/80 bg-[#121620] p-6 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Como funciona o Flow Marketing AI
              </DialogTitle>
              <DialogDescription className="text-xs text-home-muted mt-0.5">
                Visão do fluxo operacional e das 5 etapas da inteligência artificial aplicada ao seu negócio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-3.5 text-xs">
          {/* Etapa 1 - Ativa */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  1. Produtos e Serviços (Disponível agora)
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="size-3" /> Ativo
              </span>
            </div>
            <p className="mt-2 text-home-foreground/90 leading-relaxed">
              Você cadastra suas ofertas, preços, público-alvo e páginas de venda. Essas informações
              servem como a base de conhecimento de negócio (Knowledge Base) para que os agentes de IA
              compreendam o posicionamento da sua empresa.
            </p>
          </div>

          {/* Etapa 2 - Em breve */}
          <div className="rounded-xl border border-home-border/70 bg-home-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrainCircuit className="size-4 text-purple-400" />
                <span className="font-bold text-white text-sm">
                  2. Agentes e Estratégias (Próxima etapa)
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                <Clock className="size-3" /> Em breve
              </span>
            </div>
            <p className="mt-2 text-home-muted leading-relaxed">
              Agentes especializados de IA analisam suas ofertas, estudam o mercado e desenham funis
              comerciais sob medida, definindo canais prioritários, propostas de valor e personas.
            </p>
          </div>

          {/* Etapa 3 - Em breve */}
          <div className="rounded-xl border border-home-border/70 bg-home-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-blue-400" />
                <span className="font-bold text-white text-sm">
                  3. Campanhas e Conteúdos
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                <Clock className="size-3" /> Em breve
              </span>
            </div>
            <p className="mt-2 text-home-muted leading-relaxed">
              Geração de materiais publicitários, copies para Instagram, WhatsApp, scripts de vídeo e
              landing pages integradas diretamente com os mecanismos de disparo do Flow Business.
            </p>
          </div>

          {/* Etapa 4 - Em breve */}
          <div className="rounded-xl border border-home-border/70 bg-home-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-teal-400" />
                <span className="font-bold text-white text-sm">
                  4. Calendário e Publicações
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                <Clock className="size-3" /> Em breve
              </span>
            </div>
            <p className="mt-2 text-home-muted leading-relaxed">
              Cronograma editorial e comercial inteligente com distribuição estratégica ao longo das
              semanas, adaptando horários e frequência de contato com base no engajamento dos leads.
            </p>
          </div>

          {/* Etapa 5 - Em breve */}
          <div className="rounded-xl border border-home-border/70 bg-home-surface/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-rose-400" />
                <span className="font-bold text-white text-sm">
                  5. Resultados e ROI
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                <Clock className="size-3" /> Em breve
              </span>
            </div>
            <p className="mt-2 text-home-muted leading-relaxed">
              Rastreamento de conversão de cada oferta em tempo real, calculando custo de aquisição,
              taxa de fechamento de propostas e retorno financeiro atribuído às campanhas.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-home-border/60 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#ff6200] hover:bg-[#ff751a] px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
