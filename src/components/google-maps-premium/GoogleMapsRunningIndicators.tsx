import { Building2, Clock, Layers, ShieldCheck, Activity } from "lucide-react";

interface GoogleMapsRunningIndicatorsProps {
  totalEmpresasEncontradas: number;
  leadsIneditos: number;
  duplicatasDescartadas: number;
  progressFound: number;
  progressTarget: number;
  elapsedSeconds: number;
  running: boolean;
}

export function GoogleMapsRunningIndicators({
  totalEmpresasEncontradas,
  leadsIneditos,
  duplicatasDescartadas,
  progressFound,
  progressTarget,
  elapsedSeconds,
  running,
}: GoogleMapsRunningIndicatorsProps) {
  // Formata o tempo decorrido no padrão MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Calcula a estimativa restante honesta baseada no ritmo médio por lead
  const getEstimativaRestante = () => {
    if (!running || progressFound <= 0 || progressTarget <= progressFound) return null;
    const tempoPorLead = elapsedSeconds / progressFound;
    const leadsRestantes = progressTarget - progressFound;
    const estimativaSegundos = Math.round(tempoPorLead * leadsRestantes);
    return formatTime(estimativaSegundos);
  };

  // Porcentagem calculada estritamente sobre dados reais (sem timers fictícios)
  const percentualProgresso =
    progressTarget > 0 ? Math.min(100, Math.round((progressFound / progressTarget) * 100)) : 0;

  const estimativa = getEstimativaRestante();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {/* 1. Empresas Encontradas */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-home-orange/15 text-home-orange shrink-0 border border-home-orange/20">
          <Building2 className="size-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Empresas encontradas
          </span>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {totalEmpresasEncontradas}
          </div>
          <span className="text-[10px] text-home-muted/80 block truncate">
            na região pesquisada
          </span>
        </div>
      </div>

      {/* 2. Leads Inéditos */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 border border-emerald-500/20">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Leads inéditos
          </span>
          <div className="text-xl font-extrabold text-white tracking-tight">{leadsIneditos}</div>
          <span className="text-[10px] text-emerald-400/90 block truncate">
            novos para sua organização
          </span>
        </div>
      </div>

      {/* 3. Duplicatas Descartadas */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/20">
          <Layers className="size-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Duplicatas descartadas
          </span>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {duplicatasDescartadas}
          </div>
          <span className="text-[10px] text-amber-400/80 block truncate">
            já entregues anteriormente
          </span>
        </div>
      </div>

      {/* 4. Progresso da Coleta */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 shrink-0 border border-blue-500/20">
          <Activity className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Progresso da coleta
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white tracking-tight">
              {percentualProgresso}%
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="mt-1 h-1.5 w-full rounded-full bg-home-border/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percentualProgresso}%` }}
            />
          </div>
          <span className="text-[9px] text-home-muted/80 block mt-0.5 truncate">
            {progressFound} de {progressTarget} leads
          </span>
        </div>
      </div>

      {/* 5. Tempo Decorrido */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 shadow-sm backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/20">
          <Clock className="size-5" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
            Tempo decorrido
          </span>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {formatTime(elapsedSeconds)}
          </div>
          <span className="text-[10px] text-home-muted/80 block truncate">
            {estimativa
              ? `estimativa restante: ${estimativa}`
              : running
                ? "em execução"
                : "finalizado"}
          </span>
        </div>
      </div>
    </div>
  );
}
