import {
  BarChart3,
  CheckCircle,
  MessageCircleReply,
  PhoneCall,
  Trophy,
  Users,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LeadListWithFullStats } from "./listas-premium-data";
import { calculateListResultMetrics } from "./listas-premium-metrics";

interface ListaResultadosTabProps {
  lista: LeadListWithFullStats;
}

interface MetricCardProps {
  label: string;
  value: number | null;
  description: string;
  icon: LucideIcon;
}

function MetricCard({ label, value, description, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-home-muted">{label}</span>
        <Icon className="size-4 text-amber-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-white tabular-nums">
        {value === null ? "—" : value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-[11px] text-home-muted">{description}</p>
    </div>
  );
}

export function ListaResultadosTab({ lista }: ListaResultadosTabProps) {
  const metrics = calculateListResultMetrics(lista);
  const contactRate =
    metrics.totalLeads > 0
      ? Math.round((metrics.leadsComContatoDisponivel / metrics.totalLeads) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 text-xs text-blue-100">
        Contato disponível indica apenas que o lead possui algum canal cadastrado. Não significa que
        uma abordagem foi enviada. Contatos realizados, respostas, conversões e clientes ganhos
        permanecem neutros até existir rastreamento consolidado por lista.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total de leads"
          value={metrics.totalLeads}
          description="Leads atualmente vinculados à lista"
          icon={Users}
        />
        <MetricCard
          label="Contato disponível"
          value={metrics.leadsComContatoDisponivel}
          description={`${contactRate}% possuem ao menos um canal cadastrado`}
          icon={PhoneCall}
        />
        <MetricCard
          label="Campanhas vinculadas"
          value={metrics.campanhasVinculadas}
          description="Campanhas criadas; não implica execução"
          icon={BarChart3}
        />
        <MetricCard
          label="Contatos realizados"
          value={metrics.contatosRealizados}
          description="Sem rastreamento consolidado por lista"
          icon={CheckCircle}
        />
        <MetricCard
          label="Respostas"
          value={metrics.respostas}
          description="Sem rastreamento consolidado por lista"
          icon={MessageCircleReply}
        />
        <MetricCard
          label="Conversões"
          value={metrics.conversoes}
          description="Sem definição persistida por lista"
          icon={UserRoundCheck}
        />
        <MetricCard
          label="Clientes ganhos"
          value={metrics.clientesGanhos}
          description="Sem atribuição persistida por lista"
          icon={Trophy}
        />
      </div>

      <div className="rounded-2xl border border-home-border bg-home-surface/90 p-5 backdrop-blur-md">
        <h4 className="mb-3 text-xs font-bold text-white sm:text-sm">
          Cobertura de dados disponível
        </h4>
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-home-muted">Leads vinculados</span>
              <span className="font-bold text-white tabular-nums">
                {metrics.totalLeads.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-home-surface-strong">
              <div className="h-full w-full rounded-full bg-blue-500" />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-home-muted">
                Leads com canal de contato disponível
              </span>
              <span className="font-bold text-white tabular-nums">
                {metrics.leadsComContatoDisponivel.toLocaleString("pt-BR")} ({contactRate}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-home-surface-strong">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${contactRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
