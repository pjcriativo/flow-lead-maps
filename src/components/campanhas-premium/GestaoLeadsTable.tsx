import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GestaoLeadItem, GestaoLeadStatus } from "./gestao-producao-data";

interface GestaoLeadsTableProps {
  leads: GestaoLeadItem[];
  selectedLeadId: string | null;
  onSelectLead: (lead: GestaoLeadItem) => void;
  onGenerateAI: (selectedLeads: GestaoLeadItem[]) => void;
  onApproveBatch: (draftLeads: GestaoLeadItem[]) => void;
  onEditLead?: (lead: GestaoLeadItem) => void;
  onDiscardLead?: (lead: GestaoLeadItem) => void;
  isGenerating?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<
  GestaoLeadStatus,
  { label: string; className: string; showSpinner?: boolean }
> = {
  aprovado: {
    label: "★ Aprovado",
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  },
  rascunho: {
    label: "★ Rascunho",
    className: "border-blue-500/30 bg-blue-500/15 text-blue-400",
  },
  em_geracao: {
    label: "★ Em geração",
    className: "border-amber-500/30 bg-amber-500/15 text-amber-400",
    showSpinner: true,
  },
  pendente: {
    label: "★ Pendente",
    className: "border-slate-500/30 bg-slate-500/15 text-slate-400",
  },
  sem_motivo: {
    label: "★ Sem motivo",
    className: "border-rose-500/30 bg-rose-500/15 text-rose-400",
  },
  enviado: {
    label: "★ Enviado",
    className: "border-cyan-500/30 bg-cyan-500/15 text-cyan-400",
  },
  descartado: {
    label: "★ Descartado",
    className: "border-neutral-500/30 bg-neutral-500/15 text-neutral-400",
  },
  erro: {
    label: "★ Erro",
    className: "border-red-500/30 bg-red-500/15 text-red-400",
  },
};

export function GestaoLeadsTable({
  leads,
  selectedLeadId,
  onSelectLead,
  onGenerateAI,
  onApproveBatch,
  onEditLead,
  onDiscardLead,
  isGenerating = false,
  className,
}: GestaoLeadsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    new Set(leads[0] ? [leads[0].id] : []),
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Cidades únicas
  const cities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => set.add(`${l.city} - ${l.uf}`));
    return Array.from(set);
  }, [leads]);

  // Filtros
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCity = lead.city.toLowerCase().includes(q);
        const matchesNiche = lead.niche.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesNiche) return false;
      }

      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      if (cityFilter !== "all" && `${lead.city} - ${lead.uf}` !== cityFilter) {
        return false;
      }

      return true;
    });
  }, [leads, search, statusFilter, cityFilter]);

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const selectedLeadsObjects = useMemo(
    () => leads.filter((l) => selectedIds.has(l.id)),
    [leads, selectedIds],
  );

  const draftLeadsObjects = useMemo(
    () => leads.filter((l) => l.status === "rascunho"),
    [leads],
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-home-border bg-home-surface/80 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] sm:p-5",
        className,
      )}
    >
      {/* Cabeçalho da Tabela com os dois botões principais */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Leads da campanha
            </h2>
            <span className="text-sm font-semibold text-home-muted">
              ({leads.length})
            </span>
          </div>
          <p className="mt-0.5 text-xs text-home-muted">
            Selecione os leads, gere os sites e propostas e acompanhe o progresso.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão + Gerar com IA */}
          <button
            type="button"
            onClick={() => onGenerateAI(selectedLeadsObjects.length ? selectedLeadsObjects : leads)}
            disabled={isGenerating}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-home-orange px-3.5 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.35)] transition-all duration-200 hover:bg-home-orange/90 hover:shadow-[0_0_30px_rgba(255,98,0,0.5)] active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5 stroke-[2.5]" />
                Gerar com IA
              </>
            )}
          </button>

          {/* Botão Aprovar em lote */}
          <button
            type="button"
            onClick={() => onApproveBatch(draftLeadsObjects)}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-surface px-3 text-xs font-semibold text-home-foreground transition-all duration-200 hover:border-home-border/80 hover:bg-home-surface-strong hover:text-white"
          >
            <FileCheck className="size-3.5 text-home-muted" />
            Aprovar em lote
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar leads por nome, empresa ou cidade..."
            className="h-9 w-full rounded-xl border border-home-border bg-home-background pl-9 pr-3 text-xs text-home-foreground outline-none placeholder:text-home-muted transition-colors focus:border-home-blue focus:ring-1 focus:ring-home-blue"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todos os status</option>
          <option value="aprovado">Aprovado</option>
          <option value="rascunho">Rascunho</option>
          <option value="em_geracao">Em geração</option>
          <option value="pendente">Pendente</option>
          <option value="sem_motivo">Sem motivo</option>
          <option value="enviado">Enviado</option>
        </select>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-9 rounded-xl border border-home-border bg-home-background px-3 text-xs font-medium text-home-foreground outline-none transition-colors hover:border-home-border/80 focus:border-home-blue"
        >
          <option value="all">Todas as cidades</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-xl border border-home-border bg-home-background px-3 text-xs font-semibold text-home-foreground transition-all hover:bg-home-surface-strong"
        >
          <SlidersHorizontal className="size-3.5 text-home-muted" />
          Mais filtros
        </button>
      </div>

      {/* Tabela de Leads */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/60 text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              <th className="w-8 pb-2.5 pl-2">
                <Checkbox
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === filteredLeads.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todos os leads"
                />
              </th>
              <th className="pb-2.5 pr-4 font-semibold">Lead / Empresa</th>
              <th className="pb-2.5 pr-4 font-semibold">Cidade</th>
              <th className="pb-2.5 pr-4 font-semibold">Status</th>
              <th className="pb-2.5 pr-3 text-center font-semibold">Site</th>
              <th className="pb-2.5 pr-3 text-center font-semibold">Proposta</th>
              <th className="pb-2.5 pr-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/40">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLeadId === lead.id;
              const isChecked = selectedIds.has(lead.id);
              const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.pendente;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
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
                      onCheckedChange={() => toggleSelect(lead.id)}
                      aria-label={`Selecionar ${lead.name}`}
                    />
                  </td>

                  {/* Nome da Empresa + Nicho */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-home-border bg-home-surface-strong text-white text-xs shadow-sm">
                        <Utensils className="size-3.5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white transition-colors group-hover:text-home-orange">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-home-muted truncate">
                          {lead.niche}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cidade */}
                  <td className="py-3 pr-4 text-[11px] text-home-foreground whitespace-nowrap">
                    {lead.city} - {lead.uf}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                        statusCfg.className,
                      )}
                    >
                      {statusCfg.showSpinner ? (
                        <Loader2 className="size-2.5 animate-spin mr-0.5" />
                      ) : null}
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Site Icon */}
                  <td className="py-3 pr-3 text-center">
                    {lead.status === "em_geracao" ? (
                      <Loader2 className="mx-auto size-3.5 animate-spin text-home-muted" />
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="text-home-muted hover:text-white transition-colors"
                        title={lead.hasSite ? "Visualizar site" : "Sem site gerado"}
                      >
                        <Link2 className="mx-auto size-3.5" />
                      </button>
                    )}
                  </td>

                  {/* Proposta Icon */}
                  <td className="py-3 pr-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="text-home-muted hover:text-white transition-colors"
                      title={lead.hasProposal ? "Visualizar proposta" : "Sem proposta"}
                    >
                      <FileText className="mx-auto size-3.5" />
                    </button>
                  </td>

                  {/* Ações */}
                  <td
                    className="py-3 pr-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectLead(lead)}
                        title="Ver prévia"
                        className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                      >
                        <Eye className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditLead?.(lead)}
                        title="Editar"
                        className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="Mais opções"
                            className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 border-home-border bg-home-surface text-home-foreground"
                        >
                          <DropdownMenuItem
                            onClick={() => onSelectLead(lead)}
                            className="cursor-pointer text-xs"
                          >
                            <Eye className="mr-2 size-3.5" />
                            Abrir no painel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditLead?.(lead)}
                            className="cursor-pointer text-xs"
                          >
                            <Pencil className="mr-2 size-3.5" />
                            Editar proposta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-home-border" />
                          <DropdownMenuItem
                            onClick={() => onDiscardLead?.(lead)}
                            className="cursor-pointer text-xs text-rose-400 focus:text-rose-400"
                          >
                            <Trash2 className="mr-2 size-3.5" />
                            Descartar lead
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

      {/* Paginação Inferior */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-home-border/60 pt-3 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                page === n
                  ? "bg-home-orange text-white shadow-sm"
                  : "border border-home-border bg-home-background text-home-foreground hover:bg-home-surface-strong",
              )}
            >
              {n}
            </button>
          ))}

          <span className="px-1 text-home-muted">...</span>

          <button
            type="button"
            onClick={() => setPage(25)}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-xs font-semibold text-home-foreground transition-colors hover:bg-home-surface-strong"
          >
            25
          </button>

          <button
            type="button"
            disabled={page === 25}
            onClick={() => setPage((p) => Math.min(25, p + 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-background text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-7 rounded-lg border border-home-border bg-home-background px-2 text-xs font-medium text-home-foreground outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      </div>
    </div>
  );
}
