import React from "react";
import {
  Sparkles,
  Search,
  Lightbulb,
  Sliders,
  Scale,
  FileText,
  TrendingUp,
  Target,
  Award,
  Compass,
  ArrowUpRight,
  Bot,
} from "lucide-react";
import {
  ASSISTANT_RESULTS_ACTIONS,
  RESULTS_INSIGHTS,
  type AssistantActionItem,
  type ResultsInsightItem,
} from "./resultados-data";

interface MarketingResultsAssistantPanelProps {
  onActionClick: (action: AssistantActionItem) => void;
  onGenerateReport: () => void;
  onViewAllInsights?: () => void;
}

export const MarketingResultsAssistantPanel: React.FC<MarketingResultsAssistantPanelProps> = ({
  onActionClick,
  onGenerateReport,
  onViewAllInsights,
}) => {
  const getActionIcon = (id: string) => {
    switch (id) {
      case "act-desempenho-geral":
        return <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "act-oportunidades":
        return <Lightbulb className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "act-ajustes-campanhas":
        return <Sliders className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "act-comparar-canais":
        return <Scale className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "act-relatorio-personalizado":
        return <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "act-prever-resultados":
        return <TrendingUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
    }
  };

  const getInsightIcon = (iconName: string, color: string) => {
    const classMap = {
      emerald: "text-emerald-400",
      blue: "text-blue-400",
      purple: "text-purple-400",
      orange: "text-orange-400",
    }[color] || "text-emerald-400";

    switch (iconName) {
      case "TrendingUp":
        return <TrendingUp className={`w-3.5 h-3.5 ${classMap}`} />;
      case "Target":
        return <Target className={`w-3.5 h-3.5 ${classMap}`} />;
      case "Award":
        return <Award className={`w-3.5 h-3.5 ${classMap}`} />;
      case "Compass":
        return <Compass className={`w-3.5 h-3.5 ${classMap}`} />;
      default:
        return <Sparkles className={`w-3.5 h-3.5 ${classMap}`} />;
    }
  };

  const getInsightBadgeStyle = (color: string) => {
    switch (color) {
      case "emerald":
        return "text-emerald-400";
      case "blue":
        return "text-blue-400";
      case "purple":
        return "text-purple-400";
      case "orange":
        return "text-orange-400";
      default:
        return "text-emerald-400";
    }
  };

  const getInsightIconBg = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "blue":
        return "bg-blue-500/10 border-blue-500/20";
      case "purple":
        return "bg-purple-500/10 border-purple-500/20";
      case "orange":
        return "bg-orange-500/10 border-orange-500/20";
      default:
        return "bg-emerald-500/10 border-emerald-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main Assistant Box */}
      <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        {/* Title & Beta tag */}
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Assistente de Resultados com IA
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25">
            Beta
          </span>
        </div>

        {/* AI Greeting Card */}
        <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Olá, Carlos!</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              Vou analisar seus resultados e identificar oportunidades para aumentar seu ROI.
            </p>
          </div>
        </div>

        {/* 6 Quick Action List */}
        <div className="space-y-1.5">
          {ASSISTANT_RESULTS_ACTIONS.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onActionClick(act)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 rounded-lg transition-all group text-left"
            >
              <span className="p-1 rounded-md bg-slate-800/80 group-hover:bg-orange-500/10 transition-colors">
                {getActionIcon(act.id)}
              </span>
              <span className="font-medium group-hover:translate-x-0.5 transition-transform">
                {act.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Insights da IA */}
      <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Insights da IA
          </h3>
          <button
            type="button"
            onClick={onViewAllInsights}
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-2.5">
          {RESULTS_INSIGHTS.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
            >
              <div
                className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${getInsightIconBg(
                  item.badgeColor
                )}`}
              >
                {getInsightIcon(item.iconName, item.badgeColor)}
              </div>
              <div className="flex-1">
                <span
                  className={`text-[11px] font-bold block mb-0.5 ${getInsightBadgeStyle(
                    item.badgeColor
                  )}`}
                >
                  {item.badgeLabel}
                </span>
                <p className="text-[11px] text-slate-300 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Promo Banner: Relatórios inteligentes com IA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#121A2A] via-[#101726] to-[#1C1226] border border-slate-800 rounded-xl p-4 shadow-xl">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-xs font-bold text-white tracking-wide">
              Relatórios inteligentes com IA
            </h4>
            <p className="text-[11px] text-slate-300 leading-tight mt-1 mb-3">
              Receba análises completas e recomendações personalizadas.
            </p>
            <button
              type="button"
              onClick={onGenerateReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md transition-all active:scale-95"
            >
              <span>Gerar relatório agora</span>
            </button>
          </div>

          {/* Glowing mini 3D chart illustration */}
          <div className="w-16 h-16 shrink-0 relative flex items-end justify-center pb-1">
            <svg viewBox="0 0 80 70" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              {/* Bars */}
              <rect x="6" y="44" width="10" height="22" rx="2" fill="url(#barGrad)" opacity="0.6" />
              <rect x="22" y="34" width="10" height="32" rx="2" fill="url(#barGrad)" opacity="0.75" />
              <rect x="38" y="24" width="10" height="42" rx="2" fill="url(#barGrad)" opacity="0.9" />
              <rect x="54" y="14" width="10" height="52" rx="2" fill="url(#barGrad)" />

              {/* Glowing trendline */}
              <polyline
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                points="10,40 26,30 42,20 60,8"
              />
              <circle cx="60" cy="8" r="3" fill="#FBBF24" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
