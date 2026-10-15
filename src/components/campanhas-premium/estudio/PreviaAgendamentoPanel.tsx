import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderEmailPreview } from "@/lib/campaign-email-editor";
import type { StudioCampaignDraft, StudioValidationResult } from "@/types/campaign-studio";

interface PreviaAgendamentoPanelProps {
  draft: StudioCampaignDraft;
  validation: StudioValidationResult;
  onAvancarRevisao: () => void;
}

export function PreviaAgendamentoPanel({
  draft,
  validation,
  onAvancarRevisao,
}: PreviaAgendamentoPanelProps) {
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const previewHtml = useMemo(
    () => renderEmailPreview(draft.templateHtmlSnapshot),
    [draft.templateHtmlSnapshot],
  );

  return (
    <aside className="flex w-full shrink-0 flex-col space-y-4 xl:w-80">
      <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/70 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Eye className="size-3.5 text-[#ff6200]" />
            <span>Previa em tempo real</span>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-[#0d1017] p-1">
            <button
              type="button"
              aria-label="Previa desktop"
              aria-pressed={devicePreview === "desktop"}
              onClick={() => setDevicePreview("desktop")}
              className={cn(
                "rounded-lg p-1.5 text-zinc-400",
                devicePreview === "desktop" && "bg-[#ff6200]/20 text-[#ff6200]",
              )}
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Previa mobile"
              aria-pressed={devicePreview === "mobile"}
              onClick={() => setDevicePreview("mobile")}
              className={cn(
                "rounded-lg p-1.5 text-zinc-400",
                devicePreview === "mobile" && "bg-[#ff6200]/20 text-[#ff6200]",
              )}
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-100 p-1">
          <iframe
            title={`Previa ${devicePreview} da campanha`}
            sandbox=""
            srcDoc={previewHtml}
            className={cn(
              "mx-auto h-[420px] bg-white transition-[width]",
              devicePreview === "desktop" ? "w-full" : "w-[260px] max-w-full",
            )}
          />
        </div>
        <p className="mt-2 text-[9px] text-zinc-500">
          Dados entre colchetes sao exemplos de previa, nao contatos reais.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm">
        <h3 className="text-xs font-bold">Resumo para revisao</h3>
        <dl className="space-y-2 text-[11px]">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Lista</dt>
            <dd className="truncate text-zinc-200">{draft.listaNome}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Destinatarios</dt>
            <dd className="text-zinc-200">{draft.quantidadeSelecionada}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Template</dt>
            <dd className="truncate text-zinc-200">{draft.templateNome}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Assinatura</dt>
            <dd className="truncate text-zinc-200">{draft.assinaturaNome || "Sem assinatura"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Status</dt>
            <dd className="text-zinc-200">Rascunho</dd>
          </div>
        </dl>

        <div className="space-y-1.5 border-t border-zinc-800 pt-3">
          {validation.bloqueios.length === 0 ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Conteudo pronto para revisao
            </div>
          ) : (
            validation.bloqueios.map((message) => (
              <div key={message} className="flex items-start gap-2 text-[10px] text-amber-400">
                <AlertCircle className="mt-0.5 size-3 shrink-0" /> {message}
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onAvancarRevisao}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6200] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff6200]/20 transition-colors hover:bg-[#e65800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6200]"
        >
          Revisar campanha <ArrowRight className="size-4" />
        </button>
        <p className="text-center text-[9px] text-zinc-500">
          Envio e agendamento permanecem desativados.
        </p>
      </div>
    </aside>
  );
}
