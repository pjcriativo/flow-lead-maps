import { useState, useMemo } from "react";
import {
  Search,
  CheckSquare,
  Square,
  Star,
  Phone,
  Instagram,
  Plus,
  Building2,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";

export interface GoogleMapsApproachLeadSelectionProps {
  leads: Lead[];
  selectedLeadIds: Set<string>;
  onToggleSelectLead: (id: string) => void;
  onSelectAllLeads: () => void;
  onClearSelection: () => void;
  focusedLeadId: string | null;
  onFocusLead: (lead: Lead) => void;
  onVoltarParaResultados?: () => void;
}

export function GoogleMapsApproachLeadSelection({
  leads,
  selectedLeadIds,
  onToggleSelectLead,
  onSelectAllLeads,
  onClearSelection,
  focusedLeadId,
  onFocusLead,
  onVoltarParaResultados,
}: GoogleMapsApproachLeadSelectionProps) {
  const [tab, setTab] = useState<"selecionados" | "todos">("selecionados");
  const [busca, setBusca] = useState("");

  // Filtra por aba (selecionados vs todos) e por termo de busca
  const leadsExibidos = useMemo(() => {
    let base = tab === "selecionados" ? leads.filter((l) => selectedLeadIds.has(l.id)) : leads;

    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      base = base.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q),
      );
    }
    return base;
  }, [leads, selectedLeadIds, tab, busca]);

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm flex flex-col justify-between space-y-3.5 h-full">
      {/* Topo da Coluna 1 */}
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center justify-between">
          <span>1. Seleção de Leads</span>
        </h3>
        <p className="text-[11px] text-home-muted leading-tight">
          Escolha os leads que farão parte da sua campanha e defina a lista de destino.
        </p>
      </div>

      {/* Abas: Leads selecionados vs Toda a lista */}
      <div className="flex rounded-xl border border-home-border p-1 bg-home-surface/60">
        <button
          type="button"
          onClick={() => setTab("selecionados")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            tab === "selecionados"
              ? "bg-home-orange text-white shadow-sm font-bold"
              : "text-home-muted hover:text-white",
          )}
        >
          Leads selecionados ({selectedLeadIds.size})
        </button>
        <button
          type="button"
          onClick={() => setTab("todos")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            tab === "todos"
              ? "bg-home-orange text-white shadow-sm font-bold"
              : "text-home-muted hover:text-white",
          )}
        >
          Toda a lista ({leads.length})
        </button>
      </div>

      {/* Campo de Busca de Empresas */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-home-muted" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar empresa, categoria ou cidade..."
          className="w-full h-8 rounded-xl border border-home-border bg-home-surface/80 pl-9 pr-3 text-xs text-white placeholder:text-home-muted/70 focus:border-home-orange focus:outline-none"
        />
      </div>

      {/* Lista Rolável de Cards de Empresas */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[460px] min-h-[300px] scrollbar-thin scrollbar-thumb-home-border">
        {leadsExibidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-home-muted p-4 space-y-2">
            <Building2 className="size-6 text-home-muted/50" />
            <span>Nenhum lead encontrado neste filtro.</span>
            {tab === "selecionados" && selectedLeadIds.size === 0 && (
              <button
                type="button"
                onClick={() => setTab("todos")}
                className="text-[11px] font-semibold text-home-orange hover:underline cursor-pointer"
              >
                Alternar para "Toda a lista"
              </button>
            )}
          </div>
        ) : (
          leadsExibidos.map((lead) => {
            const isSelected = selectedLeadIds.has(lead.id);
            const isFocused = focusedLeadId === lead.id;
            const ratingNum = lead.rating ? Number(lead.rating) : null;
            const reviewCount = lead.review_count ? Number(lead.review_count) : null;

            return (
              <div
                key={lead.id}
                onClick={() => onFocusLead(lead)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5",
                  isFocused
                    ? "border-home-orange bg-home-orange/10 shadow-sm shadow-home-orange/10"
                    : isSelected
                      ? "border-home-border bg-home-surface/70 hover:bg-home-surface"
                      : "border-home-border/50 bg-[#0d131c]/60 hover:bg-home-surface/50 opacity-70",
                )}
              >
                {/* Checkbox de Seleção */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectLead(lead.id);
                  }}
                  className="mt-0.5 text-home-muted hover:text-home-orange transition-colors cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-home-orange" />
                  ) : (
                    <Square className="size-4 text-home-muted" />
                  )}
                </button>

                {/* Avatar / Ícone Redondo */}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-home-surface border border-home-border text-home-orange font-bold text-xs mt-0.5">
                  {lead.business_name ? lead.business_name.charAt(0).toUpperCase() : "E"}
                </div>

                {/* Informações da Empresa */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {lead.business_name}
                    </p>
                    {/* Avaliação */}
                    {ratingNum && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 shrink-0">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        <span>{ratingNum.toFixed(1)}</span>
                        {reviewCount && (
                          <span className="text-home-muted font-normal">({reviewCount})</span>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-home-muted truncate mt-0.5">
                    {lead.category || "Empresa"}
                  </p>
                  <p className="text-[10px] text-home-muted/80 truncate">
                    {lead.city || ""} {lead.state ? `- ${lead.state}` : ""}
                  </p>

                  {/* Badges de Contato Disponíveis */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5">
                    {lead.whatsapp && (
                      <div
                        className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
                        title={`WhatsApp: ${lead.whatsapp}`}
                      >
                        <MessageCircle className="size-2.5" />
                      </div>
                    )}
                    {lead.phone && (
                      <div
                        className="flex size-4 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400"
                        title={`Telefone: ${lead.phone}`}
                      >
                        <Phone className="size-2.5" />
                      </div>
                    )}
                    {lead.instagram_url && (
                      <div
                        className="flex size-4 items-center justify-center rounded-full bg-purple-500/15 text-purple-400"
                        title="Instagram disponível"
                      >
                        <Instagram className="size-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Rodapé da Coluna 1 */}
      <div className="pt-2 border-t border-home-border/60 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onVoltarParaResultados}
          className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface/60 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-home-surface transition-colors cursor-pointer"
        >
          <Plus className="size-3 text-home-orange" />
          <span>Selecionar mais leads</span>
        </button>

        <span className="text-[11px] text-home-muted">
          {selectedLeadIds.size} de {leads.length} selecionados
        </span>
      </div>
    </div>
  );
}
