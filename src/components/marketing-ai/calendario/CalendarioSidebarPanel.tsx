import {
  BarChart3,
  Bot,
  Clock,
  MoreHorizontal,
  PenSquare,
  Repeat,
  Rocket,
  Share2,
  Sliders,
} from "lucide-react";
import {
  ASSISTANT_PUBLICACAO_ACTIONS,
  CANAIS_STATUS,
  type AssistantPublicacaoAction,
} from "./calendario-data";
import { PlatformIcon } from "../conteudos/PlatformIcon";

interface CalendarioSidebarPanelProps {
  userName?: string;
  onActionClick: (action: AssistantPublicacaoAction) => void;
  onGerenciarCanais: () => void;
  onAtivarAutomacao: () => void;
}

const ACTION_ICONS = {
  Clock,
  Share2,
  Sliders,
  Repeat,
  PenSquare,
  BarChart3,
};

export function CalendarioSidebarPanel({
  userName = "Carlos",
  onActionClick,
  onGerenciarCanais,
  onAtivarAutomacao,
}: CalendarioSidebarPanelProps) {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-[320px] shrink-0">
      {/* Card 1: Assistente de Publicação com IA */}
      <div className="rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 flex flex-col gap-3.5 shadow-sm">
        {/* Header with Beta badge */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Assistente de Publicação com IA</span>
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
              Vou ajudar você a planejar, agendar e publicar seus conteúdos nos canais conectados.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons (6 actions) */}
        <div className="flex flex-col gap-1.5">
          {ASSISTANT_PUBLICACAO_ACTIONS.map((action) => {
            const Icon = ACTION_ICONS[action.iconName as keyof typeof ACTION_ICONS] || Clock;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onActionClick(action)}
                className="group flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/90 bg-[#121822]/60 hover:bg-[#161F2C] border border-home-border/40 hover:border-home-orange/40 transition-all cursor-pointer"
              >
                <div className="size-4 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-home-muted group-hover:text-home-orange group-hover:border-home-orange/40 transition-colors shrink-0">
                  <Icon className="size-2.5" />
                </div>
                <span className="truncate group-hover:text-white transition-colors text-[11px] font-medium">
                  {action.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card 2: Status dos Canais */}
      <div className="rounded-xl border border-home-border/60 bg-[#0E131B]/95 p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            Status dos canais
          </span>
          <button
            type="button"
            onClick={onGerenciarCanais}
            className="text-[11px] text-home-muted hover:text-white transition-colors cursor-pointer"
          >
            Gerenciar
          </button>
        </div>

        {/* List of 6 Channels */}
        <div className="flex flex-col divide-y divide-home-border/30">
          {CANAIS_STATUS.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <PlatformIcon platform={channel.id} size="sm" />
                <span className="font-medium text-white/90">{channel.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Conectado
                </span>
                <button
                  type="button"
                  onClick={onGerenciarCanais}
                  className="text-home-muted hover:text-white transition-colors p-0.5"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Promo Banner com Foguete */}
      <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-gradient-to-br from-[#121822] via-[#1E1713] to-[#2B170B] p-4 shadow-md">
        {/* Glowing backdrop circle */}
        <div className="absolute -right-8 -bottom-8 size-36 rounded-full bg-home-orange/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">
              Publique com IA, sem esforço
            </span>
            <span className="text-[11px] text-home-muted mt-1 leading-relaxed">
              Agende conteúdos em todos os canais no melhor horário e aumente seu alcance.
            </span>
            <div className="mt-3">
              <button
                type="button"
                onClick={onAtivarAutomacao}
                className="px-3.5 py-1.5 rounded-lg bg-home-orange hover:bg-home-orange-hover text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.4)] transition-all cursor-pointer whitespace-nowrap"
              >
                Ativar publicação automática
              </button>
            </div>
          </div>

          {/* Rocket illustration on right */}
          <div className="relative shrink-0 flex items-center justify-center size-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 to-orange-500/40 blur-md animate-pulse" />
            <div className="size-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,140,0,0.6)]">
              <Rocket className="size-6 text-white stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
