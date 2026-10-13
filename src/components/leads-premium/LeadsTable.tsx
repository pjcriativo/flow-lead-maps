import type { MouseEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  Loader2,
  MessageSquare,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadItem } from "./leads-premium-data";
import { LeadRow } from "./LeadRow";

interface LeadsTableProps {
  leads: LeadItem[];
  selectedLeadId: string | null;
  selectedIds: Set<string>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  sortDirection: "asc" | "desc";
  onSelectLead: (lead: LeadItem) => void;
  onSelectionChange: (ids: Set<string>) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onSortDate: () => void;
  onAssignSelected: () => void;
  onAddSelectedToList: () => void;
  onExportSelected: () => void;
  className?: string;
}

function paginationItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const valid = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  valid.forEach((value, index) => {
    if (index > 0 && value - valid[index - 1] > 1) result.push("ellipsis");
    result.push(value);
  });
  return result;
}

export function LeadsTable({
  leads,
  selectedLeadId,
  selectedIds,
  page,
  pageSize,
  total,
  totalPages,
  loading,
  refreshing,
  error,
  sortDirection,
  onSelectLead,
  onSelectionChange,
  onPageChange,
  onRetry,
  onSortDate,
  onAssignSelected,
  onAddSelectedToList,
  onExportSelected,
  className,
}: LeadsTableProps) {
  const pageIds = leads.map((lead) => lead.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;

  const handleToggleAll = () => {
    const next = new Set(selectedIds);
    if (allChecked) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    onSelectionChange(next);
  };

  const handleToggleCheck = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const handleQuickAction = (
    action: "phone" | "whatsapp" | "email" | "more",
    lead: LeadItem,
    event: MouseEvent,
  ) => {
    event.stopPropagation();
    if (action === "phone" && lead.phone) {
      window.location.href = `tel:${lead.phone.replace(/\D/g, "")}`;
      return;
    }
    if (action === "whatsapp") {
      const number = (lead.whatsapp || lead.phone).replace(/\D/g, "");
      if (number)
        window.open(
          `https://wa.me/${number.startsWith("55") ? number : `55${number}`}`,
          "_blank",
          "noopener,noreferrer",
        );
      return;
    }
    if (action === "email" && lead.email) {
      window.location.href = `mailto:${lead.email}`;
      return;
    }
    if (action === "more") onSelectLead(lead);
  };

  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(total, page * pageSize);
  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-home-border bg-home-surface/80",
        className,
      )}
    >
      <div className="min-w-0 flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/80 bg-home-surface-strong/60 text-[10px] font-bold uppercase tracking-wider text-home-muted/80">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={handleToggleAll}
                  aria-label="Selecionar leads desta página"
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
                <button
                  type="button"
                  onClick={onSortDate}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>DATA</span>
                  {sortDirection === "desc" ? (
                    <ArrowDown className="size-3" />
                  ) : (
                    <ArrowUp className="size-3" />
                  )}
                </button>
              </th>
              <th className="px-3 py-3 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-14 text-center text-home-muted">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Carregando leads...
                  </span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <p className="text-sm text-red-300">{error}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-home-border px-3 py-1.5 text-xs text-white hover:bg-home-surface-strong"
                  >
                    <RefreshCw className="size-3.5" /> Tentar novamente
                  </button>
                </td>
              </tr>
            ) : leads.length === 0 ? (
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
                  isChecked={selectedIds.has(lead.id)}
                  onToggleCheck={handleToggleCheck}
                  onSelectLead={onSelectLead}
                  onQuickAction={handleQuickAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-home-border/70 bg-home-surface px-4 py-3 text-xs text-home-muted">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 pr-2 text-xs font-medium text-home-foreground/90">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              className="size-3.5 rounded border-home-border bg-home-surface text-home-orange"
            />
            <span>{selectedIds.size} selecionados</span>
          </label>
          <BulkButton
            label="Atribuir"
            disabled={!hasSelection}
            onClick={onAssignSelected}
            icon={<UserPlus className="size-3 text-home-muted" />}
          />
          <BulkButton
            label="Adicionar à lista"
            disabled={!hasSelection}
            onClick={onAddSelectedToList}
            icon={<FolderPlus className="size-3 text-home-muted" />}
          />
          <BulkButton
            label="Enviar mensagem"
            disabled
            title="Envio em lote não possui contrato seguro nesta tela"
            icon={<MessageSquare className="size-3 text-home-muted" />}
          />
          <BulkButton
            label="Exportar"
            disabled={!hasSelection}
            onClick={onExportSelected}
            icon={<Download className="size-3 text-home-muted" />}
          />
          {selectedOnPage > 0 && selectedOnPage < leads.length ? (
            <span className="text-[10px]">{selectedOnPage} nesta página</span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 text-[10px]">
            {firstVisible}–{lastVisible} de {total}
          </span>
          {refreshing && !loading ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
          <button
            type="button"
            aria-label="Página anterior"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          {paginationItems(page, totalPages).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-1">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                  page === item
                    ? "bg-home-orange font-bold text-white shadow-[0_0_12px_rgba(255,98,0,0.4)]"
                    : "border border-home-border bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white",
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkButton({
  label,
  icon,
  disabled,
  onClick,
  title,
}: {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-lg border border-home-border bg-home-surface px-2.5 py-1 text-[11px] font-semibold text-home-foreground/90 transition-colors hover:bg-home-surface-strong hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
