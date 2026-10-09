import { MessageCircle, Radio, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProspectingSubMode = "hunter" | "niche" | "comments" | "radar";

interface ProspectingActionCardsProps {
  activeMode: ProspectingSubMode;
  onSelectMode: (mode: ProspectingSubMode) => void;
}

export function ProspectingActionCards({
  activeMode,
  onSelectMode,
}: ProspectingActionCardsProps) {
  const cards = [
    {
      id: "hunter" as ProspectingSubMode,
      title: "Caça-clientes",
      subtitle: "Busca inteligente",
      icon: Target,
      activeColor: "border-rose-200 bg-rose-50/30 text-[#E1306C]",
      iconBgActive: "bg-[#E1306C]/10 text-[#E1306C]",
      iconBgInactive: "bg-rose-50 text-rose-500",
    },
    {
      id: "niche" as ProspectingSubMode,
      title: "Busca por nicho",
      subtitle: "Encontre no seu ICP",
      icon: Users,
      activeColor: "border-blue-200 bg-blue-50/30 text-[#2563EB]",
      iconBgActive: "bg-[#2563EB]/10 text-[#2563EB]",
      iconBgInactive: "bg-blue-50 text-[#2563EB]",
    },
    {
      id: "comments" as ProspectingSubMode,
      title: "Comentários",
      subtitle: "Pessoas que interagem",
      icon: MessageCircle,
      activeColor: "border-blue-200 bg-blue-50/30 text-[#2563EB]",
      iconBgActive: "bg-[#2563EB]/10 text-[#2563EB]",
      iconBgInactive: "bg-blue-50 text-[#2563EB]",
    },
    {
      id: "radar" as ProspectingSubMode,
      title: "Radar de conteúdo",
      subtitle: "Posts que concentram demanda",
      icon: Radio,
      activeColor: "border-blue-200 bg-blue-50/30 text-[#2563EB]",
      iconBgActive: "bg-[#2563EB]/10 text-[#2563EB]",
      iconBgInactive: "bg-blue-50 text-[#2563EB]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isActive = activeMode === card.id;
        const Icon = card.icon;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectMode(card.id)}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 shadow-sm",
              isActive
                ? cn(card.activeColor, "ring-1 ring-rose-200/50 shadow-rose-100/30")
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60",
            )}
          >
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl transition-colors",
                isActive ? card.iconBgActive : card.iconBgInactive,
              )}
            >
              <Icon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h4
                className={cn(
                  "text-sm font-bold tracking-tight truncate",
                  isActive ? "text-[#E1306C]" : "text-slate-900",
                )}
              >
                {card.title}
              </h4>
              <p
                className={cn(
                  "text-xs truncate",
                  isActive ? "text-[#E1306C]/80" : "text-slate-400",
                )}
              >
                {card.subtitle}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
