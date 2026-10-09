import { ArrowRight, ArrowUpRight, Crown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstagramHeroArtwork } from "./InstagramHeroArtwork";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface TodayHeroProps {
  dueCount: number;
  onNavigate: (view: InstagramView) => void;
}

export function TodayHero({ dueCount, onNavigate }: TodayHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Brilho decorativo sutil de fundo */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-gradient-to-br from-pink-50/60 via-purple-50/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-gradient-to-tr from-amber-50/50 via-rose-50/30 to-transparent blur-3xl" />

      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_280px]">
        {/* Coluna 1: Copy principal e CTAs */}
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F77737]">
            TRANSFORME CONEXÕES EM CLIENTES
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-[32px] leading-tight sm:leading-tight">
            Hoje você trabalha oportunidades,{" "}
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent font-extrabold">
              não listas soltas.
            </span>
          </h2>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-[#667085]">
            Cada ação pública é registrada, seus contatos evoluem no CRM e as mensagens
            automáticas entram em cena depois que o contato inicia uma interação com o perfil.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1d4ed8]"
              onClick={() => onNavigate("hunter")}
            >
              <Search className="size-4" />
              <span>Encontrar oportunidades</span>
            </Button>

            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              onClick={() => onNavigate("crm")}
            >
              <span>Abrir CRM</span>
              <ArrowUpRight className="size-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Coluna 2: Ilustração artística central do Instagram */}
        <div className="hidden md:flex items-center justify-center py-2">
          <InstagramHeroArtwork />
        </div>

        {/* Coluna 3: Card Prioridade */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-[#F8FAFC] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] h-full">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-amber-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                  PRIORIDADE
                </span>
              </div>
              <span className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-400">
                <SlidersHorizontal className="size-3.5" />
              </span>
            </div>

            <div className="mt-4">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {dueCount}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                ações vencidas ou previstas para hoje
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-5 w-full justify-center gap-2 rounded-xl border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => onNavigate("cadences")}
          >
            <span>Gerenciar cadências</span>
            <ArrowRight className="size-3.5 text-slate-500" />
          </Button>
        </div>
      </div>
    </section>
  );
}
