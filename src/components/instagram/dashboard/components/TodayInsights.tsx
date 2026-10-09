import { useMemo } from "react";
import { ArrowRight, ChevronRight, Clock3, MessagesSquare, Sparkles, UsersRound } from "lucide-react";
import type { FlowBusinessCard, FlowBusinessTask } from "@/services/flow-business";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface TodayInsightsProps {
  cards: FlowBusinessCard[];
  tasks: FlowBusinessTask[];
  onNavigate: (view: InstagramView) => void;
}

export function TodayInsights({ cards, tasks, onNavigate }: TodayInsightsProps) {
  // 1. Leads prontos para DM (quentes ou em estágio pronto_abordar)
  const leadsReadyCount = useMemo(() => {
    return cards.filter(
      (c) =>
        c.stage === "pronto_abordar" ||
        (c.temperature === "quente" && ["novo", "analisando", "aquecendo"].includes(c.stage)),
    ).length;
  }, [cards]);

  // 2. Respostas aguardando follow-up (cards que responderam)
  const waitingFollowUpCount = useMemo(() => {
    return cards.filter((c) => c.stage === "respondeu").length;
  }, [cards]);

  // 3. Cadências / tarefas com atraso (tarefas cujo dueAt já passou do horário atual)
  const delayedTasksCount = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => new Date(t.dueAt) < now).length;
  }, [tasks]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-[#833AB4]">
            <Sparkles className="size-4 sm:size-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Insights da AISA
            </h3>
            <p className="text-[11px] text-slate-400">Recomendações para acelerar seus resultados.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("overview")}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#833AB4] transition-colors"
        >
          <span>Ver todos os insights</span>
          <ArrowRight className="size-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#833AB4]" />
        </button>
      </div>

      {/* 3 Blocos de Insights */}
      <div className="mt-4 space-y-2.5">
        {/* Bloco 1: Leads prontos para DM */}
        <button
          type="button"
          onClick={() => onNavigate("crm")}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#E1306C]">
              <UsersRound className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {leadsReadyCount > 0
                  ? `${leadsReadyCount} leads prontos para DM`
                  : "Nenhum lead aguardando DM"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Perfis que interagiram e têm alto potencial de conversão.
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
        </button>

        {/* Bloco 2: Respostas aguardando follow-up */}
        <button
          type="button"
          onClick={() => onNavigate("inbox")}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <MessagesSquare className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {waitingFollowUpCount > 0
                  ? `${waitingFollowUpCount} respostas aguardando follow-up`
                  : "Nenhuma resposta pendente"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Pessoas que responderam e ainda não receberam retorno.
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
        </button>

        {/* Bloco 3: Cadências com atraso */}
        <button
          type="button"
          onClick={() => onNavigate("cadences")}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 text-left transition-all hover:border-slate-200 hover:bg-slate-50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {delayedTasksCount > 0
                  ? `${delayedTasksCount} cadência${delayedTasksCount > 1 ? "s" : ""} com atraso`
                  : "Cadências em dia"}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {delayedTasksCount > 0
                  ? "Há uma sequência que precisa ser retomada hoje."
                  : "Nenhuma pendência crítica acumulada."}
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
        </button>
      </div>
    </div>
  );
}
