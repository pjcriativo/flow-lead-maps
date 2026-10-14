import React, { useState } from "react";
import {
  Eye,
  Monitor,
  Smartphone,
  Rocket,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudioCampaignDraft, StudioValidationResult } from "@/types/campaign-studio";
import { toast } from "sonner";

interface PreviaAgendamentoPanelProps {
  draft: StudioCampaignDraft;
  validation: StudioValidationResult;
  onChangeDraft: (updater: (prev: StudioCampaignDraft) => StudioCampaignDraft) => void;
  onAvancarRevisao: () => void;
}

export function PreviaAgendamentoPanel({
  draft,
  validation,
  onChangeDraft,
  onAvancarRevisao,
}: PreviaAgendamentoPanelProps) {
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [testeEmail, setTesteEmail] = useState("marcos@flowbusiness.com.br");

  const handleEnviarTeste = () => {
    toast.info(
      "O envio real de teste e a integração com o Resend serão homologados no Prompt 52.",
      {
        description: `Destinatário informado: ${testeEmail}`,
      },
    );
  };

  return (
    <div className="flex flex-col space-y-4 w-full lg:w-80 shrink-0">
      {/* CARD 1: Prévia rápida */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-800/70 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Eye className="size-3.5 text-[#ff6200]" />
            <span>Prévia rápida</span>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[#0d1017] p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setDevicePreview("desktop")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold transition-all",
                devicePreview === "desktop"
                  ? "bg-[#ff6200]/20 text-[#ff6200] border border-[#ff6200]/40"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              <Monitor className="size-3" />
              <span>Desktop</span>
            </button>

            <button
              type="button"
              onClick={() => setDevicePreview("mobile")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold transition-all",
                devicePreview === "mobile"
                  ? "bg-[#ff6200]/20 text-[#ff6200] border border-[#ff6200]/40"
                  : "text-zinc-400 hover:text-white",
              )}
            >
              <Smartphone className="size-3" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Box da Miniatura do E-mail */}
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-[#0d1017]">
          <div
            className={cn(
              "mx-auto transition-all duration-300",
              devicePreview === "desktop" ? "w-full" : "w-4/5 py-1",
            )}
          >
            <img
              src={`/images/templates/${draft.templateId}.png`}
              alt="Prévia do e-mail"
              className="w-full h-auto object-cover rounded-lg"
              onError={(e) => {
                // Fallback gracioso caso a imagem não carregue
                (e.currentTarget as HTMLImageElement).src =
                  "/images/templates/apresentacao-comercial.png";
              }}
            />
          </div>
        </div>

        {/* Metadados resumidos */}
        <div className="mt-3 space-y-1.5 text-[11px] text-zinc-400 border-t border-zinc-800/60 pt-2.5">
          <div className="flex items-start gap-1.5 truncate">
            <span className="shrink-0 text-zinc-500 font-medium">Assunto:</span>
            <span className="text-zinc-300 truncate font-medium">{draft.assunto}</span>
          </div>
          <div className="flex items-start gap-1.5 truncate">
            <span className="shrink-0 text-zinc-500 font-medium">Remetente:</span>
            <span className="text-zinc-300 truncate font-medium">
              {draft.remetenteNome} &lt;{draft.remetenteEmail}&gt;
            </span>
          </div>
          <div className="flex items-start gap-1.5 truncate">
            <span className="shrink-0 text-zinc-500 font-medium">Assinatura aplicada:</span>
            <span className="text-zinc-300 truncate font-medium">{draft.assinaturaNome}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Teste & Validação */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Rocket className="size-3.5 text-[#ff6200]" />
          <span>Teste & validação</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Enviar teste para
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="email"
              value={testeEmail}
              onChange={(e) => setTesteEmail(e.target.value)}
              placeholder="seu-email@dominio.com.br"
              className="h-8 flex-1 rounded-xl border border-zinc-800 bg-[#0d1017] px-2.5 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleEnviarTeste}
              className="h-8 rounded-xl bg-[#ff6200] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#e65800] transition-colors shrink-0"
            >
              Enviar teste
            </button>
          </div>
        </div>

        {/* Checklist com 4 itens verificados */}
        <div className="space-y-1.5 pt-1 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>Assunto preenchido</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>Template aplicado</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>Assinatura definida</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span>{draft.quantidadeSelecionada} destinatários válidos</span>
          </div>
        </div>
      </div>

      {/* CARD 3: Agendamento */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Calendar className="size-3.5 text-[#ff6200]" />
          <span>Agendamento</span>
        </div>

        {/* Radio pills: Enviar agora vs Agendar */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-800 bg-[#0d1017] p-1">
          <button
            type="button"
            onClick={() =>
              onChangeDraft((prev) => ({
                ...prev,
                programacao: { ...prev.programacao, modo: "imediato" },
              }))
            }
            className={cn(
              "rounded-lg py-1 text-center text-xs font-semibold transition-all",
              draft.programacao.modo === "imediato"
                ? "bg-[#181d2a] text-white border border-zinc-700 font-bold"
                : "text-zinc-400 hover:text-white",
            )}
          >
            Enviar agora
          </button>

          <button
            type="button"
            onClick={() =>
              onChangeDraft((prev) => ({
                ...prev,
                programacao: { ...prev.programacao, modo: "agendar" },
              }))
            }
            className={cn(
              "rounded-lg py-1 text-center text-xs font-semibold transition-all",
              draft.programacao.modo === "agendar"
                ? "bg-[#ff6200]/20 text-[#ff6200] border border-[#ff6200]/50 font-bold"
                : "text-zinc-400 hover:text-white",
            )}
          >
            Agendar
          </button>
        </div>

        {/* Inputs de Data e Horário */}
        {draft.programacao.modo === "agendar" && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-medium text-zinc-400 mb-1">
                  Data de envio
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={draft.programacao.dataEnvio}
                    onChange={(e) =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        programacao: {
                          ...prev.programacao,
                          dataEnvio: e.target.value,
                        },
                      }))
                    }
                    className="h-8 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-2 text-[11px] text-white focus:border-[#ff6200] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-zinc-400 mb-1">
                  Horário
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={draft.programacao.horarioEnvio}
                    onChange={(e) =>
                      onChangeDraft((prev) => ({
                        ...prev,
                        programacao: {
                          ...prev.programacao,
                          horarioEnvio: e.target.value,
                        },
                      }))
                    }
                    className="h-8 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-2 text-[11px] text-white focus:border-[#ff6200] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-500 text-right">
              Horário de Brasília
            </div>
          </div>
        )}

        {/* Botão de Ação: Avançar para revisão */}
        <button
          type="button"
          onClick={onAvancarRevisao}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#ff6200] py-2.5 px-4 text-xs font-bold text-white shadow-md shadow-[#ff6200]/20 hover:bg-[#e65800] active:scale-[0.98] transition-all"
        >
          <span>Avançar para revisão</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
