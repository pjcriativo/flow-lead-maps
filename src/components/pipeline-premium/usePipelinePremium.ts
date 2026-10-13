import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeads,
  getLeadWorkspaceContext,
  updateLeadStatus,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-api";
import { listarListas } from "@/lib/lists-api";
import { listarMembrosDaOrg } from "@/services/membros";
import { listarPropostas } from "@/services/propostas";
import {
  buildPipelineMetrics,
  buildPipelineStages,
  filterOpportunities,
  latestProposalValues,
  moveLeadInCache,
  proposalsForLeads,
  toOpportunity,
  type OpportunityChannel,
  type PipelineFilters,
  type PipelineStageKey,
} from "./pipeline-premium-data";

export const pipelineKeys = {
  all: ["pipeline"] as const,
  leads: () => [...pipelineKeys.all, "leads"] as const,
  proposals: () => [...pipelineKeys.all, "proposals"] as const,
  context: () => [...pipelineKeys.all, "context"] as const,
  members: (orgId: string | undefined) => [...pipelineKeys.all, "members", orgId] as const,
  details: () => [...pipelineKeys.all, "details"] as const,
  detail: (leadId: string | undefined) => [...pipelineKeys.details(), leadId] as const,
};

const EMPTY_FILTERS: PipelineFilters = {
  search: "",
  channel: "all",
  stage: "all",
  responsible: "all",
  score: "all",
  createdFrom: "",
  createdTo: "",
};

export function usePipelinePremium() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_FILTERS);

  const leadsQuery = useQuery({
    queryKey: pipelineKeys.leads(),
    queryFn: fetchLeads,
    staleTime: 30_000,
  });
  const proposalsQuery = useQuery({
    queryKey: pipelineKeys.proposals(),
    queryFn: listarPropostas,
    staleTime: 30_000,
  });
  const contextQuery = useQuery({
    queryKey: pipelineKeys.context(),
    queryFn: getLeadWorkspaceContext,
    staleTime: 5 * 60_000,
  });
  const membersQuery = useQuery({
    queryKey: pipelineKeys.members(contextQuery.data?.orgId),
    queryFn: () => {
      const orgId = contextQuery.data?.orgId;
      if (!orgId) throw new Error("Workspace não disponível para listar responsáveis.");
      return listarMembrosDaOrg(orgId);
    },
    enabled: Boolean(contextQuery.data?.orgId),
    staleTime: 60_000,
  });
  const listsQuery = useQuery({
    queryKey: ["lead-lists"],
    queryFn: listarListas,
    staleTime: 60_000,
  });

  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const proposalDataAvailable = proposalsQuery.isSuccess;
  const proposals = useMemo(
    () => proposalsForLeads(proposalsQuery.data ?? [], leads),
    [leads, proposalsQuery.data],
  );
  const proposalValues = useMemo(() => latestProposalValues(proposals), [proposals]);
  const memberNames = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((member) => [member.user_id, member.nome || member.email]),
      ),
    [membersQuery.data],
  );
  const opportunities = useMemo(
    () =>
      leads.map((lead) =>
        toOpportunity(
          lead,
          proposalValues.get(lead.id) ?? null,
          lead.assigned_to
            ? (memberNames.get(lead.assigned_to) ?? "Responsável não identificado")
            : "Sem responsável",
          proposalDataAvailable,
        ),
      ),
    [leads, memberNames, proposalDataAvailable, proposalValues],
  );
  const filteredOpportunities = useMemo(
    () => filterOpportunities(opportunities, filters),
    [filters, opportunities],
  );
  const stages = useMemo(
    () => buildPipelineStages(filteredOpportunities, proposalDataAvailable),
    [filteredOpportunities, proposalDataAvailable],
  );
  const metrics = useMemo(
    () => buildPipelineMetrics(leads, proposals, proposalDataAvailable),
    [leads, proposalDataAvailable, proposals],
  );

  const moveMutation = useMutation({
    mutationKey: ["pipeline", "move-lead"],
    mutationFn: ({
      id,
      status,
      expectedUpdatedAt,
    }: {
      id: string;
      status: LeadStatus;
      expectedUpdatedAt: string;
    }) => updateLeadStatus(id, status, expectedUpdatedAt),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: pipelineKeys.leads() });
      const previous = queryClient.getQueryData<Lead[]>(pipelineKeys.leads());
      queryClient.setQueryData<Lead[]>(pipelineKeys.leads(), (current) =>
        current ? moveLeadInCache(current, id, status) : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(pipelineKeys.leads(), context.previous);
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pipelineKeys.leads() }),
        queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: ["premium-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["premium-lead-metrics"] }),
      ]);
    },
  });

  const patchCachedLead = (id: string, patch: Partial<Lead>) => {
    queryClient.setQueryData<Lead[]>(pipelineKeys.leads(), (current) =>
      current?.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    );
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pipelineKeys.leads() }),
      queryClient.invalidateQueries({ queryKey: pipelineKeys.proposals() }),
      queryClient.invalidateQueries({ queryKey: ["premium-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["premium-lead-metrics"] }),
    ]);
  };

  const setFilter = <Key extends keyof PipelineFilters>(key: Key, value: PipelineFilters[Key]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search" || key === "createdFrom" || key === "createdTo") return Boolean(value);
    return value !== "all";
  }).length;

  return {
    leads,
    opportunities,
    filteredOpportunities,
    stages,
    metrics,
    proposals,
    members: membersQuery.data ?? [],
    lists: listsQuery.data ?? [],
    filters,
    setFilter,
    clearFilters: () => setFilters(EMPTY_FILTERS),
    activeFilterCount,
    moveMutation,
    patchCachedLead,
    refresh,
    loading: leadsQuery.isLoading,
    refreshing: leadsQuery.isFetching,
    error: leadsQuery.error,
    proposalsError: proposalsQuery.error,
    supportingDataError: membersQuery.error ?? listsQuery.error,
  };
}

export type PipelineChannelFilter = "all" | OpportunityChannel;
export type PipelineStageFilter = "all" | PipelineStageKey;
