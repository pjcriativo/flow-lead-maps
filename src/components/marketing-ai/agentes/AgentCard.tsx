import {
  Check,
  Megaphone,
  MoreHorizontal,
  PenSquare,
  ScanSearch,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AgentItem } from "./agentes-data";

interface AgentCardProps {
  agent: AgentItem;
  onConfigure: (agent: AgentItem) => void;
}

const ICON_MAP: Record<AgentItem["iconName"], LucideIcon> = {
  Megaphone: Megaphone,
  PenSquare: PenSquare,
  Users: Users,
  ScanSearch: ScanSearch,
};

const THEME_MAP: Record<
  AgentItem["colorTheme"],
  {
    iconBg: string;
    iconBorder: string;
    iconColor: string;
  }
> = {
  orange: {
    iconBg: "bg-orange-500/15",
    iconBorder: "border-orange-500/30",
    iconColor: "text-orange-400",
  },
  purple: {
    iconBg: "bg-purple-500/15",
    iconBorder: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  blue: {
    iconBg: "bg-blue-500/15",
    iconBorder: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  teal: {
    iconBg: "bg-emerald-500/15",
    iconBorder: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
};

export function AgentCard({ agent, onConfigure }: AgentCardProps) {
  const Icon = ICON_MAP[agent.iconName] || Megaphone;
  const theme = THEME_MAP[agent.colorTheme];
  const isSelected = agent.id === "agente-marketing";
  const isBeta = agent.status === "beta";

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-[#121620]/90 p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/50",
        isSelected
          ? "border-orange-500/50 shadow-[0_0_20px_rgba(255,98,0,0.15)]"
          : "border-home-border/80 hover:border-home-border",
      )}
    >
      <div>
        {/* Topo: Ícone + Status + Menu de 3 Pontos */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border",
              theme.iconBg,
              theme.iconBorder,
              theme.iconColor,
            )}
          >
            <Icon className="size-5" />
          </div>

          <div className="flex items-center gap-2">
            {isBeta ? (
              <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                Beta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Ativo
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Opções do agente"
                  className="flex size-7 items-center justify-center rounded-lg border border-home-border/60 bg-home-surface text-home-muted hover:text-white transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 rounded-xl border-home-border bg-[#121620] p-1 text-xs text-home-foreground"
              >
                <DropdownMenuItem
                  onClick={() => onConfigure(agent)}
                  className="cursor-pointer focus:bg-home-surface-strong focus:text-white"
                >
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onConfigure(agent)}
                  className="cursor-pointer focus:bg-home-surface-strong focus:text-white"
                >
                  Histórico de execuções
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Nome e Microdescrição */}
        <div className="mt-3.5">
          <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
            {agent.name}
          </h3>
          <p className="mt-1 text-xs text-home-muted leading-relaxed line-clamp-2">
            {agent.description}
          </p>
        </div>

        {/* Checklist com Ícone de Checkmark */}
        <div className="mt-4 space-y-2 border-t border-home-border/50 pt-3.5">
          {agent.checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-home-muted">
              <div className="flex size-4 shrink-0 items-center justify-center rounded-full border border-home-border/80 bg-home-surface text-emerald-400">
                <Check className="size-2.5 stroke-[2.5]" />
              </div>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Botão de Ação */}
      <div className="mt-5 pt-1">
        {isBeta ? (
          <button
            type="button"
            onClick={() => onConfigure(agent)}
            className="w-full h-8.5 rounded-xl border border-home-border/80 bg-home-surface hover:bg-home-surface-strong text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center"
          >
            {agent.actionLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onConfigure(agent)}
            className="w-full h-8.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all duration-200 cursor-pointer flex items-center justify-center"
          >
            {agent.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
