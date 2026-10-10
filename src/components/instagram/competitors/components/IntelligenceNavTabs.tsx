import {
  ChartNoAxesColumnIncreasing,
  Orbit,
  TrendingUp,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type IntelligenceTab =
  | "concorrentes"
  | "perfil"
  | "audiencias"
  | "tendencias"
  | "cruzamento";

interface IntelligenceNavTabsProps {
  activeTab: IntelligenceTab;
  onTabChange: (tab: IntelligenceTab) => void;
}

export function IntelligenceNavTabs({ activeTab, onTabChange }: IntelligenceNavTabsProps) {
  const tabs = [
    {
      id: "concorrentes" as const,
      label: "Concorrentes",
      description: "Monitore e compare",
      Icon: ChartNoAxesColumnIncreasing,
      iconColor: "text-[#E1306C]",
      iconBg: "bg-pink-50 border-pink-200/80",
    },
    {
      id: "perfil" as const,
      label: "Análise de perfil",
      description: "Insights completos",
      Icon: UserRoundSearch,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-blue-50 border-blue-200/80",
    },
    {
      id: "audiencias" as const,
      label: "Audiências",
      description: "Encontre perfis similares",
      Icon: UsersRound,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-blue-50 border-blue-200/80",
    },
    {
      id: "tendencias" as const,
      label: "Tendências",
      description: "O que está em alta",
      Icon: TrendingUp,
      iconColor: "text-[#8B5CF6]",
      iconBg: "bg-purple-50 border-purple-200/80",
    },
    {
      id: "cruzamento" as const,
      label: "Cruzamento de audiências",
      description: "Descubra interseções",
      Icon: Orbit,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-blue-50 border-blue-200/80",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            data-tab={tab.id}
            aria-label={`Aba ${tab.label}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "group flex items-center gap-3.5 rounded-2xl bg-white p-3.5 text-left transition-all",
              isActive
                ? "border-2 border-[#E1306C] shadow-sm shadow-[#E1306C]/10 ring-0"
                : "border border-slate-200/80 hover:border-slate-300 hover:shadow-xs",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                isActive
                  ? "border-[#E1306C]/30 bg-pink-50/90 text-[#E1306C]"
                  : `${tab.iconBg} ${tab.iconColor}`,
              )}
            >
              <tab.Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-xs font-bold sm:text-[13px]",
                  isActive ? "text-[#E1306C]" : "text-slate-900 group-hover:text-slate-950",
                )}
              >
                {tab.label}
              </span>
              <span
                className={cn(
                  "block truncate text-[10.5px]",
                  isActive ? "text-[#E1306C]/75 font-medium" : "text-slate-400",
                )}
              >
                {tab.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
