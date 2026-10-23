// Três Gráficos Comerciais Inferiores: Funil de Propostas, Evolução e Origem
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FUNIL_PROPOSTAS_PADRAO,
  EVOLUCAO_PROPOSTAS_PADRAO,
  ORIGENS_PROPOSTAS_PADRAO,
  type EtapaFunilPropostas,
  type EvolucaoMes,
  type OrigemProposta,
} from "./propostas-data";

interface PropostasFunilEvolucaoProps {
  funil?: EtapaFunilPropostas[];
  evolucao?: EvolucaoMes[];
  origens?: OrigemProposta[];
}

export function PropostasFunilEvolucao({
  funil = FUNIL_PROPOSTAS_PADRAO,
  evolucao = EVOLUCAO_PROPOSTAS_PADRAO,
  origens = ORIGENS_PROPOSTAS_PADRAO,
}: PropostasFunilEvolucaoProps) {
  const [periodoEvolucao, setPeriodoEvolucao] = useState("Últimos 7 meses");
  const [menuEvolucaoAberto, setMenuEvolucaoAberto] = useState(false);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Funil de Propostas (julho/2026) */}
      <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between pb-3">
          <h3 className="text-sm font-bold text-white">Funil de propostas (julho/2026)</h3>
        </div>

        <div className="my-auto space-y-3">
          {/* Blocos Horizontais Conectados do Funil */}
          <div className="grid grid-cols-5 gap-1.5 h-16 items-center">
            {funil.map((et, idx) => (
              <div
                key={et.nome}
                className={cn(
                  "h-full rounded-xl flex flex-col items-center justify-center p-1 transition-transform hover:scale-105 shadow-md",
                  et.corBg
                )}
              >
                <span className={cn("text-base font-bold font-mono", et.corTexto)}>
                  {et.quantidade}
                </span>
                <span className={cn("text-[9px] font-medium truncate max-w-[50px]", et.corTexto)}>
                  {et.nome}
                </span>
              </div>
            ))}
          </div>

          {/* Percentuais Inferiores */}
          <div className="grid grid-cols-5 text-center text-[10px] font-mono text-neutral-400 pt-1">
            {funil.map((et) => (
              <span key={et.nome}>{et.percentual}%</span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Evolução de Propostas (Barras Verticais) */}
      <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-white">Evolução de propostas</h3>

          {/* Dropdown de Período */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuEvolucaoAberto(!menuEvolucaoAberto)}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white"
            >
              <span>{periodoEvolucao}</span>
              <ChevronDown className="size-3" />
            </button>
            {menuEvolucaoAberto && (
              <div className="absolute right-0 top-6 z-30 w-36 rounded-xl border border-white/10 bg-[#0c1017] p-1 shadow-2xl">
                {["Últimos 3 meses", "Últimos 7 meses", "Este ano"].map((op) => (
                  <button
                    key={op}
                    onClick={() => {
                      setPeriodoEvolucao(op);
                      setMenuEvolucaoAberto(false);
                    }}
                    className={cn(
                      "w-full px-2.5 py-1.5 text-xs text-left rounded-lg transition-colors",
                      periodoEvolucao === op
                        ? "bg-orange-500/15 text-orange-400 font-semibold"
                        : "text-neutral-300 hover:bg-white/5"
                    )}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Barras com Escala Y 0 a 15 */}
        <div className="relative h-28 w-full pt-2 flex items-end justify-between">
          {/* Eixo Y */}
          <div className="flex flex-col justify-between h-20 text-[9px] font-mono text-neutral-500 pr-2">
            <span>15</span>
            <span>10</span>
            <span>5</span>
            <span>0</span>
          </div>

          {/* 7 Meses */}
          <div className="flex-1 flex items-end justify-around h-20 border-b border-white/10 pb-1">
            {evolucao.map((item) => {
              const alturaPct = Math.min(100, Math.max(10, (item.quantidade / 15) * 100));
              return (
                <div key={item.mes} className="flex flex-col items-center gap-1 group">
                  <div
                    className="w-4 rounded-t bg-gradient-to-t from-orange-600 to-[#f97316] group-hover:brightness-125 transition-all"
                    style={{ height: `${alturaPct}%` }}
                    title={`${item.mes}: ${item.quantidade} propostas`}
                  />
                  <span className="text-[9px] font-mono text-neutral-400 mt-1">{item.mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Propostas por Origem (Donut) */}
      <div className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between pb-2">
          <h3 className="text-sm font-bold text-white">Propostas por origem</h3>
        </div>

        <div className="flex items-center gap-3 my-auto">
          {/* Donut SVG */}
          <div className="relative size-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              {/* Site / Formulário 38% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="13"
                strokeDasharray="38 62"
                strokeDashoffset="0"
              />
              {/* WhatsApp 24% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#06b6d4"
                strokeWidth="13"
                strokeDasharray="24 76"
                strokeDashoffset="-38"
              />
              {/* Google Maps 17% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="13"
                strokeDasharray="17 83"
                strokeDashoffset="-62"
              />
              {/* Indicação 14% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#a855f7"
                strokeWidth="13"
                strokeDasharray="14 86"
                strokeDashoffset="-79"
              />
              {/* Instagram 7% */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#ec4899"
                strokeWidth="13"
                strokeDasharray="7 93"
                strokeDashoffset="-93"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold font-mono text-white">29</span>
              <span className="text-[8px] text-neutral-400">total</span>
            </div>
          </div>

          {/* Legenda com Percentuais */}
          <div className="flex-1 space-y-1 text-[10px]">
            {origens.map((ori) => (
              <div key={ori.origem} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="size-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: ori.fillHex }}
                  />
                  <span className="text-neutral-300 truncate max-w-[100px]">{ori.origem}</span>
                </div>
                <span className="text-white font-mono font-semibold">{ori.percentual}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
