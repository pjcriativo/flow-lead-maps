import React from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Users,
  Mail,
  PenTool,
  LayoutTemplate,
  ShieldCheck,
  Save,
} from "lucide-react";
import type { StudioCampaignDraft, StudioValidationResult } from "@/types/campaign-studio";

interface ModalRevisaoCampanhaProps {
  isOpen: boolean;
  draft: StudioCampaignDraft;
  validation: StudioValidationResult;
  onClose: () => void;
  onSaveDraftAndExit: () => void;
}

export function ModalRevisaoCampanha({
  isOpen,
  draft,
  validation,
  onClose,
  onSaveDraftAndExit,
}: ModalRevisaoCampanhaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-[#10131b] text-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Revisão final da campanha</h3>
              <p className="text-[11px] text-zinc-400">
                Confira todos os parâmetros antes de salvar o rascunho oficial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Resumo da Campanha */}
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
              <span className="text-xs font-semibold text-zinc-400">Nome da campanha:</span>
              <span className="text-xs font-bold text-white">{draft.nome}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Users className="size-3.5 text-[#ff6200]" />
                <span className="text-zinc-400">Destinatários:</span>
                <span className="font-bold text-white">
                  {draft.quantidadeSelecionada} leads ({draft.listaNome})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <LayoutTemplate className="size-3.5 text-[#ff6200]" />
                <span className="text-zinc-400">Template:</span>
                <span className="font-bold text-white">{draft.templateNome}</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-[#ff6200]" />
                <span className="text-zinc-400">Remetente:</span>
                <span className="font-bold text-white truncate max-w-[180px]">
                  {draft.remetenteNome} &lt;{draft.remetenteEmail}&gt;
                </span>
              </div>

              <div className="flex items-center gap-2">
                <PenTool className="size-3.5 text-[#ff6200]" />
                <span className="text-zinc-400">Assinatura:</span>
                <span className="font-bold text-white">{draft.assinaturaNome}</span>
              </div>
            </div>

            <div className="border-t border-zinc-800/60 pt-2 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="text-zinc-400 shrink-0">Assunto:</span>
                <span className="font-bold text-white">{draft.assunto}</span>
              </div>
              {draft.preCabecalho && (
                <div className="flex items-start gap-1.5 mt-1 text-[11px] text-zinc-400">
                  <span className="shrink-0">Pré-cabeçalho:</span>
                  <span className="text-zinc-300">{draft.preCabecalho}</span>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800/60 pt-2 flex items-center gap-2 text-xs text-zinc-300">
              <Calendar className="size-3.5 text-[#ff6200]" />
              <span>Programação:</span>
              <span className="font-bold text-white">
                {draft.programacao.modo === "agendar"
                  ? `Agendado para ${draft.programacao.dataEnvio} às ${draft.programacao.horarioEnvio} (Brasília)`
                  : "Envio imediato após homologação"}
              </span>
            </div>
          </div>

          {/* Checklist de Validação */}
          <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-3 space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-400 mb-1">
              STATUS DA VALIDAÇÃO TÉCNICA
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>Assunto e conteúdo estruturados</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>Template com tabelas HTML e CSS inline compatível</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>Assinatura corporativa vinculada e isolada por organização</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              <span>{draft.quantidadeSelecionada} destinatários com e-mail válido</span>
            </div>
          </div>

          {/* Alerta Obrigatório de Segurança do Prompt 51 */}
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 p-3 flex items-start gap-3 text-amber-300 text-xs leading-relaxed">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <div className="font-bold text-amber-200">
                Disparos em massa bloqueados com segurança
              </div>
              <p className="mt-0.5 text-amber-300/90 text-[11px]">
                Nesta etapa (Prompt 51), a campanha será salva como rascunho certificado.
                A homologação operacional da API Resend, verificação de DNS de domínio e
                mecanismos de envio em massa serão ativados no Prompt 52.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="mt-5 border-t border-zinc-800/80 pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            Voltar e continuar editando
          </button>

          <button
            type="button"
            onClick={onSaveDraftAndExit}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6200] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#ff6200]/20 hover:bg-[#e65800]"
          >
            <Save className="size-3.5" />
            <span>Salvar campanha como rascunho</span>
          </button>
        </div>
      </div>
    </div>
  );
}
