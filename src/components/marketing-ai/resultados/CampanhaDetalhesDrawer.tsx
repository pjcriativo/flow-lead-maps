import React from "react";
import { X, TrendingUp, DollarSign, Target, ShoppingBag, Eye, Calendar, Sparkles } from "lucide-react";
import type { TopCampaignItem } from "./resultados-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface CampanhaDetalhesDrawerProps {
  campaign: TopCampaignItem | null;
  onClose: () => void;
  onToggleStatus?: (id: string) => void;
}

export const CampanhaDetalhesDrawer: React.FC<CampanhaDetalhesDrawerProps> = ({
  campaign,
  onClose,
  onToggleStatus,
}) => {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F1626] border-l border-slate-800 h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <PlatformIcon
                platform={campaign.platform as any}
                size="md"
                className="shadow-md"
              />
              <div>
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                  {campaign.category}
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {campaign.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Campaign Banner Image */}
          <div className="relative rounded-xl overflow-hidden mb-6 border border-slate-800">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-36 object-cover"
            />
            <div className="absolute top-2 right-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md ${
                  campaign.status === "ativa"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    campaign.status === "ativa" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {campaign.status === "ativa" ? "Ativa" : "Pausada"}
              </span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Receita Atribuída</span>
              <span className="text-base font-extrabold text-white">{campaign.revenue}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Investimento</span>
              <span className="text-base font-extrabold text-slate-200">{campaign.investment}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">ROI Verificado</span>
              <span className="text-base font-extrabold text-emerald-400">{campaign.roi}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Leads / Vendas</span>
              <span className="text-base font-extrabold text-white">
                {campaign.leads} <span className="text-xs font-normal text-slate-400">/ {campaign.sales}</span>
              </span>
            </div>
          </div>

          {/* AI Recommendation for this Campaign */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-900 border border-orange-500/20 mb-6">
            <div className="flex items-center gap-2 mb-2 text-orange-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold">Diagnóstico do Flow Marketing AI</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta campanha apresenta taxa de conversão 22% acima da média da conta. Recomendamos
              aumentar o orçamento diário em 15% mantendo a segmentação atual.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleStatus?.(campaign.id)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors text-center"
          >
            {campaign.status === "ativa" ? "Pausar Campanha" : "Ativar Campanha"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors text-center shadow-md"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
