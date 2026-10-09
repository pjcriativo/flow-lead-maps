import { useMemo } from "react";
import { TodayHero } from "./components/TodayHero";
import { TodayKpiGrid } from "./components/TodayKpiGrid";
import { TodayTaskQueue } from "./components/TodayTaskQueue";
import { TodayUpcomingActions } from "./components/TodayUpcomingActions";
import { TodayInsights } from "./components/TodayInsights";
import type {
  FlowBusinessAccount,
  FlowBusinessCadence,
  FlowBusinessCard,
  FlowBusinessPlan,
  FlowBusinessTask,
  FlowBusinessAutomationSnapshot,
} from "@/services/flow-business";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

export interface FlowBusinessTodayProps {
  tasks: FlowBusinessTask[];
  plan: FlowBusinessPlan;
  cards?: FlowBusinessCard[];
  cadences?: FlowBusinessCadence[];
  accounts?: FlowBusinessAccount[];
  automation?: FlowBusinessAutomationSnapshot | null;
  onComplete: (task: FlowBusinessTask) => Promise<void>;
  onNavigate: (view: InstagramView) => void;
}

export function FlowBusinessToday({
  tasks,
  plan,
  cards = [],
  cadences = [],
  accounts = [],
  automation = null,
  onComplete,
  onNavigate,
}: FlowBusinessTodayProps) {
  // Contagem real de tarefas vencidas ou previstas para hoje
  const dueCount = useMemo(() => {
    const now = new Date();
    // Considera tarefas com prazo hoje ou anteriores
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return tasks.filter((t) => new Date(t.dueAt) <= endOfToday).length;
  }, [tasks]);

  // Contagem de cadências ativas reais
  const activeCadencesCount = useMemo(() => {
    if (cadences.length > 0) {
      return cadences.filter((c) => c.isActive).length;
    }
    return plan.used.cadences;
  }, [cadences, plan.used.cadences]);

  // Contagem de contas conectadas reais
  const connectedAccountsCount = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.filter((a) => a.status === "conectado").length;
    }
    return plan.used.accounts;
  }, [accounts, plan.used.accounts]);

  // Contagem real de respostas hoje
  const repliesTodayCount = useMemo(() => {
    if (automation && typeof automation.usage.daily === "number") {
      return automation.usage.daily;
    }
    return cards.filter((c) => c.stage === "respondeu").length;
  }, [automation, cards]);

  return (
    <div className="space-y-6">
      {/* 1. Hero Principal com Copy e Composição Visual */}
      <TodayHero dueCount={dueCount} onNavigate={onNavigate} />

      {/* 2. Grid de 4 Indicadores (KPIs) */}
      <TodayKpiGrid
        crmContactsCount={cards.length > 0 ? cards.length : plan.used.crmContacts}
        activeCadencesCount={activeCadencesCount}
        connectedAccountsCount={connectedAccountsCount}
        repliesTodayCount={repliesTodayCount}
        plan={plan}
        onNavigate={onNavigate}
      />

      {/* 3. Área Operacional: Fila de Hoje à esquerda e Painéis à direita */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        {/* Lado Esquerdo: Fila de hoje */}
        <TodayTaskQueue
          tasks={tasks}
          cards={cards}
          onComplete={onComplete}
          onNavigate={onNavigate}
        />

        {/* Lado Direito: Próximas ações e Insights da AISA */}
        <div className="space-y-6">
          <TodayUpcomingActions tasks={tasks} cards={cards} onNavigate={onNavigate} />
          <TodayInsights cards={cards} tasks={tasks} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
