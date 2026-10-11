import { ChevronRight, Sparkles, Target } from "lucide-react";

export interface IntelligenceInsightItem {
  id: string;
  kind: "growth";
  title: string;
  description: string;
  evidence: string;
}

interface AisaInsightsCardProps {
  insights?: IntelligenceInsightItem[];
  onViewAll?: () => void;
  onSelectInsight?: (index: number) => void;
}

export function AisaInsightsCard({
  insights = [],
  onViewAll,
  onSelectInsight,
}: AisaInsightsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Insights dos dados</h3>
            <p className="text-[11px] text-slate-400">Regras locais sobre dados coletados</p>
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
      <div className="mt-4 space-y-3">
        {insights.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectInsight?.(index)}
            className="group flex w-full items-start gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-50"
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-50 text-[#E1306C]">
              <Target className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900">{item.title}</div>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                {item.description}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">Origem: {item.evidence}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        ))}
        {!insights.length ? (
          <p className="py-3 text-center text-xs text-slate-400">
            Ainda não há histórico suficiente para gerar insights.
          </p>
        ) : null}
      </div>
    </div>
  );
}
