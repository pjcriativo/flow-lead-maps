import { Check, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type RunningStepStatus = "waiting" | "active" | "completed" | "error";

export interface RunningStep {
  id: number;
  title: string;
  subtitle: string;
  timeOrStatus?: string;
  status: RunningStepStatus;
}

interface GoogleMapsRunningStepperProps {
  currentStep: number;
  elapsedSeconds: number;
  running: boolean;
  hasError?: boolean;
}

export function GoogleMapsRunningStepper({
  currentStep,
  elapsedSeconds,
  running,
  hasError = false,
}: GoogleMapsRunningStepperProps) {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const steps: RunningStep[] = [
    {
      id: 1,
      title: "Inicializando",
      subtitle: "Validando configuração e reservando cota",
      timeOrStatus:
        currentStep > 1 ? "00:03" : running ? formatTime(elapsedSeconds) : "Aguardando...",
      status:
        currentStep > 1
          ? "completed"
          : currentStep === 1
            ? hasError
              ? "error"
              : "active"
            : "waiting",
    },
    {
      id: 2,
      title: "Coletando do Google Maps",
      subtitle: "Buscando empresas na região via Apify",
      timeOrStatus:
        currentStep > 2
          ? "Concluído"
          : currentStep === 2
            ? formatTime(elapsedSeconds)
            : "Aguardando...",
      status:
        currentStep > 2
          ? "completed"
          : currentStep === 2
            ? hasError
              ? "error"
              : "active"
            : "waiting",
    },
    {
      id: 3,
      title: "Processando resultados",
      subtitle: "Filtrando, enriquecendo e removendo duplicatas",
      timeOrStatus:
        currentStep > 3 ? "Concluído" : currentStep === 3 ? "Em andamento..." : "Aguardando...",
      status:
        currentStep > 3
          ? "completed"
          : currentStep === 3
            ? hasError
              ? "error"
              : "active"
            : "waiting",
    },
    {
      id: 4,
      title: "Salvando leads",
      subtitle: "Gravando na sua organização e criando a lista",
      timeOrStatus:
        currentStep > 4 ? "Concluído" : currentStep === 4 ? "Gravando..." : "Aguardando...",
      status:
        currentStep > 4
          ? "completed"
          : currentStep === 4
            ? hasError
              ? "error"
              : "active"
            : "waiting",
    },
    {
      id: 5,
      title: "Concluindo",
      subtitle: "Finalizando e preparando seus resultados",
      timeOrStatus: currentStep >= 5 ? "Concluído" : "Aguardando...",
      status: currentStep >= 5 ? "completed" : currentStep === 5 && running ? "active" : "waiting",
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-sm backdrop-blur-md">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5 relative">
        {steps.map((st, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={st.id} className="relative flex items-start gap-3">
              {/* Círculo indicador do passo */}
              <div className="relative shrink-0 flex items-center justify-center">
                {st.status === "completed" ? (
                  <div className="flex size-7 items-center justify-center rounded-full bg-home-orange text-white shadow-md shadow-home-orange/30">
                    <Check className="size-4 stroke-[3]" />
                  </div>
                ) : st.status === "active" ? (
                  <div className="flex size-7 items-center justify-center rounded-full border-2 border-home-orange bg-home-orange/20 text-home-orange font-bold text-xs ring-4 ring-home-orange/20 animate-pulse">
                    <span>{st.id}</span>
                  </div>
                ) : st.status === "error" ? (
                  <div className="flex size-7 items-center justify-center rounded-full bg-red-500 text-white font-bold text-xs">
                    <span>!</span>
                  </div>
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full border border-home-border bg-[#101720] text-home-muted font-bold text-xs">
                    <span>{st.id}</span>
                  </div>
                )}
              </div>

              {/* Informações textuais da etapa */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4
                    className={cn(
                      "text-xs font-bold leading-tight truncate",
                      st.status === "completed" || st.status === "active"
                        ? "text-white"
                        : "text-home-muted",
                    )}
                  >
                    {st.title}
                  </h4>
                </div>

                <p className="text-[10px] text-home-muted/80 leading-snug line-clamp-2">
                  {st.subtitle}
                </p>

                <div className="pt-0.5 flex items-center gap-1 text-[10px]">
                  {st.status === "active" && running ? (
                    <span className="flex items-center gap-1 text-home-orange font-semibold">
                      <Loader2 className="size-2.5 animate-spin" />
                      {st.timeOrStatus}
                    </span>
                  ) : (
                    <span className="text-home-muted/70">{st.timeOrStatus}</span>
                  )}
                </div>
              </div>

              {/* Linha conectora entre as etapas (visível em telas sm+) */}
              {!isLast && (
                <div className="hidden sm:block absolute right-0 top-3.5 w-4 h-0.5 -mr-2 bg-home-border/60 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
