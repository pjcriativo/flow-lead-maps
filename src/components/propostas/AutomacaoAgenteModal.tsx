// Modal de Apresentação: Configuração do Agente Vendedor
import React, { useState } from "react";
import {
  X,
  Bot,
  ShieldCheck,
  Crown,
  DollarSign,
  Send,
  Sliders,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomacaoAgenteModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function AutomacaoAgenteModal({ aberto, onFechar }: AutomacaoAgenteModalProps) {
  const [aprovacaoObrigatoria, setAprovacaoObrigatoria] = useState(true);
  const [limiteDesconto, setLimiteDesconto] = useState(15);
  const [valorMinimo, setValorMinimo] = useState(1500);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-blue-500/30 bg-[#0c1017] p-6 shadow-2xl space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 text-[#60a5fa] border border-blue-500/30 shadow-md">
              <Bot className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Automação do Agente Vendedor</h2>
              <p className="text-xs text-neutral-400">
                Regras de geração automática de propostas comerciais sob supervisão do CEO de IA
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Card do Agente Responsável */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#121620] border border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-full overflow-hidden border border-white/15">
              <img
                src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80"
                alt="Agente Vendedor"
                className="size-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Agente Vendedor</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                  Copiloto Ativo
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                Especialista em fechamento comercial e elaboração de orçamentos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400">
            <Crown className="size-3.5" />
            <span>Supervisionado pelo CEO de IA</span>
          </div>
        </div>

        {/* Regras e Parâmetros Comerciais */}
        <div className="space-y-3.5">
          <span className="text-xs font-semibold text-neutral-300 block">
            Diretrizes e Limites de Autonomia
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Limite de Desconto */}
            <div className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2">
              <span className="text-neutral-300 font-medium block">Desconto Máximo Permitido</span>
              <div className="flex items-center justify-between">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={limiteDesconto}
                  onChange={(e) => setLimiteDesconto(Number(e.target.value))}
                  className="w-2/3 accent-blue-500"
                />
                <span className="font-mono font-bold text-white">{limiteDesconto}%</span>
              </div>
              <span className="text-[10px] text-neutral-500 block">
                Acima de {limiteDesconto}%, o envio é bloqueado sem aprovação.
              </span>
            </div>

            {/* Piso de Valor */}
            <div className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2">
              <span className="text-neutral-300 font-medium block">Piso de Faturamento</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-400">R$</span>
                <input
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white"
                />
              </div>
              <span className="text-[10px] text-neutral-500 block">
                Valor mínimo aceito para propostas geradas.
              </span>
            </div>
          </div>

          {/* Portão de Aprovação Obrigatória */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-start gap-2.5">
              <Lock className="size-4 text-blue-400 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-white block">
                  Portão de Aprovação Obrigatória
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Nenhuma proposta automática é enviada ao cliente sem a sua autorização expressa.
                </span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
              Ativo
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-[#3b82f6] text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:brightness-110 transition-all"
          >
            Salvar Parâmetros do Agente
          </button>
        </div>
      </div>
    </div>
  );
}
