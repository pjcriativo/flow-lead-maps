import { useState } from "react";
import {
  EllipsisVertical,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Target,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface MonitoredCompetitorItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  followersCount: string;
  followersGrowth: string;
  isPositiveGrowth: boolean;
  engagementRate: string;
  lastPostTime: string;
  sparklineColor: string;
  sparklineValues: number[];
  instagramUrl?: string;
  status: string;
}

interface MonitoredCompetitorsTableProps {
  items?: MonitoredCompetitorItem[];
  onAddCompetitor?: () => void;
  onAnalyze?: (item: MonitoredCompetitorItem) => void;
  onRefresh?: (item: MonitoredCompetitorItem) => void;
  onRemove?: (id: string) => void;
}

export function MonitoredCompetitorsTable({
  items = [],
  onAddCompetitor,
  onAnalyze,
  onRefresh,
  onRemove,
}: MonitoredCompetitorsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggleSelect = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-[#E1306C]">
            <Target className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Concorrentes monitorados</h3>
            <p className="text-[11px] text-slate-400">
              Acompanhe o desempenho dos seus concorrentes
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onAddCompetitor}
          variant="outline"
          className="gap-1.5 rounded-xl border-blue-200 bg-blue-50/60 px-3 py-1.5 text-xs font-semibold text-[#2563EB] shadow-2xs hover:bg-blue-100/60"
        >
          <Plus className="size-3.5" /> Adicionar concorrente
        </Button>
      </div>

      <div className="mt-4 divide-y divide-slate-100 overflow-x-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex min-w-[560px] items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50/60 sm:min-w-0"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                className="size-4 rounded border-slate-300 data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#2563EB]"
              />
              <Avatar className="size-9 border border-slate-100 shadow-2xs">
                <AvatarImage src={item.avatarUrl} alt={item.name} className="object-cover" />
                <AvatarFallback className="text-xs font-bold text-slate-700">
                  {item.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-900">{item.name}</div>
                <div className="truncate text-[11px] text-slate-400">@{item.username}</div>
              </div>
            </div>

            <div className="w-20 text-left">
              <div className="text-xs font-bold text-slate-900">{item.followersCount}</div>
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10.5px] font-semibold",
                  item.followersGrowth === "Não disponível"
                    ? "text-slate-400"
                    : item.isPositiveGrowth
                      ? "text-[#10B981]"
                      : "text-[#EF4444]",
                )}
              >
                {item.followersGrowth !== "Não disponível" ? (
                  <span>{item.isPositiveGrowth ? "↑" : "↓"}</span>
                ) : null}
                <span>{item.followersGrowth}</span>
              </div>
            </div>

            <div className="h-6 w-20 shrink-0">
              {item.sparklineValues.length > 1 ? (
                <svg className="size-full overflow-visible" viewBox="0 0 84 22" fill="none">
                  <path
                    d={sparklinePath(item.sparklineValues)}
                    stroke={item.sparklineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="text-[10px] text-slate-400">Sem histórico</span>
              )}
            </div>

            <div className="w-24 text-left">
              <div className="text-xs font-bold text-slate-900">{item.engagementRate}</div>
              <div className="text-[10.5px] text-slate-400">Engajamento</div>
            </div>
            <div className="w-20 text-left">
              <div className="text-xs font-bold text-slate-900">
                {formatLastPost(item.lastPostTime)}
              </div>
              <div className="text-[10.5px] text-slate-400">{statusLabel(item.status)}</div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Ações do concorrente"
                >
                  <EllipsisVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuItem onClick={() => onAnalyze?.(item)}>
                  <Search className="mr-2 size-3.5" /> Analisar perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRefresh?.(item)}>
                  <RefreshCw className="mr-2 size-3.5" /> Atualizar dados
                </DropdownMenuItem>
                {item.instagramUrl ? (
                  <DropdownMenuItem asChild>
                    <a href={item.instagramUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-3.5" /> Ver no Instagram
                    </a>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onRemove?.(item.id)}
                >
                  <Trash2 className="mr-2 size-3.5" /> Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhum concorrente monitorado.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function sparklinePath(values: number[]) {
  const min = Math.min(...values);
  const range = Math.max(1, Math.max(...values) - min);
  return values
    .map((value, index) => {
      const x = 2 + (index / (values.length - 1)) * 80;
      const y = 20 - ((value - min) / range) * 18;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatLastPost(value: string) {
  if (value === "Não disponível") return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Não disponível";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function statusLabel(status: string) {
  if (status === "running") return "Analisando...";
  if (status === "active") return "Monitoramento ativo";
  if (status === "paused") return "Monitoramento pausado";
  return "Status indisponível";
}
