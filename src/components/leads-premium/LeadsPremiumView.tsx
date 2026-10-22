import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import {
  createLead,
  deleteLead,
  fetchAllLeadsForExport,
  fetchLeadById,
  fetchLeadsByIds,
  updateLead,
  type CreateLeadInput,
} from "@/lib/leads-api";
import { adicionarLeadsALista } from "@/lib/lists-api";
import { atribuirLead } from "@/services/membros";
import { adicionarLeadsCampanha } from "@/services/campanhas";
import { cn } from "@/lib/utils";
import { LeadDetailsPanel } from "./LeadDetailsPanel";
import { LeadFormDialog, type LeadFormValues } from "./LeadFormDialog";
import { LeadsFiltersBar } from "./LeadsFiltersBar";
import { LeadsHeader } from "./LeadsHeader";
import { LeadsStatsCards } from "./LeadsStatsCards";
import { LeadsTable } from "./LeadsTable";
import type { LeadMenuAction } from "./LeadActionsMenu";
import { leadsToCsv, toLeadItem, type LeadItem } from "./leads-premium-data";
import { useLeadsPremium } from "./useLeadsPremium";

interface LeadsPremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  focusLeadId?: string | null;
  onFocusHandled?: () => void;
  onOpenRedesign?: (leadId: string) => void;
  onOpenPipeline?: (leadId: string) => void;
}

type BulkDialog = "assign" | "list" | null;

export function LeadsPremiumView({
  user = { name: "Usuário", avatarUrl: "", initials: "US" },
  unreadNotifications = 0,
  focusLeadId = null,
  onFocusHandled,
  onOpenRedesign,
  onOpenPipeline,
}: LeadsPremiumViewProps) {
  const leadsState = useLeadsPremium();
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const handledFocusRef = useRef<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bulkDialog, setBulkDialog] = useState<BulkDialog>(null);
  const [bulkTarget, setBulkTarget] = useState("");
  const [exporting, setExporting] = useState(false);

  const focusedLeadQuery = useQuery({
    queryKey: ["premium-leads", "detail", focusLeadId] as const,
    queryFn: () => {
      if (!focusLeadId) throw new Error("ID do lead não informado.");
      return fetchLeadById(focusLeadId);
    },
    enabled: Boolean(focusLeadId),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!focusLeadId) {
      handledFocusRef.current = null;
      return;
    }
    if (handledFocusRef.current === focusLeadId) return;
    if (focusedLeadQuery.data) {
      const record = focusedLeadQuery.data;
      handledFocusRef.current = focusLeadId;
      setSelectedLead(toLeadItem(record));
      onFocusHandled?.();
      return;
    }
    if (focusedLeadQuery.isError) {
      handledFocusRef.current = focusLeadId;
      toast.error(
        "Não foi possível abrir este lead. Ele pode ter sido removido ou você não tem acesso.",
      );
      onFocusHandled?.();
    }
  }, [focusLeadId, focusedLeadQuery.data, focusedLeadQuery.isError, onFocusHandled]);

  useEffect(() => {
    if (!selectedLead) return;
    const refreshed = leadsState.leads.find((lead) => lead.id === selectedLead.id);
    if (refreshed && refreshed.updatedAt !== selectedLead.updatedAt) setSelectedLead(refreshed);
  }, [leadsState.leads, selectedLead]);

  const refreshAll = async () => {
    await leadsState.refresh();
    if (selectedLead) {
      const records = await fetchLeadsByIds([selectedLead.id]);
      setSelectedLead(records[0] ? toLeadItem(records[0]) : null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const common: CreateLeadInput = {
        business_name: values.businessName.trim(),
        owner_name: values.contactName.trim() || null,
        phone: values.phone.trim() || null,
        whatsapp: values.whatsapp.trim() || null,
        email: values.email.trim().toLowerCase() || null,
        website: values.website.trim() || null,
        category: values.category.trim() || null,
        city: values.city.trim() || null,
        state: values.state.trim().toUpperCase() || null,
        address: values.address.trim() || null,
        notes: values.notes.trim() || null,
        list_id: values.listId || null,
      };
      if (!editingLead) return createLead(common);
      const hasContact = Boolean(common.phone || common.whatsapp || common.email);
      return updateLead(editingLead.id, {
        ...common,
        status: values.status,
        sem_contato: !hasContact,
        has_phone: Boolean(common.phone || common.whatsapp),
        has_website: Boolean(common.website),
      });
    },
    onSuccess: async (record) => {
      setSelectedLead(toLeadItem(record));
      setFormOpen(false);
      setEditingLead(null);
      await leadsState.refresh();
      toast.success(editingLead ? "Lead atualizado." : "Lead criado.");
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateLead>[1] }) =>
      updateLead(id, patch),
    onSuccess: async (record) => {
      setSelectedLead(toLeadItem(record));
      await leadsState.refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: async () => {
      setSelectedLead(null);
      await leadsState.refresh();
      toast.success("Lead excluído.");
    },
  });

  const openCreate = () => {
    setEditingLead(null);
    saveMutation.reset();
    setFormOpen(true);
  };
  const openEdit = () => {
    if (!selectedLead) return;
    setEditingLead(selectedLead);
    saveMutation.reset();
    setFormOpen(true);
  };
  const removeSelectedLead = async () => {
    if (!selectedLead || !leadsState.context?.canDelete) return;
    if (!window.confirm(`Excluir "${selectedLead.company}"? Esta ação não pode ser desfeita.`))
      return;
    try {
      await deleteMutation.mutateAsync(selectedLead.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao excluir o lead.");
    }
  };

  // Menu "⋮" de cada linha: age sobre ESTE lead (as ações em lote seguem usando a seleção).
  const handleRowAction = (action: LeadMenuAction, lead: LeadItem) => {
    switch (action) {
      case "details":
        setSelectedLead(lead);
        break;
      case "edit":
        setSelectedLead(lead);
        setEditingLead(lead);
        saveMutation.reset();
        setFormOpen(true);
        break;
      case "pipeline":
        onOpenPipeline?.(lead.id);
        break;
      case "assign":
        setSelectedIds(new Set([lead.id]));
        setBulkTarget("");
        setBulkDialog("assign");
        break;
      case "list":
        setSelectedIds(new Set([lead.id]));
        setBulkTarget("");
        setBulkDialog("list");
        break;
      case "export":
        void exportSelected([lead.id]);
        break;
      case "copy-phone":
      case "copy-email": {
        const valor = action === "copy-email" ? lead.email : lead.whatsapp || lead.phone;
        if (!valor) break;
        navigator.clipboard
          .writeText(valor)
          .then(() =>
            toast.success(action === "copy-email" ? "E-mail copiado." : "Telefone copiado."),
          )
          .catch(() => toast.error("Não foi possível copiar. Copie manualmente."));
        break;
      }
      case "delete":
        if (!leadsState.context?.canDelete) break;
        if (!window.confirm(`Excluir "${lead.company}"? Esta ação não pode ser desfeita.`)) break;
        deleteMutation
          .mutateAsync(lead.id)
          .catch((error) =>
            toast.error(error instanceof Error ? error.message : "Falha ao excluir o lead."),
          );
        break;
    }
  };

  const savePatch = async (patch: Parameters<typeof updateLead>[1], successMessage: string) => {
    if (!selectedLead) return;
    try {
      await patchMutation.mutateAsync({ id: selectedLead.id, patch });
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar alterações.");
    }
  };

  const downloadCsv = (contents: string, prefix = "flow-leads") => {
    const blob = new Blob(["\ufeff" + contents], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportFiltered = async () => {
    setExporting(true);
    try {
      const records = await fetchAllLeadsForExport(
        leadsState.filters,
        leadsState.sortBy,
        leadsState.sortDirection,
      );
      if (!records.length) {
        toast.info("Não há leads autorizados para exportar com estes filtros.");
        return;
      }
      downloadCsv(leadsToCsv(records));
      toast.success(`${records.length} lead(s) exportado(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar leads.");
    } finally {
      setExporting(false);
    }
  };

  const exportSelected = async (ids: string[] = [...selectedIds]) => {
    try {
      const records = await fetchLeadsByIds(ids);
      if (!records.length) throw new Error("Nenhum lead autorizado permaneceu na seleção.");
      downloadCsv(leadsToCsv(records), "flow-leads-selecionados");
      toast.success(`${records.length} lead(s) selecionado(s) exportado(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao exportar a seleção.");
    }
  };

  const applyBulkAction = async () => {
    const ids = [...selectedIds];
    if (!ids.length || !bulkTarget || !bulkDialog) return;
    try {
      const authorizedLeads = await fetchLeadsByIds(ids);
      if (authorizedLeads.length !== ids.length) {
        throw new Error("A seleção contém leads que não estão mais autorizados. Atualize a tela.");
      }
      if (bulkDialog === "list") {
        await adicionarLeadsALista(bulkTarget, ids);
      } else {
        const results = await Promise.allSettled(ids.map((id) => atribuirLead(id, bulkTarget)));
        const failed = results.filter((result) => {
          if (result.status === "rejected") return true;
          return !result.value.ok;
        }).length;
        if (failed)
          throw new Error(`${failed} de ${ids.length} atribuições não foram autorizadas.`);
      }
      toast.success(
        bulkDialog === "list"
          ? `${ids.length} lead(s) movido(s) para a lista.`
          : `${ids.length} lead(s) atribuído(s).`,
      );
      setSelectedIds(new Set());
      setBulkDialog(null);
      setBulkTarget("");
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha na ação em lote.");
    }
  };

  const responsibleOptions = useMemo(
    () =>
      leadsState.members.map((member) => ({
        id: member.user_id,
        label: member.nome || member.email,
      })),
    [leadsState.members],
  );
  const errorMessage = leadsState.error
    ? leadsState.error instanceof Error
      ? leadsState.error.message
      : "Falha ao carregar leads."
    : null;

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        <LeadsHeader
          onExport={() => void exportFiltered()}
          onNewLead={openCreate}
          exporting={exporting}
        />
        <LeadsStatsCards
          metrics={leadsState.metrics}
          unavailable={Boolean(leadsState.metricsError)}
        />
        <LeadsFiltersBar
          searchQuery={leadsState.searchQuery}
          onSearchChange={leadsState.setSearchQuery}
          selectedChannel={leadsState.selectedChannel}
          onChannelChange={leadsState.setSelectedChannel}
          selectedStatus={leadsState.selectedStatus}
          onStatusChange={leadsState.setSelectedStatus}
          selectedList={leadsState.selectedList}
          onListChange={leadsState.setSelectedList}
          lists={leadsState.lists}
          selectedResponsible={leadsState.selectedResponsible}
          onResponsibleChange={leadsState.setSelectedResponsible}
          responsibleOptions={responsibleOptions}
          selectedScore={leadsState.selectedScore}
          onScoreChange={leadsState.setSelectedScore}
          activeFilterCount={leadsState.activeFilterCount}
          onOpenMoreFilters={() => setAdvancedOpen(true)}
          onClearFilters={leadsState.clearFilters}
        />

        <section
          className={cn(
            "grid items-start gap-4",
            selectedLead
              ? "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_420px]"
              : "grid-cols-1",
          )}
        >
          <div className="min-w-0">
            <LeadsTable
              leads={leadsState.leads}
              selectedLeadId={selectedLead?.id ?? null}
              selectedIds={selectedIds}
              page={leadsState.page}
              pageSize={leadsState.pageSize}
              total={leadsState.total}
              totalPages={leadsState.totalPages}
              loading={leadsState.loading}
              refreshing={leadsState.refreshing}
              error={errorMessage}
              sortDirection={leadsState.sortDirection}
              onSelectLead={setSelectedLead}
              onSelectionChange={setSelectedIds}
              onPageChange={leadsState.setPage}
              onRetry={() => void leadsState.refresh()}
              onSortDate={leadsState.toggleCreatedAtSort}
              onAssignSelected={() => {
                setBulkTarget("");
                setBulkDialog("assign");
              }}
              onAddSelectedToList={() => {
                setBulkTarget("");
                setBulkDialog("list");
              }}
              onExportSelected={() => void exportSelected()}
              onRowAction={handleRowAction}
              canDelete={Boolean(leadsState.context?.canDelete)}
            />
          </div>
          {selectedLead ? (
            <div className="sticky top-5 min-w-0">
              <LeadDetailsPanel
                lead={selectedLead}
                lists={leadsState.lists}
                campaigns={leadsState.campaigns}
                campaignsUnavailable={Boolean(leadsState.campaignsError)}
                canDelete={Boolean(leadsState.context?.canDelete)}
                saving={patchMutation.isPending}
                onClose={() => setSelectedLead(null)}
                onEdit={openEdit}
                onDelete={() => void removeSelectedLead()}
                onLeadChanged={() => void refreshAll()}
                onListChange={(listId) => savePatch({ list_id: listId }, "Lista atualizada.")}
                onNotesSave={(notes) =>
                  savePatch({ notes: notes.trim() || null }, "Anotações salvas.")
                }
                onCampaignAdd={async (campaignId) => {
                  try {
                    await adicionarLeadsCampanha(campaignId, [selectedLead.id]);
                    toast.success("Vínculo com a campanha confirmado.");
                    return true;
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : "Falha ao vincular à campanha.",
                    );
                    return false;
                  }
                }}
                onOpenRedesign={onOpenRedesign}
              />
            </div>
          ) : null}
        </section>
      </main>

      <LeadFormDialog
        open={formOpen}
        lead={editingLead}
        lists={leadsState.lists}
        saving={saveMutation.isPending}
        serverError={saveMutation.error instanceof Error ? saveMutation.error.message : null}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingLead(null);
        }}
        onSubmit={async (values) => {
          try {
            await saveMutation.mutateAsync(values);
          } catch {
            // O erro tipado permanece visível dentro do formulário para correção sem perder dados.
          }
        }}
      />

      <AdvancedFiltersDialog
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        state={leadsState}
      />
      <BulkActionDialog
        type={bulkDialog}
        value={bulkTarget}
        onValueChange={setBulkTarget}
        onOpenChange={(open) => {
          if (!open) setBulkDialog(null);
        }}
        onConfirm={() => void applyBulkAction()}
        options={
          bulkDialog === "assign"
            ? responsibleOptions
            : leadsState.lists.map((list) => ({ id: list.id, label: list.name }))
        }
      />
    </div>
  );
}

function AdvancedFiltersDialog({
  open,
  onOpenChange,
  state,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: ReturnType<typeof useLeadsPremium>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-home-border bg-home-background text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros avançados</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <DateField
            label="Criado a partir de"
            value={state.createdFrom}
            onChange={state.setCreatedFrom}
          />
          <DateField label="Criado até" value={state.createdTo} onChange={state.setCreatedTo} />
          <DateField
            label="Atualizado a partir de"
            value={state.updatedFrom}
            onChange={state.setUpdatedFrom}
          />
          <DateField label="Atualizado até" value={state.updatedTo} onChange={state.setUpdatedTo} />
        </div>
        <p className="text-[11px] text-home-muted">
          Tags não são oferecidas porque o schema atual de leads não possui esse campo.
        </p>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl bg-home-orange px-4 text-xs font-bold text-white"
          >
            Aplicar filtros
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1.5 text-[11px] font-semibold text-home-muted">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange"
      />
    </label>
  );
}

function BulkActionDialog({
  type,
  value,
  options,
  onValueChange,
  onOpenChange,
  onConfirm,
}: {
  type: BulkDialog;
  value: string;
  options: Array<{ id: string; label: string }>;
  onValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(type)} onOpenChange={onOpenChange}>
      <DialogContent className="border-home-border bg-home-background text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {type === "assign" ? "Atribuir selecionados" : "Adicionar selecionados à lista"}
          </DialogTitle>
        </DialogHeader>
        <select
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="h-10 rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none focus:border-home-orange"
        >
          <option value="">Selecione...</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        {!options.length ? (
          <p className="text-xs text-home-muted">Nenhuma opção autorizada está disponível.</p>
        ) : null}
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border border-home-border px-3 text-xs font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!value}
            className="h-9 rounded-xl bg-home-orange px-3 text-xs font-bold text-white disabled:opacity-40"
          >
            Confirmar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
