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
  avatarUrl: string;
  followersCount: string;
  followersGrowth: string;
  isPositiveGrowth: boolean;
  engagementRate: string;
  lastPostTime: string;
  sparklineColor: string;
  sparklinePoints: string;
  instagramUrl?: string;
}

export const DEFAULT_MONITORED_COMPETITORS: MonitoredCompetitorItem[] = [
  {
    id: "comp-1",
    name: "Baggio Pizzaria",
    username: "baggiopizzaria",
    avatarUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop",
    followersCount: "48.2K",
    followersGrowth: "+12%",
    isPositiveGrowth: true,
    engagementRate: "4.8%",
    lastPostTime: "2h atrás",
    sparklineColor: "#2563EB",
    sparklinePoints: "M2,18 C14,14 26,17 40,11 C54,6 68,10 82,3",
    instagramUrl: "https://instagram.com/baggiopizzaria",
  },
  {
    id: "comp-2",
    name: "Forneria Original",
    username: "forneriaoriginal",
    avatarUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&h=160&fit=crop",
    followersCount: "32.7K",
    followersGrowth: "+8%",
    isPositiveGrowth: true,
    engagementRate: "3.2%",
    lastPostTime: "5h atrás",
    sparklineColor: "#8B5CF6",
    sparklinePoints: "M2,18 C16,16 28,15 44,11 C60,8 72,10 82,4",
    instagramUrl: "https://instagram.com/forneriaoriginal",
  },
  {
    id: "comp-3",
    name: "Pizza na Brasa",
    username: "pizzanabrasa",
    avatarUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&h=160&fit=crop",
    followersCount: "28.1K",
    followersGrowth: "-3%",
    isPositiveGrowth: false,
    engagementRate: "2.9%",
    lastPostTime: "1d atrás",
    sparklineColor: "#EC4899",
    sparklinePoints: "M2,6 C16,8 30,5 46,12 C62,17 72,14 82,18",
    instagramUrl: "https://instagram.com/pizzanabrasa",
  },
  {
    id: "comp-4",
    name: "Bella Pizza SP",
    username: "bellapizzasp",
    avatarUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=160&h=160&fit=crop",
    followersCount: "18.9K",
    followersGrowth: "+15%",
    isPositiveGrowth: true,
    engagementRate: "4.1%",
    lastPostTime: "3h atrás",
    sparklineColor: "#F97316",
    sparklinePoints: "M2,17 C14,16 26,14 42,9 C58,11 70,7 82,3",
    instagramUrl: "https://instagram.com/bellapizzasp",
  },
  {
    id: "comp-5",
    name: "Casa da Pizza",
    username: "casadapizzasp",
    avatarUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=160&h=160&fit=crop",
    followersCount: "14.6K",
    followersGrowth: "+6%",
    isPositiveGrowth: true,
    engagementRate: "2.7%",
    lastPostTime: "12h atrás",
    sparklineColor: "#F43F5E",
    sparklinePoints: "M2,16 C16,15 30,12 48,11 C64,10 72,7 82,5",
    instagramUrl: "https://instagram.com/casadapizzasp",
  },
];

interface MonitoredCompetitorsTableProps {
  items?: MonitoredCompetitorItem[];
  onAddCompetitor?: () => void;
  onAnalyze?: (item: MonitoredCompetitorItem) => void;
  onRefresh?: (item: MonitoredCompetitorItem) => void;
  onRemove?: (id: string) => void;
}

export function MonitoredCompetitorsTable({
  items = DEFAULT_MONITORED_COMPETITORS,
  onAddCompetitor,
  onAnalyze,
  onRefresh,
  onRemove,
}: MonitoredCompetitorsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card */}
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
          <Plus className="size-3.5" />
          Adicionar concorrente
        </Button>
      </div>

      {/* Lista / Tabela de Concorrentes */}
      <div className="mt-4 divide-y divide-slate-100 overflow-x-auto">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <div
              key={item.id}
              className="group flex min-w-[560px] items-center justify-between gap-3 py-3 transition-colors hover:bg-slate-50/60 sm:min-w-0"
            >
              {/* Checkbox + Avatar + Nome */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(item.id)}
                  className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
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

              {/* Seguidores e Crescimento */}
              <div className="w-20 text-left">
                <div className="text-xs font-bold text-slate-900">{item.followersCount}</div>
                <div
                  className={cn(
                    "flex items-center gap-0.5 text-[10.5px] font-semibold",
                    item.isPositiveGrowth ? "text-[#10B981]" : "text-[#EF4444]",
                  )}
                >
                  <span>{item.isPositiveGrowth ? "↑" : "↓"}</span>
                  <span>{item.followersGrowth}</span>
                </div>
              </div>

              {/* Minigráfico Sparkline */}
              <div className="h-6 w-20 shrink-0">
                <svg className="size-full overflow-visible" viewBox="0 0 84 22" fill="none">
                  <path
                    d={item.sparklinePoints}
                    stroke={item.sparklineColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Taxa de Engajamento */}
              <div className="w-24 text-left">
                <div className="text-xs font-bold text-slate-900">{item.engagementRate}</div>
                <div className="text-[10.5px] text-slate-400">Engajamento</div>
              </div>

              {/* Última Publicação */}
              <div className="w-20 text-left">
                <div className="text-xs font-bold text-slate-900">{item.lastPostTime}</div>
                <div className="text-[10.5px] text-slate-400">Último post</div>
              </div>

              {/* Menu de Ações */}
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
                  {item.instagramUrl && (
                    <DropdownMenuItem asChild>
                      <a href={item.instagramUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 size-3.5" /> Ver no Instagram
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onRemove?.(item.id)}
                  >
                    <Trash2 className="mr-2 size-3.5" /> Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
