import { useState, type MouseEvent } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LeadItem } from "./leads-premium-data";
import { LeadRow } from "./LeadRow";

interface LeadsTableProps {
  leads: LeadItem[];
  selectedLeadId: string | null;
  onSelectLead: (lead: LeadItem) => void;
  className?: string;
}

export function LeadsTable({
  leads,
  selectedLeadId,
  onSelectLead,
  className,
}: LeadsTableProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const allChecked =
    leads.length > 0 && leads.every((lead) => checkedIds.has(lead.id));

  const handleToggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const handleToggleCheck = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedIds(next);
  };

  const handleQuickAction = (
    action: "phone" | "whatsapp" | "email" | "more",
    lead: LeadItem,
    e: MouseEvent,
  ) => {
    e.stopPropagation();
    if (action === "phone") {
      toast.success(`Ligando para ${lead.company}: ${lead.phone}`);
      window.open(`tel:${lead.phone.replace(/\D/g, "")}`, "_self");
    } else if (action === "whatsapp") {
      toast.success(`Abrindo WhatsApp de ${lead.company}...`);
      window.open(`https://wa.me/55${lead.phone.replace(/\D/g, "")}`, "_blank");
    } else if (action === "email") {
      toast.success(`Enviando e-mail para ${lead.email}...`);
      window.open(`mailto:${lead.email}`, "_blank");
    } else {
      toast.info(`Mais opções para ${lead.company}`);
    }
  };

  const handleBulkAction = (actionName: string) => {
    if (checkedIds.size === 0) {
      toast.warning("Selecione pelo menos um lead para esta ação");
      return;
    }
    toast.success(`${actionName} executada para ${checkedIds.size} leads!`);
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-home-border bg-home-surface/80",
        className,
      )}
    >
      {/* Table Container */}
      <div className="min-w-0 flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/80 bg-home-surface-strong/60 text-[10px] font-bold uppercase tracking-wider text-home-muted/80">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                  aria-label="Selecionar todos os leads"
                  className="size-3.5 rounded border-home-border bg-home-surface text-home-orange focus:ring-1 focus:ring-home-orange"
                />
              </th>
              <th className="px-3 py-3">EMPRESA / CONTATO</th>
              <th className="px-3 py-3">CONTATOS</th>
              <th className="px-3 py-3 text-center">CANAL</th>
              <th className="px-3 py-3">LOCALIZAÇÃO</th>
              <th className="px-3 py-3 text-center">SCORE</th>
              <th className="px-3 py-3 text-center">STATUS</th>
              <th className="px-3 py-3">
                <div className="flex items-center gap-1">
                  <span>DATA</span>
                  <ArrowUpDown className="size-3 text-home-muted" />
                </div>
              </th>
              <th className="px-3 py-3 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-home-muted">
                  Nenhum lead encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLeadId === lead.id}
                  isChecked={checkedIds.has(lead.id)}
                  onToggleCheck={handleToggleCheck}
                  onSelectLead={onSelectLead}
                  onQuickAction={handleQuickAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-home-border/70 bg-home-surface px-4 py-3 text-xs text-home-muted">
        {/* Bulk Selection Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 pr-2 text-xs font-medium text-home-foreground/90">
            <input
              type="checkbox"
              checked={checkedIds.size > 0}
              onChange={handleToggleAll}
              className="size-3.5 rounded border-home-border bg-home-surface text-home-orange"
            />
            <span>{checkedIds.size} selecionados</span>
          </label>

          <button
            type="button"
            onClick={() => handleBulkAction("Atribuir")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <UserPlus className="size-3 text-home-muted" />
            <span>Atribuir</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkAction("Adicionar à lista")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <FolderPlus className="size-3 text-home-muted" />
            <span>Adicionar à lista</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkAction("Enviar mensagem")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <MessageSquare className="size-3 text-home-muted" />
            <span>Enviar mensagem</span>
          </button>

          <button
            type="button"
            onClick={() => handleBulkAction("Exportar selecionados")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <Download className="size-3 text-home-muted" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={cn(
                "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                currentPage === page
                  ? "bg-home-orange font-bold text-white shadow-[0_0_12px_rgba(255,98,0,0.4)]"
                  : "border border-home-border bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white",
              )}
            >
              {page}
            </button>
          ))}

          <span className="px-1 text-xs text-home-muted">...</span>

          <button
            type="button"
            onClick={() => setCurrentPage(125)}
            className={cn(
              "flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-xs font-semibold text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white",
              currentPage === 125 && "bg-home-orange text-white",
            )}
          >
            125
          </button>

          <button
            type="button"
            aria-label="Próxima página"
            disabled={currentPage === 125}
            onClick={() => setCurrentPage((p) => Math.min(125, p + 1))}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
