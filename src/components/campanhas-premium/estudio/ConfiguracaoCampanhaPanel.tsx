import { useState } from "react";
import { ChevronDown, LayoutTemplate, Mail, PenTool, Settings, Users } from "lucide-react";
import { applySignatureToEmail } from "@/lib/campaign-email-editor";
import type { StudioCampaignDraft } from "@/types/campaign-studio";
import type { CorporateSignatureItem } from "@/types/templates";
import { renderSignatureHtml } from "../templates/templates-data";

interface ConfiguracaoCampanhaPanelProps {
  draft: StudioCampaignDraft;
  signatures: CorporateSignatureItem[];
  onChangeDraft: (updater: (prev: StudioCampaignDraft) => StudioCampaignDraft) => void;
  onOpenAlterarLista: () => void;
  onOpenDestinatarios: () => void;
  onOpenTemplate: () => void;
}

export function ConfiguracaoCampanhaPanel({
  draft,
  signatures,
  onChangeDraft,
  onOpenAlterarLista,
  onOpenDestinatarios,
  onOpenTemplate,
}: ConfiguracaoCampanhaPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const changeSignature = (signatureId: string) => {
    const signature = signatures.find((item) => item.id === signatureId);
    const signatureHtml = signature
      ? renderSignatureHtml(signature.htmlTemplate, signature.dadosExemplo)
      : "";
    onChangeDraft((current) => ({
      ...current,
      assinaturaId: signature?.id ?? "",
      assinaturaNome: signature?.nome ?? "",
      assinaturaHtmlSnapshot: signatureHtml,
      templateHtmlSnapshot: applySignatureToEmail(current.templateHtmlSnapshot, signatureHtml),
    }));
  };

  return (
    <aside className="flex flex-col space-y-4 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-800/70 pb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
          <Settings className="size-4" />
        </div>
        <h3 className="text-sm font-bold tracking-wide">Configuracao da campanha</h3>
      </div>

      <label className="text-[11px] font-semibold text-zinc-300">
        Campanha
        <input
          value={draft.nome}
          onChange={(event) =>
            onChangeDraft((current) => ({ ...current, nome: event.target.value }))
          }
          className="mt-1.5 h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
        />
      </label>

      <div className="space-y-2 border-t border-zinc-800/60 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Users className="size-3.5 text-[#ff6200]" /> Lista
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-3">
          <div className="truncate text-xs font-bold">{draft.listaNome}</div>
          <div className="mt-1 text-[10px] text-zinc-500">
            {draft.quantidadeSelecionada} selecionados de {draft.totalLeads} contatos
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onOpenDestinatarios}
              className="text-[10px] font-semibold text-[#ff6200] hover:text-[#ff7d2b]"
            >
              Selecionar contatos
            </button>
            <button
              type="button"
              onClick={onOpenAlterarLista}
              className="text-[10px] font-semibold text-zinc-400 hover:text-white"
            >
              Trocar lista
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-800/60 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <LayoutTemplate className="size-3.5 text-[#ff6200]" /> Template
        </div>
        <button
          type="button"
          onClick={onOpenTemplate}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-[#0d1017] p-3 text-left hover:border-[#ff6200]"
        >
          <span className="truncate text-xs font-semibold">{draft.templateNome}</span>
          <span className="text-[10px] text-[#ff6200]">Alterar</span>
        </button>
      </div>

      <label className="border-t border-zinc-800/60 pt-3 text-[11px] font-semibold text-zinc-300">
        Assunto
        <input
          value={draft.assunto}
          onChange={(event) =>
            onChangeDraft((current) => ({ ...current, assunto: event.target.value }))
          }
          className="mt-1.5 h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
        />
      </label>

      <div className="space-y-2 border-t border-zinc-800/60 pt-3">
        <label className="flex items-center gap-1.5 text-xs font-bold" htmlFor="campaign-signature">
          <PenTool className="size-3.5 text-[#ff6200]" /> Assinatura
        </label>
        <div className="relative">
          <select
            id="campaign-signature"
            value={draft.assinaturaId}
            onChange={(event) => changeSignature(event.target.value)}
            className="h-9 w-full appearance-none rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs text-zinc-200 outline-none focus:border-[#ff6200]"
          >
            <option value="">Sem assinatura</option>
            {signatures.map((signature) => (
              <option key={signature.id} value={signature.id}>
                {signature.nome}
                {signature.isPadrao ? " (padrao)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      <div className="border-t border-zinc-800/60 pt-3">
        <button
          type="button"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between text-xs font-bold text-zinc-300"
        >
          Configuracoes avancadas
          <ChevronDown
            className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>
        {advancedOpen ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-[#0d1017] p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <Mail className="size-3 text-[#ff6200]" /> Remetente
              </div>
              {draft.remetenteEmail ? (
                <p className="mt-1 text-[10px] text-zinc-400">
                  {draft.remetenteNome} &lt;{draft.remetenteEmail}&gt;
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-amber-400">
                  Nenhuma identidade de envio verificada. O rascunho pode ser salvo, mas nao
                  enviado.
                </p>
              )}
            </div>
            <label className="block text-[10px] text-zinc-400">
              Reply-to
              <input
                value={draft.responderPara}
                onChange={(event) =>
                  onChangeDraft((current) => ({ ...current, responderPara: event.target.value }))
                }
                className="mt-1 h-9 w-full rounded-lg border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white outline-none focus:border-[#ff6200]"
              />
            </label>
            <label className="block text-[10px] text-zinc-400">
              Pre-cabecalho
              <textarea
                rows={3}
                value={draft.preCabecalho}
                onChange={(event) =>
                  onChangeDraft((current) => ({ ...current, preCabecalho: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#0d1017] p-3 text-xs text-white outline-none focus:border-[#ff6200]"
              />
            </label>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
