import { Sparkles, Check, ArrowRight, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  recursoNome: string;
  recursoDescricao?: string;
};

export function UpgradePlanModal({ isOpen, onClose, recursoNome, recursoDescricao }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-navy via-navy/90 to-primary p-6 text-white">
          <div className="flex items-center gap-2 rounded-full bg-gold/20 text-gold px-3 py-1 text-xs font-bold w-fit mb-3 border border-gold/30">
            <Sparkles className="h-3.5 w-3.5" /> RECURSO DO PLANO PRO & AGÊNCIA
          </div>
          <h3 className="text-xl font-bold font-serif flex items-center gap-2">
            <Lock className="h-5 w-5 text-gold" /> Desbloqueie o {recursoNome}
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            {recursoDescricao || `O recurso de ${recursoNome} é exclusivo para assinantes dos planos Pro e Agência.`}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-2">
            <p className="text-xs font-bold text-navy uppercase tracking-wider">
              O que você ganha com o Upgrade para o Plano Pro:
            </p>
            <ul className="space-y-2 text-xs text-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 font-bold" />
                <span><b>5.000 leads / mês</b> (5x mais que o plano Básico)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 font-bold" />
                <span><b>Prospecção em Instagram e LinkedIn</b> com dados enriquecidos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 font-bold" />
                <span><b>Gerador de Propostas em PDF & Contratos</b> prontos para assinar</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 font-bold" />
                <span><b>Campanhas e Automações de WhatsApp</b> integradas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 font-bold" />
                <span><b>Redesign Inteligente e Publicador de Sites</b></span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link to="/pricing" className="w-full sm:flex-1">
              <Button className="w-full h-11 bg-gold text-navy hover:bg-gold/90 font-bold shadow-md hover:shadow-lg gap-2 text-sm">
                Fazer Upgrade Agora <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto h-11 border-border text-muted-foreground text-xs"
            >
              Continuar no Plano Básico
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
