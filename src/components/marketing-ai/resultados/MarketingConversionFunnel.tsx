import React, { useState } from "react";
import { ChevronDown, Users, Target, FileText, CheckCircle2 } from "lucide-react";
import { CONVERSION_FUNNEL_STAGES } from "./resultados-data";

interface MarketingConversionFunnelProps {
  onStageClick?: (stageId: string) => void;
}

export const MarketingConversionFunnel: React.FC<MarketingConversionFunnelProps> = ({
  onStageClick,
}) => {
  const [selectedProduct, setSelectedProduct] = useState("Todos os produtos");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const productOptions = [
    "Todos os produtos",
    "Experiência Gastronômica",
    "Plano Fitness Premium",
    "Consultoria Imobiliária",
    "Curso de Marketing Digital",
  ];

  const getStageIcon = (id: string) => {
    switch (id) {
      case "visitantes":
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      case "leads":
        return <Target className="w-3.5 h-3.5 text-purple-400" />;
      case "propostas":
        return <FileText className="w-3.5 h-3.5 text-orange-400" />;
      case "vendas":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between shadow-lg relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white tracking-wide">
          Conversões por etapa
        </h3>

        {/* Product selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProductDropdown(!showProductDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors"
          >
            <span>{selectedProduct}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProductDropdown && (
            <div className="absolute right-0 mt-1 w-52 bg-[#0F1626] border border-slate-800 rounded-xl shadow-2xl py-1 z-30">
              {productOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(opt);
                    setShowProductDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    selectedProduct === opt
                      ? "bg-orange-500/10 text-orange-400 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Funnel Body: Graphic on Left, Metrics on Right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* SVG Funnel Shape */}
        <div className="sm:col-span-5 flex items-center justify-center py-1">
          <svg
            viewBox="0 0 200 170"
            className="w-full max-w-[170px] h-auto drop-shadow-md overflow-visible"
          >
            <defs>
              <linearGradient id="funnelGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="funnelGradPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
              <linearGradient id="funnelGradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <linearGradient id="funnelGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Stage 1: Visitantes (Top trapezoid) */}
            <path
              d="M 10 5 L 190 5 L 165 40 L 35 40 Z"
              fill="url(#funnelGradBlue)"
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onStageClick?.("visitantes")}
            />

            {/* Stage 2: Leads (Second trapezoid) */}
            <path
              d="M 37 46 L 163 46 L 140 82 L 60 82 Z"
              fill="url(#funnelGradPurple)"
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onStageClick?.("leads")}
            />

            {/* Stage 3: Propostas (Third trapezoid) */}
            <path
              d="M 62 88 L 138 88 L 118 124 L 82 124 Z"
              fill="url(#funnelGradOrange)"
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onStageClick?.("propostas")}
            />

            {/* Stage 4: Vendas (Bottom trapezoid) */}
            <path
              d="M 84 130 L 116 130 L 105 162 L 95 162 Z"
              fill="url(#funnelGradGreen)"
              className="cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onStageClick?.("vendas")}
            />
          </svg>
        </div>

        {/* Breakdown List */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-2.5">
          {CONVERSION_FUNNEL_STAGES.map((stage) => (
            <div
              key={stage.id}
              onClick={() => onStageClick?.(stage.id)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/40 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${stage.color}22`,
                  }}
                >
                  {getStageIcon(stage.id)}
                </div>
                <span className="text-xs text-slate-300 font-medium group-hover:text-white transition-colors">
                  {stage.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white font-mono tracking-tight">
                  {stage.count.toLocaleString("pt-BR")}
                </span>
                <span className="text-[11px] text-slate-400 font-medium min-w-[38px] text-right">
                  {stage.percentage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
