import {
  Bot,
  Clock,
  Lightbulb,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  AI_SUGGESTIONS,
  ASSISTANT_ACTIONS,
  type AiAssistantAction,
  type AiSuggestionItem,
} from "./conteudos-data";
import { cn } from "@/lib/utils";

interface ConteudoAssistantPanelProps {
  userName?: string;
  onActionClick: (action: AiAssistantAction) => void;
  onNovoConteudo: () => void;
  onVerTodasSugestoes?: () => void;
}

const SUGGESTION_ICONS = {
  TrendingUp,
  Clock,
  Sparkles,
  Lightbulb,
};

const SUGGESTION_COLORS = {
  emerald: {
    bgIcon: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    badge: "text-emerald-400",
  },
  blue: {
    bgIcon: "bg-blue-500/10 border-blue-500/25 text-blue-400",
    badge: "text-blue-400",
  },
  purple: {
    bgIcon: "bg-purple-500/10 border-purple-500/25 text-purple-400",
    badge: "text-purple-400",
  },
  teal: {
    bgIcon: "bg-teal-500/10 border-teal-500/25 text-teal-400",
    badge: "text-teal-400",
  },
};

export function ConteudoAssistantPanel({
  userName = "Carlos",
  onActionClick,
  onNovoConteudo,
  onVerTodasSugestoes,
}: ConteudoAssistantPanelProps) {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-[320px] shrink-0">
      {/* Card 1: Assistente de Conteúdo com IA */}
      <div className="rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 flex flex-col gap-3.5 shadow-sm">
        {/* Header with Beta badge */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Assistente de Conteúdo com IA</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-home-orange/15 text-home-orange border border-home-orange/30">
            Beta
          </span>
        </div>

        {/* Greeting Banner */}
        <div className="flex items-start gap-3 rounded-lg bg-[#141A23]/70 border border-home-border/40 p-3">
          <div className="size-9 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            <Bot className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white">
              Olá, {userName}!
            </span>
            <p className="text-[11px] text-home-muted mt-0.5 leading-relaxed">
              Vou criar conteúdos personalizados para suas campanhas e canais de acordo com seus produtos e objetivos.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons (6 actions) */}
        <div className="flex flex-col gap-1.5">
          {ASSISTANT_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onActionClick(action)}
              className="group flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/90 bg-[#121822]/60 hover:bg-[#161F2C] border border-home-border/40 hover:border-home-orange/40 transition-all cursor-pointer"
            >
              <div className="size-4 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-home-muted group-hover:text-home-orange group-hover:border-home-orange/40 transition-colors shrink-0">
                <Plus className="size-2.5" />
              </div>
              <span className="truncate group-hover:text-white transition-colors text-[11px] font-medium">
                {action.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Card 2: Sugestões da IA */}
      <div className="rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 flex flex-col gap-3 shadow-sm">
        {/* Header with "Ver todas" */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            Sugestões da IA
          </span>
          <button
            type="button"
            onClick={onVerTodasSugestoes}
            className="text-[11px] text-home-muted hover:text-white transition-colors cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        {/* List of 4 AI Suggestions */}
        <div className="flex flex-col gap-2">
          {AI_SUGGESTIONS.map((sug: AiSuggestionItem) => {
            const Icon = SUGGESTION_ICONS[sug.iconName] || Lightbulb;
            const colors = SUGGESTION_COLORS[sug.badgeColor];

            return (
              <div
                key={sug.id}
                className="group flex items-start gap-2.5 rounded-lg bg-[#141A23]/60 border border-home-border/40 hover:border-home-border p-2.5 transition-all cursor-pointer"
              >
                <div
                  className={cn(
                    "size-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
                    colors.bgIcon,
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-tight",
                      colors.badge,
                    )}
                  >
                    {sug.badgeLabel}
                  </span>
                  <p className="text-[11px] text-home-muted mt-0.5 leading-snug group-hover:text-white/90 transition-colors">
                    {sug.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Promo Banner (Transforme ideias em conteúdos virais) */}
      <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-br from-[#121822] via-[#1E1713] to-[#2B170B] p-4 shadow-md">
        {/* Glowing backdrop circle */}
        <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-home-orange/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">
              Transforme ideias em conteúdos virais
            </span>
            <span className="text-[11px] text-home-muted mt-0.5">
              Com IA, em segundos.
            </span>
            <div className="mt-3">
              <button
                type="button"
                onClick={onNovoConteudo}
                className="px-3.5 py-1.5 rounded-lg bg-home-orange hover:bg-home-orange-hover text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.4)] transition-all cursor-pointer whitespace-nowrap"
              >
                Criar agora
              </button>
            </div>
          </div>

          {/* Glowing Lightbulb illustration on right */}
          <div className="relative shrink-0 flex items-center justify-center size-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 to-orange-500/40 blur-md animate-pulse" />
            <div className="size-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,140,0,0.6)]">
              <Lightbulb className="size-6 text-white stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
