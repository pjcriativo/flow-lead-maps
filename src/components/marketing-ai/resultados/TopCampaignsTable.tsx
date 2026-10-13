import React, { useState } from "react";
import { MoreHorizontal, ArrowUpDown, ExternalLink, Play, Pause } from "lucide-react";
import { TOP_CAMPAIGNS, type TopCampaignItem } from "./resultados-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface TopCampaignsTableProps {
  onSelectCampaign?: (campaign: TopCampaignItem) => void;
  onViewAll?: () => void;
}

export const TopCampaignsTable: React.FC<TopCampaignsTableProps> = ({
  onSelectCampaign,
  onViewAll,
}) => {
  const [campaigns, setCampaigns] = useState<TopCampaignItem[]>(TOP_CAMPAIGNS);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" }
          : c
      )
    );
    setActiveMenuId(null);
  };

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Melhores campanhas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Campanhas com melhor desempenho no período.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors px-2.5 py-1 rounded-lg hover:bg-orange-500/10"
        >
          Ver todas
        </button>
      </div>

      {/* Table responsive container */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 font-medium">
              <th className="pb-3 pr-4 font-medium">Campanha</th>
              <th className="pb-3 px-3 font-medium text-center">Canal</th>
              <th className="pb-3 px-3 font-medium text-right">Investimento</th>
              <th className="pb-3 px-3 font-medium text-right">Leads</th>
              <th className="pb-3 px-3 font-medium text-right">Vendas</th>
              <th className="pb-3 px-3 font-medium text-right">Receita</th>
              <th className="pb-3 px-3 font-medium text-right">ROI</th>
              <th className="pb-3 px-3 font-medium text-center">Status</th>
              <th className="pb-3 pl-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {campaigns.map((camp) => (
              <tr
                key={camp.id}
                onClick={() => onSelectCampaign?.(camp)}
                className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                {/* Campanha com Thumbnail */}
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={camp.imageUrl}
                      alt={camp.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700/60 shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                        {camp.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {camp.category}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Canal */}
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center">
                    <PlatformIcon
                      platform={camp.platform as any}
                      size="sm"
                      className="shadow-sm"
                    />
                  </div>
                </td>

                {/* Investimento */}
                <td className="py-3 px-3 text-right font-medium text-slate-200 whitespace-nowrap">
                  {camp.investment}
                </td>

                {/* Leads */}
                <td className="py-3 px-3 text-right font-medium text-slate-200">
                  {camp.leads}
                </td>

                {/* Vendas */}
                <td className="py-3 px-3 text-right font-medium text-slate-200">
                  {camp.sales}
                </td>

                {/* Receita */}
                <td className="py-3 px-3 text-right font-medium text-white whitespace-nowrap">
                  {camp.revenue}
                </td>

                {/* ROI (Destaque verde vibrante) */}
                <td className="py-3 px-3 text-right font-bold text-emerald-400 whitespace-nowrap">
                  {camp.roi}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  {camp.status === "ativa" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Pausada
                    </span>
                  )}
                </td>

                {/* Ações */}
                <td className="py-3 pl-3 text-right relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === camp.id ? null : camp.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Menu flutuante */}
                  {activeMenuId === camp.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-1 w-36 bg-[#0E1626] border border-slate-700/80 rounded-xl shadow-2xl py-1 z-30 text-left"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCampaign?.(camp);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={(e) => toggleStatus(camp.id, e)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        {camp.status === "ativa" ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            Ativar
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
