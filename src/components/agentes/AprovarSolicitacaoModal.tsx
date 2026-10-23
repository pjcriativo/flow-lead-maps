// Modal de Confirmação de Aprovação de Solicitação
// Exibe resumo de governança, impacto orçamentário e confirmação transparente.
import React, { useState } from "react";
import { Check, CheckCircle2, ShieldCheck, UserCheck, X } from "lucide-react";
import type { SolicitacaoAprovacaoItem } from "./aprovacoes-data";

interface AprovarSolicitacaoModalProps {
  solicitacao: SolicitacaoAprovacaoItem | null;
  onFechar: () => void;
  onConfirmar: (id: string, justificativa: string) => void;
}

export function AprovarSolicitacaoModal({
  solicitacao,
  onFechar,
  onConfirmar,
}: AprovarSolicitacaoModalProps) {
  const [justificativa, setJustificativa] = useState(
    "Aprovado conforme planejamento comercial Q4 e diretrizes de governança.",
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
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Confirmar Aprovação {solicitacao.numero}
            </span>
            <h3 className="text-base font-bold text-white">
              {solicitacao.titulo}
            </h3>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#141a27] p-3.5 space-y-2 text-xs mb-4">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span className="text-neutral-400">Agente Solicitante:</span>
            <span className="font-semibold text-white">{solicitacao.agenteNome} ({solicitacao.agenteCargo})</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span className="text-neutral-400">Tipo de Ação:</span>
            <span className="font-semibold text-purple-400">{solicitacao.tipoRotulo}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <span className="text-neutral-400">Impacto / Orçamento:</span>
            <span className="font-bold text-emerald-400">{solicitacao.valorOuImpacto}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Responsável pela Decisão:</span>
            <span className="font-semibold text-white">Marcos Gonçalves (Administrador)</span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs mb-4">
          <label className="text-[11px] font-semibold text-neutral-300">
            Justificativa da Aprovação
          </label>
          <textarea
            rows={3}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#141a27] p-3 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-300 leading-relaxed mb-4">
          ℹ️ <strong>Demonstração Frontend</strong>: Decisão registrada apenas nesta demonstração. Nenhuma operação financeira ou automação externa real foi autorizada.
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
            onClick={() => onConfirmar(solicitacao.id, justificativa)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            <Check className="size-4" />
            <span>Confirmar Aprovação</span>
          </button>
        </div>
      </div>
    </div>
  );
}
