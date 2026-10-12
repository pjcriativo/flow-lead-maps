import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestaoProcessStepsProps {
  totalLeads: number;
  emProcessamento: number;
  rascunhos: number;
  enviados: number;
  activeStep?: number;
  onSelectStep?: (step: number) => void;
  className?: string;
}

export function GestaoProcessSteps({
  totalLeads = 250,
  emProcessamento = 180,
  rascunhos = 45,
  enviados = 20,
  activeStep = 1,
  onSelectStep,
  className,
}: GestaoProcessStepsProps) {
  const steps = [
    {
      num: 1,
      title: "Selecionar leads",
      countLabel: `${totalLeads} leads`,
      isActive: true,
      isCurrent: activeStep === 1,
    },
    {
      num: 2,
      title: "Gerar sites e propostas",
      countLabel: `${emProcessamento} em processamento`,
      isActive: true,
      isCurrent: activeStep === 2,
    },
    {
      num: 3,
      title: "Revisar e aprovar",
      countLabel: `${rascunhos} rascunhos`,
      isActive: rascunhos > 0,
      isCurrent: activeStep === 3,
    },
    {
      num: 4,
      title: "Enviar propostas",
      countLabel: `${enviados} enviados`,
      isActive: enviados > 0,
      isCurrent: activeStep === 4,
    },
    {
      num: 5,
      title: "Acompanhar resultados",
      countLabel: "Em andamento",
      isActive: false,
      isCurrent: activeStep === 5,
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        className,
      )}
    >
      {steps.map((s, index) => {
        const isFirst = s.num === 1;
        const isSecond = s.num === 2;

        return (
          <div
            key={s.num}
            onClick={() => onSelectStep?.(s.num)}
            className={cn(
              "relative flex items-center justify-between rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer",
              isFirst
                ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                : isSecond
                  ? "border-home-border bg-home-surface/90 hover:border-home-border/80"
                  : "border-home-border bg-home-surface/60 hover:bg-home-surface",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Círculo do Número */}
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isFirst || isSecond
                    ? "bg-home-orange text-white shadow-sm"
                    : "border border-home-border bg-home-surface text-home-muted",
                )}
              >
                {s.num}
              </div>

              {/* Título e Subtítulo */}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {s.title}
                </div>
                <div
                  className={cn(
                    "text-[11px] truncate",
                    isFirst
                      ? "text-amber-400 font-medium"
                      : "text-home-muted",
                  )}
                >
                  {s.countLabel}
                </div>
              </div>
            </div>

            {/* Ícone de Seta (Exceto no último) */}
            {index < steps.length - 1 && (
              <ChevronRight
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isFirst ? "text-amber-400/80" : "text-home-muted/40",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
