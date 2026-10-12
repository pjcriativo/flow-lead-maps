import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileCheck,
  FileText,
  Globe,
  MoreVertical,
  Pencil,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  SiGooglemaps,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type {
  CampanhaPremiumItem,
  ChannelType,
  EtapaType,
  StatusType,
} from "./campanhas-premium-data";

interface CampanhasTableProps {
  campanhas: CampanhaPremiumItem[];
  selectedCampanhaId: string | null;
  onSelectCampanha: (campanha: CampanhaPremiumItem) => void;
  onOpenCampanha: (campanha: CampanhaPremiumItem) => void;
  onRenameCampanha: (campanha: CampanhaPremiumItem) => void;
  onDeleteCampanha: (campanha: CampanhaPremiumItem) => void;
  onToggleStatus?: (campanha: CampanhaPremiumItem) => void;
  onAddLeads?: (campanha: CampanhaPremiumItem) => void;
  onGenerateSite?: (campanha: CampanhaPremiumItem) => void;
  onSendProposal?: (campanha: CampanhaPremiumItem) => void;
}

const ETAPA_BADGES: Record<
  EtapaType,
  { label: string; icon: typeof FileText; className: string }
> = {
  proposta: {
    label: "Proposta",
    icon: FileText,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  site_gerado: {
    label: "Site gerado",
    icon: Globe,
    className: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
  preparacao: {
    label: "Preparação",
    icon: Wrench,
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  aprovacao: {
    label: "Aprovação",
    icon: CheckCircle2,
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  envio: {
    label: "Envio",
    icon: Send,
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  },
};

const STATUS_BADGES: Record<
  StatusType,
  { label: string; className: string }
> = {
  em_producao: {
    label: "Em produção",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  aguardando_aprovacao: {
    label: "Aguardando aprovação",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  em_envio: {
    label: "Em envio",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  concluida: {
    label: "Concluída",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  pausada: {
    label: "Pausada",
    className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
};

export function CampanhasTable({
  campanhas,
  selectedCampanhaId,
  onSelectCampanha,
  onOpenCampanha,
  onRenameCampanha,
  onDeleteCampanha,
  onToggleStatus,
  onAddLeads,
  onGenerateSite,
  onSendProposal,
}: CampanhasTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(campanhas[0] ? [campanhas[0].id] : []),
  );
  const [page, setPage] = useState(1);

  // Filtra as campanhas
  const filteredCampanhas = useMemo(() => {
    return campanhas.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesNiche = c.niche.toLowerCase().includes(q);
        const matchesResp = c.responsible.name.toLowerCase().includes(q);
        const matchesChannel = c.channelLabel.toLowerCase().includes(q);
        if (!matchesName && !matchesNiche && !matchesResp && !matchesChannel) {
          return false;
        }
      }

      if (channelFilter !== "all" && c.channel !== channelFilter) {
        return false;
      }

      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      if (
        responsibleFilter !== "all" &&
        c.responsible.name !== responsibleFilter
      ) {
        return false;
      }

      return true;
    });
  }, [campanhas, searchQuery, channelFilter, statusFilter, responsibleFilter]);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCampanhas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCampanhas.map((c) => c.id)));
    }
  };

  const handleRowClick = (campanha: CampanhaPremiumItem) => {
    onSelectCampanha(campanha);
    setSelectedIds(new Set([campanha.id]));
  };

  const renderChannelIcon = (channel: ChannelType) => {
    switch (channel) {
      case "google_maps":
        return <SiGooglemaps className="size-4 text-emerald-400" title="Google Maps" />;
      case "instagram":
        return <SiInstagram className="size-4 text-pink-400" title="Instagram" />;
      case "whatsapp":
        return <SiWhatsapp className="size-4 text-green-400" title="WhatsApp" />;
      case "linkedin":
        return <SiLinkedin className="size-4 text-sky-400" title="LinkedIn" />;
      case "youtube":
        return <SiYoutube className="size-4 text-red-400" title="YouTube" />;
      case "tiktok":
        return <SiTiktok className="size-4 text-white" title="TikTok" />;
      default:
        return <Globe className="size-4 text-home-muted" />;
    }
  };

  const renderCompanyAvatar = (c: CampanhaPremiumItem) => {
    // Odonto Prime: Tooth icon in white square
    if (c.name.toLowerCase().includes("odonto")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
          <span className="text-sm">🦷</span>
        </div>
      );
    }
    // Vida: Pink N
    if (c.name.toLowerCase().includes("vida")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-pink-500/20 text-xs font-bold text-pink-400 border border-pink-500/30">
          N
        </div>
      );
    }
    // Sabor & Arte: Food icon
    if (c.name.toLowerCase().includes("sabor")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-xs font-bold text-rose-400 border border-rose-500/30">
          🍷
        </div>
      );
    }
    // Mendes: Blue M
    if (c.name.toLowerCase().includes("mendes")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-bold text-blue-400 border border-blue-500/30">
          M
        </div>
      );
    }
    // Auto Center: Red icon
    if (c.name.toLowerCase().includes("auto")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/30">
          🚗
        </div>
      );
    }
    // Estética: Lotus
    if (c.name.toLowerCase().includes("estética")) {
      return (
        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30">
          🌸
        </div>
      );
    }
    // Default avatar
    return (
      <div className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong text-xs font-bold text-white border border-home-border">
        {c.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const selectedCampanha = campanhas.find((c) => c.id === selectedCampanhaId) || campanhas[0];

  return (
    <div className="flex flex-col rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] sm:p-5">
      {/* Título da seção */}
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">
          Campanhas em andamento
        </h2>
      </div>

      {/* Barra de Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1 sm:min-w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar campanhas por nome, canal ou responsável..."
            className="h-9 w-full rounded-xl border border-home-border bg-home-background pl-9 pr-3 text-xs text-home-foreground outline-none placeholder:text-home-muted transition-colors focus:border-home-blue focus:ring-1 focus:ring-home-blue"
          />
        </div>

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todos os canais</option>
          <option value="google_maps">Google Maps</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="linkedin">LinkedIn</option>
          <option value="youtube">YouTube</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todos os status</option>
          <option value="em_producao">Em produção</option>
          <option value="aguardando_aprovacao">Aguardando aprovação</option>
          <option value="em_envio">Em envio</option>
          <option value="concluida">Concluída</option>
          <option value="pausada">Pausada</option>
        </select>

        <select
          value={responsibleFilter}
          onChange={(e) => setResponsibleFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todos os responsáveis</option>
          <option value="Marcos Gonçalves">Marcos Gonçalves</option>
          <option value="Juliana Martins">Juliana Martins</option>
          <option value="Carlos Mendes">Carlos Mendes</option>
          <option value="Fernanda Costa">Fernanda Costa</option>
          <option value="Ricardo Souza">Ricardo Souza</option>
          <option value="Camila Rocha">Camila Rocha</option>
          <option value="Paulo Henrique">Paulo Henrique</option>
        </select>

        <button
          type="button"
          onClick={() => toast.info("Painel de filtros avançados")}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-background px-3 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface-strong"
        >
          <SlidersHorizontal className="size-3.5 text-home-muted" />
          Mais filtros
          <span className="flex size-4 items-center justify-center rounded-full bg-home-orange text-[9px] font-bold text-white">
            2
          </span>
        </button>
      </div>

      {/* Tabela de Campanhas */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/60 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              <th className="w-10 pb-2.5 pl-2">
                <Checkbox
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredCampanhas.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas"
                />
              </th>
              <th className="pb-2.5 pr-4 font-semibold">CAMPANHA</th>
              <th className="pb-2.5 pr-4 font-semibold">CANAL</th>
              <th className="pb-2.5 pr-4 font-semibold">LEADS</th>
              <th className="pb-2.5 pr-4 font-semibold">ETAPA</th>
              <th className="pb-2.5 pr-4 font-semibold">STATUS</th>
              <th className="pb-2.5 pr-4 font-semibold">RESPONSÁVEL</th>
              <th className="pb-2.5 pr-4 font-semibold">ÚLTIMA AÇÃO</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/40">
            {filteredCampanhas.map((campanha) => {
              const isSelected = selectedCampanhaId === campanha.id;
              const isChecked = selectedIds.has(campanha.id);
              const etapaBadge = ETAPA_BADGES[campanha.etapa] || ETAPA_BADGES.proposta;
              const statusBadge = STATUS_BADGES[campanha.status] || STATUS_BADGES.em_producao;
              const EtapaIcon = etapaBadge.icon;

              return (
                <tr
                  key={campanha.id}
                  onClick={() => handleRowClick(campanha)}
                  className={cn(
                    "group cursor-pointer transition-colors duration-150",
                    isSelected
                      ? "bg-amber-500/10 border-l-2 border-l-home-orange"
                      : "hover:bg-home-surface-strong/60",
                  )}
                >
                  {/* Checkbox */}
                  <td
                    className="py-3 pl-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(campanha.id)}
                      aria-label={`Selecionar ${campanha.name}`}
                    />
                  </td>

                  {/* Nome da Campanha + Nicho */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      {renderCompanyAvatar(campanha)}
                      <div className="min-w-0">
                        <div className="font-semibold text-white transition-colors group-hover:text-home-orange">
                          {campanha.name}
                        </div>
                        <div className="text-[11px] text-home-muted truncate">
                          {campanha.niche}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Canal */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      {renderChannelIcon(campanha.channel)}
                    </div>
                  </td>

                  {/* Leads */}
                  <td className="py-3 pr-4 font-semibold text-home-foreground tabular-nums">
                    {campanha.leadsCount}
                  </td>

                  {/* Etapa */}
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium",
                        etapaBadge.className,
                      )}
                    >
                      <EtapaIcon className="size-3" />
                      {etapaBadge.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        statusBadge.className,
                      )}
                    >
                      {statusBadge.label}
                    </span>
                  </td>

                  {/* Responsável */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-5.5 border border-home-border bg-home-surface-strong">
                        <AvatarImage
                          src={campanha.responsible.avatarUrl}
                          alt={campanha.responsible.name}
                        />
                        <AvatarFallback className="text-[9px] font-bold text-white">
                          {campanha.responsible.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-home-foreground truncate max-w-[110px]">
                        {campanha.responsible.name}
                      </span>
                    </div>
                  </td>

                  {/* Última Ação */}
                  <td className="py-3 pr-4 text-[11px] text-home-muted whitespace-nowrap">
                    {campanha.lastAction}
                  </td>

                  {/* Ações */}
                  <td
                    className="py-3 pr-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenCampanha(campanha)}
                        title="Abrir campanha"
                        className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRenameCampanha(campanha)}
                        title="Renomear campanha"
                        className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendProposal?.(campanha)}
                        title="Disparar proposta"
                        className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-home-orange"
                      >
                        <Send className="size-3.5" />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="Mais opções"
                            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 border-home-border bg-home-surface text-home-foreground"
                        >
                          <DropdownMenuItem
                            onClick={() => onOpenCampanha(campanha)}
                            className="cursor-pointer text-xs"
                          >
                            <Eye className="mr-2 size-3.5" />
                            Abrir revisão
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRenameCampanha(campanha)}
                            className="cursor-pointer text-xs"
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Renomear
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleStatus?.(campanha)}
                            className="cursor-pointer text-xs"
                          >
                            <Clock className="mr-2 size-3.5" />
                            {campanha.status === "concluida" ? "Reabrir" : "Concluir"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-home-border" />
                          <DropdownMenuItem
                            onClick={() => onDeleteCampanha(campanha)}
                            className="cursor-pointer text-xs text-rose-400 focus:text-rose-400"
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Excluir campanha
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de Ações em Lote e Paginação */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-home-border/60 pt-3">
        {/* Lote */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white">
            <span className="flex size-4 items-center justify-center rounded bg-home-orange text-[10px] font-bold text-white">
              ✓
            </span>
            {selectedIds.size} selecionada{selectedIds.size !== 1 ? "s" : ""}
          </span>

          <button
            type="button"
            onClick={() => {
              if (selectedCampanha) onAddLeads?.(selectedCampanha);
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-background px-2.5 text-xs font-medium text-home-foreground transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <UserPlus className="size-3 text-home-muted" />
            Adicionar leads
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedCampanha) onGenerateSite?.(selectedCampanha);
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-background px-2.5 text-xs font-medium text-home-foreground transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <Globe className="size-3 text-home-muted" />
            Gerar site
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedCampanha) onSendProposal?.(selectedCampanha);
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-background px-2.5 text-xs font-medium text-home-foreground transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <Send className="size-3 text-home-muted" />
            Enviar proposta
          </button>

          <button
            type="button"
            onClick={() => toast.success("Exportando dados das campanhas selecionadas...")}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-home-border bg-home-background px-2.5 text-xs font-medium text-home-foreground transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <Download className="size-3 text-home-muted" />
            Exportar
          </button>
        </div>

        {/* Paginação */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setPage(1)}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              page === 1
                ? "bg-home-orange text-white shadow-sm"
                : "border border-home-border bg-home-background text-home-foreground hover:bg-home-surface-strong",
            )}
          >
            1
          </button>

          <button
            type="button"
            onClick={() => setPage(2)}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              page === 2
                ? "bg-home-orange text-white shadow-sm"
                : "border border-home-border bg-home-background text-home-foreground hover:bg-home-surface-strong",
            )}
          >
            2
          </button>

          <button
            type="button"
            onClick={() => setPage(3)}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
              page === 3
                ? "bg-home-orange text-white shadow-sm"
                : "border border-home-border bg-home-background text-home-foreground hover:bg-home-surface-strong",
            )}
          >
            3
          </button>

          <button
            type="button"
            disabled={page === 3}
            onClick={() => setPage((p) => Math.min(3, p + 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
