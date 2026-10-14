import React from "react";
import {
  Settings,
  Users,
  Mail,
  PenTool,
  RotateCcw,
  Check,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudioCampaignDraft } from "@/types/campaign-studio";
import { OFFICIAL_CORPORATE_SIGNATURES } from "../templates/templates-data";
import type { SimpleListaItem } from "@/services/campaign-studio-service";

interface ConfiguracaoCampanhaPanelProps {
  draft: StudioCampaignDraft;
  listasDisponiveis: SimpleListaItem[];
  onChangeDraft: (updater: (prev: StudioCampaignDraft) => StudioCampaignDraft) => void;
  onOpenAlterarLista: () => void;
  onInsertVariable: (varName: string) => void;
}

export function ConfiguracaoCampanhaPanel({
  draft,
  listasDisponiveis,
  onChangeDraft,
  onOpenAlterarLista,
  onInsertVariable,
}: ConfiguracaoCampanhaPanelProps) {
  const handleToggleFiltro = (filtro: keyof StudioCampaignDraft["filtrosEnvio"]) => {
    onChangeDraft((prev) => {
      const novoFiltros = {
        ...prev.filtrosEnvio,
        [filtro]: !prev.filtrosEnvio[filtro],
      };

      // Recalcula contagem selecionada baseada nos filtros
      let baseCount = prev.totalLeads;
      if (novoFiltros.qualificados && novoFiltros.comEmail) {
        baseCount = prev.leadsQualificados;
      } else if (novoFiltros.comEmail) {
        baseCount = prev.leadsComEmail;
      } else {
        baseCount = prev.totalLeads;
      }

      return {
        ...prev,
        filtrosEnvio: novoFiltros,
        quantidadeSelecionada: baseCount,
      };
    });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 text-white shadow-sm space-y-4">
      {/* Título da Coluna */}
      <div className="flex items-center gap-2 border-b border-zinc-800/70 pb-3">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff6200]/10 text-[#ff6200]">
          <Settings className="size-4" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-wide">
          Configuração da campanha
        </h3>
      </div>

      {/* 1. Nome da campanha */}
      <div>
        <label className="block text-[11.5px] font-semibold text-zinc-300 mb-1.5">
          Nome da campanha
        </label>
        <input
          type="text"
          value={draft.nome}
          onChange={(e) =>
            onChangeDraft((prev) => ({ ...prev, nome: e.target.value }))
          }
          placeholder="Ex: Reativação Outubro — Dentistas Curitiba"
          className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none transition-colors"
        />
      </div>

      {/* 2. Destinatários */}
      <div className="space-y-3 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Users className="size-3.5 text-[#ff6200]" />
          <span>Destinatários</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Lista de leads
          </label>
          <div className="relative">
            <select
              value={draft.listaId || ""}
              onChange={(e) => {
                const sel = listasDisponiveis.find((l) => l.id === e.target.value);
                if (sel) {
                  onChangeDraft((prev) => ({
                    ...prev,
                    listaId: sel.id,
                    listaNome: sel.nome,
                    totalLeads: sel.totalLeads,
                    leadsComEmail: sel.leadsComEmail,
                    leadsQualificados: sel.leadsQualificados,
                    quantidadeSelecionada: sel.leadsQualificados,
                  }));
                }
              }}
              className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs font-medium text-zinc-200 focus:border-[#ff6200] focus:outline-none cursor-pointer appearance-none"
            >
              {listasDisponiveis.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#10131b] text-white">
                  {l.nome} ({l.totalLeads} leads)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-zinc-400">
            Quantidade selecionada
          </span>
          <div className="mt-0.5 text-sm font-extrabold text-white">
            {draft.quantidadeSelecionada} leads
          </div>
        </div>

        <div>
          <span className="block text-[11px] font-medium text-zinc-400 mb-1.5">
            Filtro de envio
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleFiltro("comEmail")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10.5px] font-semibold border transition-all flex items-center gap-1",
                draft.filtrosEnvio.comEmail
                  ? "bg-blue-950/60 text-blue-300 border-blue-700/60"
                  : "bg-[#0d1017] text-zinc-500 border-zinc-800 hover:text-zinc-300",
              )}
            >
              {draft.filtrosEnvio.comEmail && <Check className="size-3 stroke-[3]" />}
              <span>Com e-mail</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleFiltro("qualificados")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10.5px] font-semibold border transition-all flex items-center gap-1",
                draft.filtrosEnvio.qualificados
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                  : "bg-[#0d1017] text-zinc-500 border-zinc-800 hover:text-zinc-300",
              )}
            >
              {draft.filtrosEnvio.qualificados && <Check className="size-3 stroke-[3]" />}
              <span>Qualificados</span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleFiltro("novosLeads")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[10.5px] font-semibold border transition-all flex items-center gap-1",
                draft.filtrosEnvio.novosLeads
                  ? "bg-purple-950/60 text-purple-300 border-purple-700/60"
                  : "bg-[#0d1017] text-zinc-500 border-zinc-800 hover:text-zinc-300",
              )}
            >
              {draft.filtrosEnvio.novosLeads && <Check className="size-3 stroke-[3]" />}
              <span>Novos leads</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAlterarLista}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#ff6200]/60 bg-transparent py-2 px-3 text-xs font-bold text-[#ff6200] hover:bg-[#ff6200]/10 transition-colors"
        >
          <RotateCcw className="size-3.5" />
          <span>Alterar lista</span>
        </button>
      </div>

      {/* 3. Remetente */}
      <div className="space-y-3 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Mail className="size-3.5 text-[#ff6200]" />
          <span>Remetente</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Nome do remetente
          </label>
          <input
            type="text"
            value={draft.remetenteNome}
            onChange={(e) =>
              onChangeDraft((prev) => ({ ...prev, remetenteNome: e.target.value }))
            }
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            E-mail do remetente
          </label>
          <div className="relative">
            <select
              value={draft.remetenteEmail}
              onChange={(e) =>
                onChangeDraft((prev) => ({ ...prev, remetenteEmail: e.target.value }))
              }
              className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs font-medium text-zinc-200 focus:border-[#ff6200] focus:outline-none cursor-pointer appearance-none"
            >
              <option value="contato@flowbusiness.com.br" className="bg-[#10131b]">
                contato@flowbusiness.com.br
              </option>
              <option value="comercial@flowbusiness.com.br" className="bg-[#10131b]">
                comercial@flowbusiness.com.br
              </option>
              <option value="atendimento@flowbusiness.com.br" className="bg-[#10131b]">
                atendimento@flowbusiness.com.br
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Responder para
          </label>
          <div className="relative">
            <select
              value={draft.responderPara}
              onChange={(e) =>
                onChangeDraft((prev) => ({ ...prev, responderPara: e.target.value }))
              }
              className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs font-medium text-zinc-200 focus:border-[#ff6200] focus:outline-none cursor-pointer appearance-none"
            >
              <option value="comercial@flowbusiness.com.br" className="bg-[#10131b]">
                comercial@flowbusiness.com.br
              </option>
              <option value="contato@flowbusiness.com.br" className="bg-[#10131b]">
                contato@flowbusiness.com.br
              </option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* 4. Assinatura */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <PenTool className="size-3.5 text-[#ff6200]" />
          <span>Assinatura</span>
        </div>

        <div className="relative">
          <select
            value={draft.assinaturaId}
            onChange={(e) => {
              const sig = OFFICIAL_CORPORATE_SIGNATURES.find((s) => s.id === e.target.value);
              onChangeDraft((prev) => ({
                ...prev,
                assinaturaId: e.target.value,
                assinaturaNome: sig ? sig.nome : prev.assinaturaNome,
              }));
            }}
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs font-medium text-zinc-200 focus:border-[#ff6200] focus:outline-none cursor-pointer appearance-none"
          >
            {OFFICIAL_CORPORATE_SIGNATURES.map((sig) => (
              <option key={sig.id} value={sig.id} className="bg-[#10131b]">
                {sig.nome}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* 5. Variáveis disponíveis */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <span className="font-mono text-sm text-[#ff6200] font-bold">{"{ }"}</span>
          <span>Variáveis disponíveis</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {["{{nome}}", "{{empresa}}", "{{cidade}}", "{{segmento}}"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onInsertVariable(v)}
              className="rounded-lg border border-zinc-800 bg-[#0d1017] px-2.5 py-1 text-[10.5px] font-mono text-zinc-300 hover:border-[#ff6200] hover:text-white transition-colors"
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
