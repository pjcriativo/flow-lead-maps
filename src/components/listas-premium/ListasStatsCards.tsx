// Cinco Indicadores Superiores da Central de Listas Premium
import { List, Users, Target, Megaphone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListasStatsCardsProps {
  kpis: {
    totalListas: number;
    totalLeads: number;
    listasComEstrategia: number;
    campanhasVinculadas: number;
    aguardandoAcao: number;
  };
  className?: string;
}

export function ListasStatsCards({ kpis, className }: ListasStatsCardsProps) {
  const cards = [
    {
      id: "total_listas",
      titulo: "Total de listas",
      valor: kpis.totalListas.toLocaleString("pt-BR"),
      badge: "↑ 12%",
      badgeTrend: "up" as const,
      subtitulo: "Listas criadas na sua conta",
      icon: List,
      iconBg: "bg-amber-500/15 text-amber-500",
    },
    {
      id: "leads_listas",
      titulo: "Leads nas listas",
      valor: kpis.totalLeads.toLocaleString("pt-BR"),
      badge: "↑ 18%",
      badgeTrend: "up" as const,
      subtitulo: "Leads totais em todas as listas",
      icon: Users,
      iconBg: "bg-blue-500/15 text-blue-400",
    },
    {
      id: "listas_estrategia",
      titulo: "Listas com estratégia",
      valor: kpis.listasComEstrategia.toLocaleString("pt-BR"),
      badge: "↑ 29%",
      badgeTrend: "up" as const,
      subtitulo: "Com estratégia definida",
      icon: Target,
      iconBg: "bg-amber-600/15 text-amber-500",
    },
    {
      id: "campanhas_vinculadas",
      titulo: "Campanhas vinculadas",
      valor: kpis.campanhasVinculadas.toLocaleString("pt-BR"),
      badge: "↑ 27%",
      badgeTrend: "up" as const,
      subtitulo: "Campanhas ativas nas listas",
      icon: Megaphone,
      iconBg: "bg-orange-500/15 text-orange-500",
    },
    {
      id: "aguardando_acao",
      titulo: "Aguardando ação",
      valor: kpis.aguardandoAcao.toLocaleString("pt-BR"),
      badge: "↓ 14%",
      badgeTrend: "down" as const,
      subtitulo: "Listas que precisam de atenção",
      icon: Clock,
      iconBg: "bg-amber-500/15 text-amber-400",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
        className,
      )}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md transition-all duration-200 hover:border-home-border/90 hover:bg-home-surface-strong/95"
          >
            {/* Top row: Icon + Title */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                  card.iconBg,
                )}
              >
                <Icon className="size-4.5 stroke-[2.2]" />
              </div>
              <span className="text-xs font-medium text-home-muted line-clamp-1">
                {card.titulo}
              </span>
            </div>

            {/* Middle row: Value + Trend Badge */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
                {card.valor}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  card.badgeTrend === "up"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/25",
                )}
              >
                {card.badge}
              </span>
            </div>

            {/* Bottom subtitle */}
            <p className="mt-1 text-[11px] text-home-muted/80 line-clamp-1">
              {card.subtitulo}
            </p>
          </div>
        );
      })}
    </div>
  );
}
