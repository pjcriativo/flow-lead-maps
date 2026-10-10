import { useState } from "react";
import { ArrowUpRight, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProspectingHeroArtwork } from "./ProspectingHeroArtwork";

interface ProspectingHeroProps {
  onSearchClick: () => void;
  onViewLeadsClick: () => void;
  totalFound?: number;
}

export function ProspectingHero({
  onSearchClick,
  onViewLeadsClick,
  totalFound = 127,
}: ProspectingHeroProps) {
  const [period, setPeriod] = useState("24h");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Brilho decorativo sutil de fundo */}
      <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-gradient-to-br from-pink-50/60 via-purple-50/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-gradient-to-tr from-amber-50/50 via-rose-50/30 to-transparent blur-3xl" />

      <div className="relative grid grid-cols-1 items-center gap-6 xl:grid-cols-[1fr_auto_320px] 2xl:grid-cols-[1.1fr_auto_340px]">
        {/* Coluna 1: Copy principal e CTAs */}
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E1306C]">
            ENCONTRE AS PESSOAS CERTAS
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl lg:text-[32px] leading-tight sm:leading-tight">
            Descubra oportunidades{" "}
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent font-extrabold">
              que realmente importam.
            </span>
          </h2>

          <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-[#667085]">
            Use nossa inteligência para encontrar perfis, conteúdos e conversas com alto potencial
            de se tornarem clientes do seu negócio.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              className="gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1d4ed8]"
              onClick={onSearchClick}
            >
              <Search className="size-4" />
              <span>Iniciar nova busca</span>
            </Button>

            <Button
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              onClick={onViewLeadsClick}
            >
              <span>Ver leads encontrados</span>
              <ArrowUpRight className="size-4 text-slate-500" />
            </Button>
          </div>
        </div>

        {/* Coluna 2: Arte central do Instagram com bolhas e chips */}
        <div className="hidden lg:flex items-center justify-center py-2 shrink-0">
          <ProspectingHeroArtwork />
        </div>

        {/* Coluna 3: Card RESULTADOS HOJE */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] h-full">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-purple-50 text-[#833AB4]">
                  <Zap className="size-3.5 fill-[#833AB4]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E1306C]">
                  RESULTADOS HOJE
                </span>
              </div>

              <Select value={period} onValueChange={setPeriod}>
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

            <div className="mt-4">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                {totalFound}
              </span>
              <p className="mt-1 text-xs text-slate-500">
                novos perfis encontrados
              </p>
            </div>

            {/* Barra de progresso segmentada (Verde 42%, Azul 38%, Cinza 20%) */}
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="w-[42%] bg-[#10B981]" title="Alta relevância: 42%" />
              <div className="w-[38%] bg-[#2563EB]" title="Média relevância: 38%" />
              <div className="w-[20%] bg-slate-300" title="Baixa relevância: 20%" />
            </div>

            {/* Lista detalhada */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#10B981]" />
                  <span className="font-semibold text-slate-700">42%</span>
                  <span className="text-slate-500">Alta relevância</span>
                </div>
                <span className="font-bold text-slate-800 tabular-nums">54</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#2563EB]" />
                  <span className="font-semibold text-slate-700">38%</span>
                  <span className="text-slate-500">Média relevância</span>
                </div>
                <span className="font-bold text-slate-800 tabular-nums">48</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-slate-300" />
                  <span className="font-semibold text-slate-700">20%</span>
                  <span className="text-slate-500">Baixa relevância</span>
                </div>
                <span className="font-bold text-slate-800 tabular-nums">25</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
