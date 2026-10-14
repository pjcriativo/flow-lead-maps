import { Check, Users, Target, MessageSquare, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoogleMapsApproachStepperProps {
  currentStep: number;
  onSelectStep?: (step: number) => void;
}

export function GoogleMapsApproachStepper({
  currentStep,
  onSelectStep,
}: GoogleMapsApproachStepperProps) {
  const steps = [
    {
      num: 1,
      title: "Seleção de Leads",
      sub: "Leads selecionados",
      icon: Users,
    },
    {
      num: 2,
      title: "Estratégia e Objetivo",
      sub: "Defina sua abordagem",
      icon: Target,
    },
    {
      num: 3,
      title: "Mensagens e Personalização",
      sub: "Crie suas mensagens",
      icon: MessageSquare,
    },
    {
      num: 4,
      title: "Revisão e Envio",
      sub: "Confirme e inicie",
      icon: Send,
    },
  ];

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-2.5 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {steps.map((st) => {
          const isCurrent = currentStep === st.num;
          const isPassed = currentStep > st.num;

          return (
            <button
              key={st.num}
              type="button"
              onClick={() => onSelectStep?.(st.num)}
              className={cn(
                "flex items-center gap-3 rounded-xl p-2.5 text-left transition-all cursor-pointer border",
                isCurrent
                  ? "bg-home-orange/15 border-home-orange shadow-md shadow-home-orange/15"
                  : isPassed
                    ? "bg-home-surface/40 border-home-border/60 hover:bg-home-surface/70"
                    : "bg-transparent border-transparent hover:bg-home-surface/30",
              )}
            >
              {/* Círculo do Número / Ícone */}
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  isCurrent
                    ? "bg-home-orange text-white shadow-sm shadow-home-orange/30 ring-2 ring-home-orange/40"
                    : isPassed
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-home-surface text-home-muted border border-home-border",
                )}
              >
                {isPassed ? <Check className="size-3.5" /> : st.num}
              </div>

              {/* Textos da Etapa */}
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-bold truncate leading-tight",
                    isCurrent
                      ? "text-white"
                      : isPassed
                        ? "text-home-foreground"
                        : "text-home-muted",
                  )}
                >
                  {st.title}
                </p>
                <p className="text-[10px] text-home-muted truncate leading-tight mt-0.5">
                  {st.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
