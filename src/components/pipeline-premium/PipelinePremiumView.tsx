import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import { LeadFormDialog, type LeadFormValues } from "@/components/leads-premium/LeadFormDialog";
import { toLeadItem } from "@/components/leads-premium/leads-premium-data";
import { PerdaDialog } from "@/components/leads/PerdaDialog";
import { createLead, updateLead, type CreateLeadInput, type LeadStatus } from "@/lib/leads-api";
import { atribuirLead } from "@/services/membros";
import { graduarLeadWa } from "@/services/whatsapp";
import { cn } from "@/lib/utils";
import { OpportunityDetailsPanel } from "./OpportunityDetailsPanel";
import { PipelineBoard } from "./PipelineBoard";
import { PipelineFiltersBar } from "./PipelineFiltersBar";
import { PipelineHeader } from "./PipelineHeader";
import { PipelineStatsCards } from "./PipelineStatsCards";
import {
  STAGE_TARGET_STATUS,
  parseLeadStatus,
  statusLabel,
  type OpportunityItem,
  type OpportunityChannel,
  type PipelineFilters,
  type PipelineStageKey,
} from "./pipeline-premium-data";
import { pipelineKeys, usePipelinePremium } from "./usePipelinePremium";

interface PipelinePremiumViewProps {
  user?: { name: string; avatarUrl: string; initials: string };
  unreadNotifications?: number;
  onOpenLead?: (leadId: string) => void;
}

export function PipelinePremiumView({
  user = { name: "Usuário", avatarUrl: "", initials: "US" },
  unreadNotifications = 0,
  onOpenLead,
}: PipelinePremiumViewProps) {
  const queryClient = useQueryClient();
  const pipeline = usePipelinePremium();
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OpportunityItem | null>(null);
  const [createStage, setCreateStage] = useState<PipelineStageKey>("novo");
  const [lossTarget, setLossTarget] = useState<{
    opportunity: OpportunityItem;
    status: "lost" | "nurture";
  } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedOpportunity = selectedId
    ? (pipeline.opportunities.find((item) => item.id === selectedId) ?? null)
    : null;
  const responsibleOptions = useMemo(
    () =>
      pipeline.members.map((member) => ({
        id: member.user_id,
        label: member.nome || member.email,
      })),
    [pipeline.members],
  );

  const saveMutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const input: CreateLeadInput = {
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
        initialStatus: STAGE_TARGET_STATUS[createStage],
      };
      if (!editing) return createLead(input);
      const hasContact = Boolean(input.phone || input.whatsapp || input.email);
      const status = parseLeadStatus(values.status);
      return updateLead(editing.id, {
        business_name: input.business_name,
        owner_name: input.owner_name,
        phone: input.phone,
        whatsapp: input.whatsapp,
        email: input.email,
        website: input.website,
        category: input.category,
        city: input.city,
        state: input.state,
        address: input.address,
        notes: input.notes,
        list_id: input.list_id,
        status,
        ...(status !== "lost" && status !== "nurture"
          ? { motivo_perda: null, motivo_perda_nota: null, perda_em: null }
          : {}),
        sem_contato: !hasContact,
        has_phone: Boolean(input.phone || input.whatsapp),
        has_website: Boolean(input.website),
      });
    },
    onSuccess: async (lead) => {
      setSelectedId(lead.id);
      setFormOpen(false);
      setEditing(null);
      await Promise.all([
        pipeline.refresh(),
        queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(lead.id) }),
        queryClient.invalidateQueries({ queryKey: ["premium-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["premium-lead-metrics"] }),
      ]);
      toast.success(editing ? "Negociação atualizada." : "Lead adicionado ao pipeline.");
    },
  });

  const openCreate = (stage: PipelineStageKey = "novo") => {
    setCreateStage(stage);
    setEditing(null);
    saveMutation.reset();
    setFormOpen(true);
  };
  const openEdit = () => {
    if (!selectedOpportunity) return;
    setEditing(selectedOpportunity);
    saveMutation.reset();
    setFormOpen(true);
  };

  const moveOpportunity = async (
    opportunity: OpportunityItem,
    status: LeadStatus,
  ): Promise<boolean> => {
    if (opportunity.statusValue === status || pipeline.moveMutation.isPending) return false;
    try {
      await pipeline.moveMutation.mutateAsync({
        id: opportunity.id,
        status,
        expectedUpdatedAt: opportunity.updatedAt,
      });
      toast.success(`"${opportunity.company}" movido para ${statusLabel(status)}.`);
      if (status === "responded") {
        try {
          const graduation = await graduarLeadWa(opportunity.id);
          if (graduation.graduou) toast.success("Chip que abriu este lead graduou para conversa.");
        } catch {
          toast.warning("O status foi salvo, mas não foi possível graduar o chip do WhatsApp.");
        }
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao mover a negociação.");
      return false;
    }
  };

  const assignResponsible = async (userId: string): Promise<boolean> => {
    if (!selectedOpportunity || userId === "none") {
      toast.info("A remoção de responsável não possui contrato seguro no serviço atual.");
      return false;
    }
    try {
      const result = await atribuirLead(
        selectedOpportunity.id,
        userId,
        "Reatribuição pelo Pipeline",
      );
      if (!result.ok) throw new Error(result.reason || "Atribuição não autorizada.");
      pipeline.patchCachedLead(selectedOpportunity.id, { assigned_to: userId });
      await pipeline.refresh();
      toast.success("Responsável atualizado.");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar responsável.");
      return false;
    }
  };

  const errorMessage = pipeline.error
    ? pipeline.error instanceof Error
      ? pipeline.error.message
      : "Falha ao carregar o pipeline."
    : null;

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        <PipelineHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedChannel={pipeline.filters.channel}
          onChannelChange={(value) => pipeline.setFilter("channel", parseChannel(value))}
          selectedResponsible={pipeline.filters.responsible}
          onResponsibleChange={(value) => pipeline.setFilter("responsible", value)}
          responsibleOptions={responsibleOptions}
          onNewOpportunity={() => openCreate("novo")}
        />

        <PipelineStatsCards metrics={pipeline.metrics} />

        <PipelineFiltersBar
          searchQuery={pipeline.filters.search}
          onSearchChange={(value) => pipeline.setFilter("search", value)}
          selectedChannel={pipeline.filters.channel}
          onChannelChange={(value) => pipeline.setFilter("channel", parseChannel(value))}
          selectedStage={pipeline.filters.stage}
          onStageChange={(value) => pipeline.setFilter("stage", parseStageFilter(value))}
          selectedResponsible={pipeline.filters.responsible}
          onResponsibleChange={(value) => pipeline.setFilter("responsible", value)}
          responsibleOptions={responsibleOptions}
          selectedScore={pipeline.filters.score}
          onScoreChange={(value) => pipeline.setFilter("score", parseScoreFilter(value))}
          activeFilterCount={pipeline.activeFilterCount}
          onOpenMoreFilters={() => setAdvancedOpen(true)}
          onClearFilters={pipeline.clearFilters}
        />

        <section
          className={cn(
            "grid items-start gap-4",
            selectedOpportunity
              ? "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] 2xl:grid-cols-[1fr_420px]"
              : "grid-cols-1",
          )}
        >
          <div className="min-w-0">
            {pipeline.loading ? (
              <PipelineState
                icon={<Loader2 className="size-4 animate-spin" />}
                text="Carregando pipeline..."
              />
            ) : errorMessage ? (
              <PipelineState
                icon={<RefreshCw className="size-4" />}
                text={errorMessage}
                action="Tentar novamente"
                onAction={() => void pipeline.refresh()}
              />
            ) : pipeline.filteredOpportunities.length === 0 ? (
              <PipelineState
                text={
                  pipeline.opportunities.length
                    ? "Nenhum resultado para os filtros selecionados."
                    : "Seu pipeline ainda não possui leads."
                }
                action={pipeline.activeFilterCount ? "Limpar filtros" : "Adicionar lead"}
                onAction={
                  pipeline.activeFilterCount ? pipeline.clearFilters : () => openCreate("novo")
                }
              />
            ) : (
              <div className="relative">
                {pipeline.refreshing ? (
                  <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-lg bg-home-surface px-2 py-1 text-[10px] text-home-muted">
                    <Loader2 className="size-3 animate-spin" /> Atualizando
                  </span>
                ) : null}
                <PipelineBoard
                  stages={pipeline.stages}
                  opportunities={pipeline.filteredOpportunities}
                  selectedOpportunityId={selectedId}
                  onSelectOpportunity={(opportunity) => setSelectedId(opportunity.id)}
                  onAddLead={openCreate}
                  onMoveOpportunity={(opportunity, stage) =>
                    void moveOpportunity(opportunity, STAGE_TARGET_STATUS[stage])
                  }
                  movingOpportunityId={pipeline.moveMutation.variables?.id ?? null}
                />
              </div>
            )}
          </div>

          {selectedOpportunity ? (
            <>
              <button
                type="button"
                aria-label="Fechar detalhes da oportunidade"
                onClick={() => setSelectedId(null)}
                className="fixed inset-0 z-30 bg-black/60 lg:hidden"
              />
              <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85svh] min-w-0 overflow-y-auto px-3 pb-3 lg:sticky lg:inset-auto lg:top-5 lg:z-auto lg:max-h-none lg:overflow-visible lg:p-0">
                <OpportunityDetailsPanel
                  key={selectedOpportunity.id}
                  opportunity={selectedOpportunity}
                  members={pipeline.members}
                  supportingDataUnavailable={Boolean(pipeline.supportingDataError)}
                  saving={pipeline.moveMutation.isPending}
                  onClose={() => setSelectedId(null)}
                  onEdit={openEdit}
                  onStatusChange={(status) => moveOpportunity(selectedOpportunity, status)}
                  onResponsibleChange={assignResponsible}
                  onRequestLoss={(status) =>
                    setLossTarget({ opportunity: selectedOpportunity, status })
                  }
                  onOpenLead={onOpenLead}
                />
              </div>
            </>
          ) : null}
        </section>
      </main>

      <LeadFormDialog
        open={formOpen}
        lead={editing ? toLeadItem(editing.record) : null}
        lists={pipeline.lists}
        saving={saveMutation.isPending}
        serverError={saveMutation.error instanceof Error ? saveMutation.error.message : null}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={async (values) => {
          try {
            await saveMutation.mutateAsync(values);
          } catch (error) {
            if (!(error instanceof Error)) toast.error("Falha inesperada ao salvar a negociação.");
          }
        }}
      />

      {lossTarget ? (
        <PerdaDialog
          lead={lossTarget.opportunity.record}
          alvoStatus={lossTarget.status}
          open
          onOpenChange={(open) => !open && setLossTarget(null)}
          onCancelar={() => setLossTarget(null)}
          onConfirmado={(patch) => {
            pipeline.patchCachedLead(lossTarget.opportunity.id, patch);
            setLossTarget(null);
            void pipeline.refresh();
          }}
        />
      ) : null}

      <AdvancedFiltersDialog
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        createdFrom={pipeline.filters.createdFrom}
        createdTo={pipeline.filters.createdTo}
        onCreatedFromChange={(value) => pipeline.setFilter("createdFrom", value)}
        onCreatedToChange={(value) => pipeline.setFilter("createdTo", value)}
        onClear={() => {
          pipeline.setFilter("createdFrom", "");
          pipeline.setFilter("createdTo", "");
        }}
      />
    </div>
  );
}

function parseStage(stage: string): PipelineStageKey {
  switch (stage) {
    case "novo":
    case "contato":
    case "qualificacao":
    case "proposta":
    case "negociacao":
    case "fechado":
      return stage;
    default:
      throw new Error(`Etapa não suportada: ${stage}`);
  }
}

function parseStageFilter(stage: string): PipelineFilters["stage"] {
  if (stage === "all") return stage;
  return parseStage(stage);
}

function parseChannel(channel: string): "all" | OpportunityChannel {
  switch (channel) {
    case "all":
    case "maps":
    case "instagram":
    case "linkedin":
    case "manual":
      return channel;
    default:
      throw new Error(`Origem não suportada: ${channel}`);
  }
}

function parseScoreFilter(score: string): PipelineFilters["score"] {
  switch (score) {
    case "all":
    case "high":
    case "medium":
    case "qualification":
      return score;
    default:
      throw new Error(`Filtro de score não suportado: ${score}`);
  }
}

function PipelineState({
  icon,
  text,
  action,
  onAction,
}: {
  icon?: ReactNode;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-home-border bg-home-surface/40 p-8 text-center text-sm text-home-muted">
      <span className="inline-flex items-center gap-2">
        {icon}
        {text}
      </span>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl border border-home-border bg-home-surface px-3 py-2 text-xs font-semibold text-white hover:bg-home-surface-strong"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function AdvancedFiltersDialog({
  open,
  onOpenChange,
  createdFrom,
  createdTo,
  onCreatedFromChange,
  onCreatedToChange,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdFrom: string;
  createdTo: string;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-home-border bg-home-background text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros por período</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-home-muted">
            Criado a partir de
            <input
              type="date"
              value={createdFrom}
              onChange={(event) => onCreatedFromChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-home-border bg-home-surface px-3 text-white"
            />
          </label>
          <label className="space-y-1 text-xs text-home-muted">
            Criado até
            <input
              type="date"
              value={createdTo}
              onChange={(event) => onCreatedToChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-home-border bg-home-surface px-3 text-white"
            />
          </label>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClear}
            className="h-9 rounded-xl border border-home-border px-3 text-xs font-semibold"
          >
            Limpar período
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl bg-home-orange px-3 text-xs font-bold text-white"
          >
            Aplicar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
