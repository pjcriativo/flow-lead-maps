import { Check, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampanhaPremiumItem } from "./campanhas-premium-data";

interface CampanhaSummaryPanelProps {
  campanha: CampanhaPremiumItem;
  className?: string;
}

const STEPS = ["Leads", "Site", "Proposta", "Aprovação", "Envio"];

export function CampanhaSummaryPanel({ campanha, className }: CampanhaSummaryPanelProps) {
  const currentStep = campanha.stepperStep ?? 1;
  const statusLabel = campanha.status === "concluida" ? "Concluída" : "Em produção";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-4 rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-home-muted">
          Resumo da campanha selecionada
        </h3>

        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-home-border bg-home-background text-sm font-bold text-white">
            {campanha.name.slice(0, 1).toUpperCase() || "—"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold leading-snug tracking-tight text-white">
                  {campanha.name}
                </h4>
                <p className="mt-0.5 text-[11px] leading-tight text-home-muted">{campanha.niche}</p>
              </div>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
                {statusLabel}
              </span>
            </div>
            <div className="mt-2.5 inline-flex items-center gap-1 rounded-md border border-home-border bg-home-background px-2 py-0.5 text-[10px] font-medium text-home-foreground">
              <Mail className="size-2.5 text-blue-400" />
              {campanha.channelLabel}
            </div>
          </div>
        </div>

        <div className="border-t border-home-border/60 pt-3">
          <div className="relative flex items-start justify-between">
            <div className="absolute left-3 right-3 top-3 h-0.5 -translate-y-1/2 bg-home-border" />
            <div
              className="absolute left-3 top-3 h-0.5 -translate-y-1/2 bg-blue-500"
              style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%` }}
            />
            {STEPS.map((step, index) => {
              const number = index + 1;
              const done = number < currentStep;
              const active = number === currentStep;
              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border text-[11px]",
                      done && "border-blue-500 bg-blue-500 text-white",
                      active && "border-home-orange bg-home-orange text-white",
                      !done && !active && "border-home-border bg-home-surface text-home-muted",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : number}
                  </div>
                  <span
                    className={cn(
                      "text-[10px]",
                      active ? "font-bold text-white" : "text-home-muted",
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-home-border/60 pt-3">
          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-amber-400" />
              <span className="text-base font-bold tabular-nums text-white">
                {campanha.leadsCount}
              </span>
            </div>
            <span className="text-[10px] text-home-muted">Leads registrados</span>
          </div>
          <div className="rounded-xl border border-home-border/70 bg-home-background/60 p-2.5">
            <span className="text-base font-bold text-white">—</span>
            <div className="text-[10px] text-home-muted">Respostas sem medição consolidada</div>
          </div>
        </div>
      </div>

      <NeutralCard
        title="Próximas ações"
        message="Nenhuma ação automática comprovada para exibir."
      />
      <NeutralCard
        title="Saúde operacional"
        message="Sem telemetria consolidada dos provedores nesta tela."
      />
      <NeutralCard
        title="Distribuição por etapa"
        message={`${campanha.leadsCount.toLocaleString("pt-BR")} lead(s) registrados nesta campanha.`}
      />
    </div>
  );
}

function NeutralCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-2 rounded-2xl border border-home-border bg-home-surface/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
      <h3 className="text-xs font-bold tracking-tight text-white">{title}</h3>
      <p className="rounded-xl border border-dashed border-home-border p-3 text-[11px] text-home-muted">
        {message}
      </p>
    </div>
  );
}
