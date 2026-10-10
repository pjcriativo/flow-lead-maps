import { ChevronRight, Hash, Sparkles, Target, Users } from "lucide-react";

interface AisaInsightsCardProps {
  onViewAll?: () => void;
  onSelectInsight?: (index: number) => void;
}

export function AisaInsightsCard({ onViewAll, onSelectInsight }: AisaInsightsCardProps) {
  const insights = [
    {
      id: "insight-1",
      icon: Target,
      iconColor: "text-[#E1306C]",
      iconBg: "bg-pink-50",
      title: "Crescimento acelerado",
      description: "2 concorrentes aumentaram mais de 20% seus seguidores no último mês.",
    },
    {
      id: "insight-2",
      icon: Users,
      iconColor: "text-[#2563EB]",
      iconBg: "bg-blue-50",
      title: "Oportunidade de audiência",
      description: "12.4K perfis seguem seus concorrentes e ainda não seguem seu perfil.",
    },
    {
      id: "insight-3",
      icon: Hash,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      title: "Hashtags em alta",
      description: "#pizzaartesanal está com 340% mais menções na sua região.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Insights da AISA</h3>
            <p className="text-[11px] text-slate-400">
              Análises estratégicas para o seu mercado
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="rounded-lg border border-slate-200/90 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Ver todos
        </button>
      </div>

      {/* Lista de Insights */}
      <div className="mt-4 space-y-3">
        {insights.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectInsight?.(index)}
            className="group flex w-full items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-50"
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor} mt-0.5`}
            >
              <item.icon className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900">{item.title}</div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                {item.description}
              </p>
            </div>

            <ChevronRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
