import { Instagram, MessageCircleMore, UsersRound, Zap } from "lucide-react";
import { TodayKpiCard } from "./TodayKpiCard";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";
import type { FlowBusinessPlan } from "@/services/flow-business";

interface TodayKpiGridProps {
  crmContactsCount: number;
  activeCadencesCount: number;
  connectedAccountsCount: number;
  repliesTodayCount: number;
  plan: FlowBusinessPlan;
  onNavigate: (view: InstagramView) => void;
}

export function TodayKpiGrid({
  crmContactsCount,
  activeCadencesCount,
  connectedAccountsCount,
  repliesTodayCount,
  plan,
  onNavigate,
}: TodayKpiGridProps) {
  const crmSubtext =
    plan.limits.crmContacts === null
      ? "Acesso Ilimitado"
      : `${crmContactsCount}/${plan.limits.crmContacts} contatos`;

  const cadencesSubtext =
    plan.limits.cadences === null
      ? "Acesso Ilimitado"
      : `${activeCadencesCount}/${plan.limits.cadences} cadências`;

  const accountsSubtext =
    plan.limits.accounts === null
      ? "Acesso Ilimitado"
      : `${connectedAccountsCount}/${plan.limits.accounts} contas`;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 01 — Contatos no CRM (Azul) */}
      <TodayKpiCard
        icon={UsersRound}
        title="Contatos no CRM"
        value={crmContactsCount}
        subtext={crmSubtext}
        iconBgClass="bg-blue-50/80"
        iconColorClass="text-[#2563EB]"
        barColorClass="w-full bg-[#2563EB]"
        onClick={() => onNavigate("crm")}
      />

      {/* Card 02 — Cadências ativas (Roxo) */}
      <TodayKpiCard
        icon={Zap}
        title="Cadências ativas"
        value={activeCadencesCount}
        subtext={cadencesSubtext}
        iconBgClass="bg-purple-50/80"
        iconColorClass="text-[#833AB4]"
        barColorClass="w-full bg-[#833AB4]"
        onClick={() => onNavigate("cadences")}
      />

      {/* Card 03 — Contas conectadas (Verde) */}
      <TodayKpiCard
        icon={Instagram}
        title="Contas conectadas"
        value={connectedAccountsCount}
        subtext={accountsSubtext}
        iconBgClass="bg-emerald-50/80"
        iconColorClass="text-[#10B981]"
        barColorClass="w-full bg-[#10B981]"
        onClick={() => onNavigate("accounts")}
      />

      {/* Card 04 — Respostas hoje (Rosa) */}
      <TodayKpiCard
        icon={MessageCircleMore}
        title="Respostas hoje"
        value={repliesTodayCount}
        trendText={repliesTodayCount > 0 ? "↗ +200% vs. ontem" : undefined}
        subtext={repliesTodayCount === 0 ? "Nenhuma resposta hoje" : undefined}
        iconBgClass="bg-pink-50/80"
        iconColorClass="text-[#E1306C]"
        barColorClass="w-full bg-[#E1306C]"
        onClick={() => onNavigate("inbox")}
      />
    </section>
  );
}
