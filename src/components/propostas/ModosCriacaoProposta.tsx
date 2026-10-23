// Três Modos de Criação de Proposta: Manual, Assistido por IA e Automático por agente
import React from "react";
import { FileText, Sparkles, Bot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModosCriacaoPropostaProps {
  onCriarManual: () => void;
  onCriarComIa: () => void;
  onConfigurarAgente: () => void;
}

export function ModosCriacaoProposta({
  onCriarManual,
  onCriarComIa,
  onConfigurarAgente,
}: ModosCriacaoPropostaProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* 1. Modo Manual (Laranja) */}
      <button
        type="button"
        onClick={onCriarManual}
        className="group relative flex items-center justify-between p-4 rounded-2xl border border-orange-500/25 bg-[#0c1017]/95 hover:border-orange-500/50 hover:bg-[#121620] transition-all text-left shadow-lg"
      >
        <div className="flex items-start gap-3.5 min-w-0 pr-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f97316] group-hover:scale-105 transition-transform shadow-md shadow-orange-500/10">
            <FileText className="size-5.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
              Manual
            </h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              Crie sua proposta do zero com total controle do conteúdo, serviços e valores.
            </p>
          </div>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 group-hover:text-white group-hover:border-orange-500/50 group-hover:bg-orange-500/20 transition-all">
          <ChevronRight className="size-4" />
        </div>
      </button>

      {/* 2. Modo Assistido por IA (Roxo com Badge Recomendado) */}
      <button
        type="button"
        onClick={onCriarComIa}
        className="group relative flex items-center justify-between p-4 rounded-2xl border border-purple-500/30 bg-[#0c1017]/95 hover:border-purple-500/60 hover:bg-[#121620] transition-all text-left shadow-lg"
      >
        <div className="flex items-start gap-3.5 min-w-0 pr-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#a855f7] group-hover:scale-105 transition-transform shadow-md shadow-purple-500/10">
            <Sparkles className="size-5.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                Assistido por IA
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-[#c084fc] border border-purple-500/30">
                RECOMENDADO
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              Gere uma proposta completa com IA, baseada nas informações do lead e no seu negócio.
            </p>
          </div>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 group-hover:text-white group-hover:border-purple-500/50 group-hover:bg-purple-500/20 transition-all">
          <ChevronRight className="size-4" />
        </div>
      </button>

      {/* 3. Modo Automático por agente (Azul) */}
      <button
        type="button"
        onClick={onConfigurarAgente}
        className="group relative flex items-center justify-between p-4 rounded-2xl border border-blue-500/25 bg-[#0c1017]/95 hover:border-blue-500/50 hover:bg-[#121620] transition-all text-left shadow-lg"
      >
        <div className="flex items-start gap-3.5 min-w-0 pr-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#3b82f6] group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
            <Bot className="size-5.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Automático por agente
            </h3>
            <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              Deixe o agente criar, personalizar e enviar propostas automaticamente para seus leads.
            </p>
          </div>
        </div>

        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 group-hover:text-white group-hover:border-blue-500/50 group-hover:bg-blue-500/20 transition-all">
          <ChevronRight className="size-4" />
        </div>
      </button>
    </section>
  );
}
