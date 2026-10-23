// Modal de Rejeição de Solicitação de Agentes
// Permite informar o motivo e as orientações para o agente reformular a solicitação.
import React, { useState } from "react";
import { AlertCircle, X, XCircle } from "lucide-react";
import type { SolicitacaoAprovacaoItem } from "./aprovacoes-data";

interface RejeitarSolicitacaoModalProps {
  solicitacao: SolicitacaoAprovacaoItem | null;
  onFechar: () => void;
  onConfirmar: (id: string, motivo: string) => void;
}

export function RejeitarSolicitacaoModal({
  solicitacao,
  onFechar,
  onConfirmar,
}: RejeitarSolicitacaoModalProps) {
  const [motivo, setMotivo] = useState("Orçamento fora do escopo aprovado no momento.");
  const [observacao, setObservacao] = useState(
    "Favor reformular com foco prioritário nos nichos com maior taxa de conversão.",
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
          <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              Rejeitar Solicitação {solicitacao.numero}
            </span>
            <h3 className="text-base font-bold text-white">
              {solicitacao.titulo}
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-xs mb-4">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Motivo Principal da Rejeição
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            >
              <option value="Orçamento fora do escopo aprovado no momento.">
                Orçamento fora do escopo aprovado no momento
              </option>
              <option value="Necessário priorizar outros canais de aquisição.">
                Necessário priorizar outros canais de aquisição
              </option>
              <option value="Dados insuficientes para autorizar ação em massa.">
                Dados insuficientes para autorizar ação em massa
              </option>
              <option value="Conflito de agenda ou recursos com outros agentes.">
                Conflito de agenda ou recursos com outros agentes
              </option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Observações e Diretrizes para o Agente
            </label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] p-3 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-[11px] text-rose-300 leading-relaxed mb-4">
          ℹ️ <strong>Demonstração Frontend</strong>: Decisão registrada apenas nesta demonstração. Nenhuma alteração real foi feita no motor de automação.
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
            onClick={() => onConfirmar(solicitacao.id, `${motivo} - ${observacao}`)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98]"
          >
            <X className="size-4" />
            <span>Confirmar Rejeição</span>
          </button>
        </div>
      </div>
    </div>
  );
}
