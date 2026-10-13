import { Calendar, Clock, ListChecks, Search, Users } from "lucide-react";
import type { GoogleMapsStats } from "./useGoogleMapsStats";

interface GoogleMapsStatsCardsProps {
  stats: GoogleMapsStats;
}

export function GoogleMapsStatsCards({ stats }: GoogleMapsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Leads disponíveis */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 transition-colors hover:border-home-border/90">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
          <Users className="size-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-home-muted truncate">Leads disponíveis</p>
          <p className="text-base font-bold text-white tracking-tight truncate">
            {stats.leadsDisponiveisFormatado}
          </p>
          <p className="text-[10px] font-medium text-home-muted/80 truncate">
            {stats.leadsDisponiveisSub}
          </p>
        </div>
      </div>

      {/* 2. Buscas realizadas */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 transition-colors hover:border-home-border/90">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
          <Search className="size-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-home-muted truncate">Buscas realizadas</p>
          <p className="text-base font-bold text-white tracking-tight truncate">
            {stats.buscasRealizadas}
          </p>
          <p className="text-[10px] font-medium text-home-muted/80 truncate">
            {stats.buscasRealizadasSub}
          </p>
        </div>
      </div>

      {/* 3. Listas criadas */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 transition-colors hover:border-home-border/90">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-home-orange">
          <ListChecks className="size-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-home-muted truncate">Listas criadas</p>
          <p className="text-base font-bold text-white tracking-tight truncate">
            {stats.listasCriadas}
          </p>
          <p className="text-[10px] font-medium text-home-muted/80 truncate">
            {stats.listasCriadasSub}
          </p>
        </div>
      </div>

      {/* 4. Taxa média de contatos */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 transition-colors hover:border-home-border/90">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
          <Clock className="size-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-home-muted truncate">Taxa média de contatos</p>
          <p className="text-base font-bold text-white tracking-tight truncate">
            {stats.taxaContatosFormatada}
          </p>
          <p className="text-[10px] font-medium text-home-muted/80 truncate">
            {stats.taxaContatosSub}
          </p>
        </div>
      </div>

      {/* 5. Última prospecção */}
      <div className="col-span-2 sm:col-span-1 flex items-center gap-3.5 rounded-2xl border border-home-border bg-home-surface/90 p-4 transition-colors hover:border-home-border/90">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-home-orange">
          <Calendar className="size-5.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-home-muted truncate">Última prospecção</p>
          <p className="text-base font-bold text-white tracking-tight truncate">
            {stats.ultimaProspeccaoData}
          </p>
          <p className="text-[10px] font-medium text-home-muted/80 truncate">
            {stats.ultimaProspeccaoSub}
          </p>
        </div>
      </div>
    </div>
  );
}
