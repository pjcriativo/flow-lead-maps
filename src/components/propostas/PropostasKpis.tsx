// Seis Indicadores Comerciais Superiores de Propostas
import React from "react";
import {
  FileText,
  File,
  CheckCircle2,
  Send,
  Target,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IndicadorPropostas } from "./propostas-data";

interface PropostasKpisProps {
  indicadores: IndicadorPropostas[];
}

export function PropostasKpis({ indicadores }: PropostasKpisProps) {
  const renderIcone = (nome: IndicadorPropostas["iconeNome"]) => {
    switch (nome) {
      case "FileText":
        return <FileText className="size-5" />;
      case "File":
        return <File className="size-5" />;
      case "CheckCircle2":
        return <CheckCircle2 className="size-5" />;
      case "Send":
        return <Send className="size-5" />;
      case "Target":
        return <Target className="size-5" />;
      case "DollarSign":
        return <DollarSign className="size-5" />;
      default:
        return <FileText className="size-5" />;
    }
  };

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {indicadores.map((ind) => (
        <div
          key={ind.id}
          className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 p-3.5 flex flex-col justify-between hover:border-white/20 transition-all shadow-md group"
        >
          {/* Topo do card: Ícone */}
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                ind.bgIcone,
                ind.bordaIcone,
                ind.corIcone
              )}
            >
              {renderIcone(ind.iconeNome)}
            </div>
          </div>

          {/* Valor Principal e Rótulo */}
          <div className="mt-3">
            <span className="text-[11px] font-medium text-neutral-400 block truncate">
              {ind.nome}
            </span>
            <span className="text-xl font-bold tracking-tight text-white font-mono block mt-0.5">
              {ind.valor}
            </span>
          </div>

          {/* Subtexto / Variação */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1 text-[10px]">
            {ind.variacao ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp className="size-3" />
                {ind.variacao}
              </span>
            ) : null}
            {ind.subtexto && (
              <span className="text-neutral-400 font-medium truncate">
                {ind.subtexto}
              </span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
