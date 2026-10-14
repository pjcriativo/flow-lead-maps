import { CheckCircle2, Clock, Layers, Search, Star, Users } from "lucide-react";
import type { SearchHistoryIndicators } from "./google-maps-history-types";

interface GoogleMapsHistoryIndicatorsProps {
  indicators: SearchHistoryIndicators;
  loading?: boolean;
}

export function GoogleMapsHistoryIndicators({
  indicators,
  loading = false,
}: GoogleMapsHistoryIndicatorsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {/* 1. Total de buscas */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-sm">
            <Search className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Total de buscas
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {loading ? "…" : indicators.totalBuscas}
              </span>
            </div>
            <span className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1">
              {indicators.totalBuscasSub}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Leads coletados */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm">
            <CheckCircle2 className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Leads coletados
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {loading ? "…" : indicators.leadsColetados.toLocaleString("pt-BR")}
              </span>
            </div>
            <span className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1">
              {indicators.leadsColetadosSub}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Leads inéditos */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-sm">
            <Layers className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Leads inéditos
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {loading ? "…" : indicators.leadsIneditos.toLocaleString("pt-BR")}
              </span>
            </div>
            <span className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1">
              {indicators.leadsIneditosSub}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Listas criadas */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400 shadow-sm">
            <Users className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Listas criadas
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {loading ? "…" : indicators.listasCriadas.toLocaleString("pt-BR")}
              </span>
            </div>
            <span className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1">
              {indicators.listasCriadasSub}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Tempo total de coleta */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 shadow-sm">
            <Clock className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Tempo total de coleta
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {indicators.tempoTotalColeta}
              </span>
            </div>
            <span
              title="A duração é informada quando os eventos de coleta foram integralmente registrados."
              className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1 cursor-help"
            >
              {indicators.tempoTotalColetaSub}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Taxa de sucesso */}
      <div className="rounded-2xl border border-home-border/80 bg-home-surface/90 p-4 shadow-sm transition-all hover:border-home-border">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-sm">
            <Star className="size-4.5" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-home-muted line-clamp-1">
              Taxa de sucesso
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {indicators.taxaSucessoFormatada}
              </span>
            </div>
            <span className="block text-[10px] text-home-muted/80 mt-0.5 line-clamp-1">
              {indicators.taxaSucessoSub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
