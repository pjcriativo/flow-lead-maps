import { AlertTriangle, Save, ShieldCheck, X } from "lucide-react";
import { renderEmailPreview } from "@/lib/campaign-email-editor";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-zinc-800 bg-[#10131b] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Revisao da campanha</h3>
              <p className="text-[11px] text-zinc-400">
                Confira o conteudo antes de salvar o rascunho.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar revisao"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <dl className="space-y-2 rounded-xl border border-zinc-800 bg-[#0d1017] p-3 text-xs">
              {[
                ["Campanha", draft.nome || "Sem nome"],
                ["Lista", draft.listaNome],
                ["Destinatarios", `${draft.quantidadeSelecionada} selecionados`],
                ["Template", draft.templateNome],
                ["Assinatura", draft.assinaturaNome || "Sem assinatura"],
                ["Assunto", draft.assunto || "Nao preenchido"],
                ["Remetente", draft.remetenteEmail || "Pendente de verificacao"],
                ["Status", "Rascunho"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[90px_1fr] gap-2 border-b border-zinc-800/60 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="break-words font-semibold text-zinc-200">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-2 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300">
                <AlertTriangle className="size-3.5" /> Pendencias para envio futuro
              </div>
              {[...validation.bloqueios, ...validation.avisos].map((message) => (
                <p key={message} className="text-[10px] leading-relaxed text-amber-200/80">
                  • {message}
                </p>
              ))}
              <p className="text-[10px] leading-relaxed text-zinc-400">
                Estas pendencias nao impedem salvar o rascunho. Envio e agendamento permanecem
                desativados.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-100 p-1">
            <iframe
              title="Previa final da campanha"
              sandbox=""
              srcDoc={renderEmailPreview(draft.templateHtmlSnapshot)}
              className="h-[560px] w-full bg-white"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
          >
            Voltar e editar
          </button>
          <button
            type="button"
            onClick={onSaveDraftAndExit}
            className="flex items-center gap-1.5 rounded-xl bg-[#ff6200] px-4 py-2 text-xs font-bold text-white hover:bg-[#e65800]"
          >
            <Save className="size-3.5" /> Salvar rascunho
          </button>
        </div>
      </div>
    </div>
  );
}
