// Modal de Solicitação de Mais Informações
// Devolve a solicitação ao agente solicitante com perguntas e documentos requeridos.
import React, { useState } from "react";
import { HelpCircle, MessageSquare, RotateCcw, X } from "lucide-react";
import type { SolicitacaoAprovacaoItem } from "./aprovacoes-data";

interface SolicitarMaisInformacoesModalProps {
  solicitacao: SolicitacaoAprovacaoItem | null;
  onFechar: () => void;
  onConfirmar: (id: string, perguntas: string) => void;
}

export function SolicitarMaisInformacoesModal({
  solicitacao,
  onFechar,
  onConfirmar,
}: SolicitarMaisInformacoesModalProps) {
  const [perguntas, setPerguntas] = useState(
    "Favor detalhar o custo por lead estimado e quais públicos de lookalike serão testados nesta campanha.",
  );

  if (!solicitacao) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <RotateCcw className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Solicitar Mais Informações {solicitacao.numero}
            </span>
            <h3 className="text-base font-bold text-white">
              {solicitacao.titulo}
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <div className="rounded-xl border border-white/5 bg-[#141a27] p-3 text-neutral-300">
            A solicitação será devolvida ao agente <strong>{solicitacao.agenteNome}</strong> com status <strong>Aguardando informações</strong>.
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Perguntas ou Documentos Requeridos
            </label>
            <textarea
              rows={4}
              value={perguntas}
              onChange={(e) => setPerguntas(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] p-3 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar(solicitacao.id, perguntas)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="size-4" />
            <span>Devolver ao Agente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
