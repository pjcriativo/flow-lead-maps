import React from "react";
import {
  Bot,
  Clapperboard,
  Lightbulb,
  UserCheck,
  Smartphone,
  RefreshCw,
  Globe,
  Sparkles,
  UserPlus,
  Video,
  LayoutTemplate,
  FileText,
  Crown,
  Play,
} from "lucide-react";
import {
  ASSISTANT_AVATAR_ACTIONS,
  VIDEO_TEMPLATES,
  type AssistantActionItem,
  type VideoTemplateItem,
} from "./influencers-data";

interface InfluencersAssistantPanelProps {
  onActionClick: (action: AssistantActionItem) => void;
  onCriarAvatar: () => void;
  onGerarUgc: () => void;
  onUsarTemplate: (template?: VideoTemplateItem) => void;
  onImportarRoteiro: () => void;
  onVerPlanos: () => void;
  onVerTodosTemplates?: () => void;
}

export const InfluencersAssistantPanel: React.FC<InfluencersAssistantPanelProps> = ({
  onActionClick,
  onCriarAvatar,
  onGerarUgc,
  onUsarTemplate,
  onImportarRoteiro,
  onVerPlanos,
  onVerTodosTemplates,
}) => {
  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case "Clapperboard":
        return <Clapperboard className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "Lightbulb":
        return <Lightbulb className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "UserCheck":
        return <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "Smartphone":
        return <Smartphone className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "RefreshCw":
        return <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "Globe":
        return <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      case "Sparkles":
        return <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Main AI Assistant Box */}
      <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        {/* Title & Beta badge */}
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Assistente de Avatares com IA
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25">
            Beta
          </span>
        </div>

        {/* AI Greeting Card */}
        <div className="flex items-start gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Olá, Carlos!</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
              Vou te ajudar a criar vídeos incríveis com avatares de IA para sua marca.
            </p>
          </div>
        </div>

        {/* 7 Quick Action List */}
        <div className="space-y-1.5">
          {ASSISTANT_AVATAR_ACTIONS.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={() => onActionClick(act)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 rounded-lg transition-all group text-left cursor-pointer"
            >
              <span className="p-1 rounded-md bg-slate-800/80 group-hover:bg-orange-500/10 transition-colors">
                {getActionIcon(act.iconName)}
              </span>
              <span className="font-medium group-hover:translate-x-0.5 transition-transform">
                {act.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Ações Rápidas (2x2 Grid) */}
      <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase text-slate-400 mb-3">
          Ações rápidas
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* Criar novo avatar (Primary Orange) */}
          <button
            type="button"
            onClick={onCriarAvatar}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-md transition-all active:scale-95 text-left cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Criar novo avatar</span>
          </button>

          {/* Gerar vídeo UGC */}
          <button
            type="button"
            onClick={onGerarUgc}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition-all text-left cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Gerar vídeo UGC</span>
          </button>

          {/* Usar template */}
          <button
            type="button"
            onClick={() => onUsarTemplate()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition-all text-left cursor-pointer"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Usar template</span>
          </button>

          {/* Importar roteiro */}
          <button
            type="button"
            onClick={onImportarRoteiro}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition-all text-left cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Importar roteiro</span>
          </button>
        </div>
      </div>

      {/* 3. Templates de Vídeos (4 items) */}
      <div className="bg-[#111726]/80 border border-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white tracking-wide">
            Templates de vídeos
          </h3>
          <button
            type="button"
            onClick={onVerTodosTemplates}
            className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {VIDEO_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => onUsarTemplate(tmpl)}
              className="group cursor-pointer rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all p-1"
            >
              <div className="aspect-[4/5] rounded overflow-hidden relative mb-1">
                <img
                  src={tmpl.thumbnailUrl}
                  alt={tmpl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <p className="text-[10px] font-medium text-slate-300 group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight text-center">
                {tmpl.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Planos e Créditos Promo Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1C1318] via-[#14121F] to-[#0E1626] border border-slate-800/90 rounded-xl p-4 shadow-xl">
        {/* Glow backdrop */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Crown className="w-3 h-3 text-orange-400 fill-orange-400" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                Planos e Créditos
              </h4>
            </div>

            <p className="text-[11px] text-slate-300 leading-tight mb-3">
              Produza mais vídeos com planos flexíveis para o seu negócio.
            </p>

            <button
              type="button"
              onClick={onVerPlanos}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Ver planos</span>
            </button>
          </div>

          {/* 3D Luminous Orange Play Button Illustration */}
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] transform rotate-6 hover:rotate-0 transition-transform cursor-pointer pl-1">
              <Play className="w-6 h-6 fill-white text-white drop-shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
