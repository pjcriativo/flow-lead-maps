import { useState } from "react";
import {
  Activity,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  MessagesSquare,
  Shirt,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProspectingInsightsPanelProps {
  onNavigateAisa?: () => void;
  onNavigateNiches?: () => void;
}

export function ProspectingInsightsPanel({
  onNavigateAisa,
  onNavigateNiches,
}: ProspectingInsightsPanelProps) {
  const [activityRange, setActivityRange] = useState("7d");

  return (
    <div className="space-y-6">
      {/* Card 1: Insights da AISA */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-purple-50 text-[#833AB4]">
              <Sparkles className="size-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Insights da AISA
            </h4>
          </div>

          <button
            type="button"
            onClick={onNavigateAisa}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Ver todos
          </button>
        </div>

        {/* 3 Items */}
        <div className="mt-3.5 space-y-2.5">
          {/* Item 1 */}
          <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#E1306C]">
                <Users className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  12 perfis com alto potencial
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Com base no seu ICP e engajamento.
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
          </div>

          {/* Item 2 */}
          <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                <MessagesSquare className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  8 perfis responderam recentemente
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Boa oportunidade para abordagem.
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
          </div>

          {/* Item 3 */}
          <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 hover:bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  3 nichos em alta na sua região
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  Aumento de 45% nas conversas.
                </p>
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500 shrink-0" />
          </div>
        </div>
      </div>

      {/* Card 2: Nichos em destaque */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-orange-50 text-[#F77737]">
              <Flame className="size-4 fill-[#F77737]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Nichos em destaque
            </h4>
          </div>

          <button
            type="button"
            onClick={onNavigateNiches}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Ver mais
          </button>
        </div>

        {/* 4 Nichos com Barras de Progresso */}
        <div className="mt-3.5 space-y-3.5">
          {/* Nicho 1: Restaurantes e Bares */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <UtensilsCrossed className="size-3" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-none">
                    Restaurantes e Bares
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">234 perfis</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 tabular-nums">32%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#E1306C]" style={{ width: "32%" }} />
            </div>
          </div>

          {/* Nicho 2: Beleza e Estética */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Sparkles className="size-3" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-none">
                    Beleza e Estética
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">187 perfis</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 tabular-nums">28%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#833AB4]" style={{ width: "28%" }} />
            </div>
          </div>

          {/* Nicho 3: Saúde e Bem-estar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Heart className="size-3 fill-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-none">
                    Saúde e Bem-estar
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">156 perfis</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 tabular-nums">22%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#F77737]" style={{ width: "22%" }} />
            </div>
          </div>

          {/* Nicho 4: Moda e Acessórios */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <Shirt className="size-3" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 leading-none">
                    Moda e Acessórios
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">134 perfis</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 tabular-nums">18%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: "18%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Sua atividade */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
              <Activity className="size-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              Sua atividade
            </h4>
          </div>

          <Select value={activityRange} onValueChange={setActivityRange}>
            <SelectTrigger className="h-7 w-auto rounded-lg border-slate-200 bg-white text-[11px] font-medium text-slate-600 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4 Métricas Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#2563EB] tracking-tight tabular-nums">
              892
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Perfis encontrados
            </p>
          </div>

          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#833AB4] tracking-tight tabular-nums">
              156
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Analisados
            </p>
          </div>

          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#10B981] tracking-tight tabular-nums">
              48
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Salvos no CRM
            </p>
          </div>

          <div>
            <span className="text-lg sm:text-xl font-extrabold text-[#F77737] tracking-tight tabular-nums">
              12
            </span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Convertidos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
