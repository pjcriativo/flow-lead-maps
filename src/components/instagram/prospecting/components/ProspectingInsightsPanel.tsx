import { Activity, ChevronRight, Flame, Sparkles, Users } from "lucide-react";
import type { ProspectProfileItem } from "./ProspectingResultsTable";

interface ProspectingInsightsPanelProps {
  profiles?: ProspectProfileItem[];
  onNavigateAisa?: () => void;
  onNavigateNiches?: () => void;
}

export function ProspectingInsightsPanel({
  profiles = [],
  onNavigateAisa,
  onNavigateNiches,
}: ProspectingInsightsPanelProps) {
  const highPotential = profiles.filter((profile) => profile.relevance === "Alta").length;
  const highEngagement = profiles.filter(
    (profile) => profile.engagementRate != null && profile.engagementRate >= 3,
  ).length;
  const commercial = profiles.filter((profile) => profile.commercial).length;
  const categoryCounts = new Map<string, number>();
  for (const profile of profiles) {
    if (profile.category === "—") continue;
    categoryCounts.set(profile.category, (categoryCounts.get(profile.category) ?? 0) + 1);
  }
  const niches = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const percent = (count: number) =>
    profiles.length > 0 ? Math.round((count / profiles.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-[#833AB4]">
              <Sparkles className="size-4" />
            </div>
            <h4 className="text-sm font-bold tracking-tight text-slate-900">
              Insights dos resultados
            </h4>
          </div>
          <button
            type="button"
            onClick={onNavigateAisa}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Ver todos
          </button>
        </div>
        <div className="mt-3.5 space-y-2.5">
          {[
            [`${highPotential} perfis com alto potencial`, "Com base no score persistido."],
            [`${highEngagement} com alto engajamento`, "Somente taxas disponíveis no provedor."],
            [`${commercial} perfis comerciais`, "Contas profissionais ou com categoria."],
          ].map(([title, description]) => (
            <div
              key={title}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#E1306C]">
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{title}</p>
                  <p className="truncate text-[11px] text-slate-500">{description}</p>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-slate-300" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-orange-50 text-[#F77737]">
              <Flame className="size-4 fill-[#F77737]" />
            </div>
            <h4 className="text-sm font-bold tracking-tight text-slate-900">Nichos encontrados</h4>
          </div>
          <button
            type="button"
            onClick={onNavigateNiches}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Ver mais
          </button>
        </div>
        <div className="mt-3.5 space-y-3.5">
          {niches.length > 0 ? (
            niches.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{name}</p>
                    <p className="text-[10px] text-slate-400">
                      {count} {count === 1 ? "perfil" : "perfis"}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-slate-700">{percent(count)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#E1306C]"
                    style={{ width: `${percent(count)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">
              Sem categorias disponíveis nos resultados.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
            <Activity className="size-4" />
          </div>
          <h4 className="text-sm font-bold tracking-tight text-slate-900">Resultados atuais</h4>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            [profiles.length, "Exibidos"],
            [commercial, "Comerciais"],
            [highPotential, "Alta relevância"],
          ].map(([value, label]) => (
            <div key={String(label)}>
              <span className="text-lg font-extrabold tabular-nums text-[#2563EB] sm:text-xl">
                {value}
              </span>
              <p className="mt-1 text-[10px] leading-tight text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
