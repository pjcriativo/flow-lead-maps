import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  LEAD_STATUSES,
  getLeadWorkspaceContext,
  updateLeadStatus,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-api";
import { listarListas } from "@/lib/lists-api";
import {
  PIPELINE_PAGE_SIZE,
  cursorOf,
  fetchPipelineCounts,
  fetchPipelineStagePage,
  fetchProposalLeadStatuses,
  type PipelineCursor,
  type PipelineStagePage,
  type PipelineStatusCounts,
} from "@/lib/pipeline-query";
import { listarMembrosDaOrg } from "@/services/membros";
import { listarPropostas } from "@/services/propostas";
import {
  PIPELINE_STAGE_DEFINITIONS,
  STAGE_STATUSES,
  buildPipelineMetricsFromTotals,
  buildPipelineStagesFromTotals,
  latestProposalValues,
  parseLeadStatus,
  stageForStatus,
  sumStageValues,
  toOpportunity,
  type OpportunityChannel,
  type OpportunityItem,
  type PipelineFilters,
  type PipelineStageKey,
} from "./pipeline-premium-data";

export const pipelineKeys = {
  all: ["pipeline"] as const,
  stages: () => [...pipelineKeys.all, "stage"] as const,
  stage: (stage: PipelineStageKey, filters: PipelineFilters) =>
    [...pipelineKeys.stages(), stage, filters] as const,
  countsAll: () => [...pipelineKeys.all, "counts"] as const,
  counts: (filters: PipelineFilters) => [...pipelineKeys.countsAll(), filters] as const,
  proposals: () => [...pipelineKeys.all, "proposals"] as const,
  proposalLeads: (stamp: number, filters: PipelineFilters | null) =>
    [...pipelineKeys.all, "proposal-leads", stamp, filters] as const,
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

type StageData = InfiniteData<PipelineStagePage>;

/** Mantém o texto da busca na tela imediato, mas só consulta o banco quando a digitação pausa. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function useStageFeed(stage: PipelineStageKey, filters: PipelineFilters) {
  return useInfiniteQuery({
    queryKey: pipelineKeys.stage(stage, filters),
    queryFn: ({ pageParam }) => fetchPipelineStagePage(stage, filters, pageParam),
    initialPageParam: null as PipelineCursor | null,
    getNextPageParam: (last) => {
      const tail = last.items.at(-1);
      return last.hasMore && tail ? cursorOf(tail) : undefined;
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export interface StageFeed {
  opportunities: OpportunityItem[];
  total: number;
  /** A contagem do banco ainda está a caminho (os cards costumam chegar antes). */
  countLoading: boolean;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
}

function flattenLeads(data: StageData | undefined): Lead[] {
  if (!data) return [];
  const seen = new Set<string>();
  const leads: Lead[] = [];
  for (const page of data.pages) {
    for (const lead of page.items) {
      if (seen.has(lead.id)) continue;
      seen.add(lead.id);
      leads.push(lead);
    }
  }
  return leads;
}

function sumCounts(counts: PipelineStatusCounts | undefined, statuses: readonly LeadStatus[]) {
  return statuses.reduce((sum, status) => sum + (counts?.[status] ?? 0), 0);
}

/** Total de uma etapa para os filtros atuais, a partir da contagem do banco (não dos cards carregados). */
function stageCount(
  counts: PipelineStatusCounts | undefined,
  stage: PipelineStageKey,
  filters: PipelineFilters,
): number {
  if (filters.stage !== "all" && filters.stage !== stage) return 0;
  return sumCounts(counts, STAGE_STATUSES[stage]);
}

function moveCount(
  counts: PipelineStatusCounts | undefined,
  from: LeadStatus,
  to: LeadStatus,
): PipelineStatusCounts | undefined {
  if (!counts || from === to) return counts;
  return {
    ...counts,
    [from]: Math.max(0, (counts[from] ?? 0) - 1),
    [to]: (counts[to] ?? 0) + 1,
  };
}

function useStageOpportunities(
  data: StageData | undefined,
  context: {
    memberNames: ReadonlyMap<string, string>;
    proposalValues: ReadonlyMap<string, number | null>;
    available: boolean;
  },
): OpportunityItem[] {
  const { memberNames, proposalValues, available } = context;
  return useMemo(
    () =>
      flattenLeads(data).map((lead) =>
        toOpportunity(
          lead,
          proposalValues.get(lead.id) ?? null,
          lead.assigned_to
            ? (memberNames.get(lead.assigned_to) ?? "Responsável não identificado")
            : "Sem responsável",
          available,
        ),
      ),
    [data, memberNames, proposalValues, available],
  );
}

export function usePipelinePremium() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PipelineFilters>(EMPTY_FILTERS);
  const debouncedSearch = useDebounced(filters.search, 300);
  const serverFilters = useMemo<PipelineFilters>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );
  const filtersActive = useMemo(
    () => JSON.stringify(serverFilters) !== JSON.stringify(EMPTY_FILTERS),
    [serverFilters],
  );

  const feeds = {
    novo: useStageFeed("novo", serverFilters),
    contato: useStageFeed("contato", serverFilters),
    qualificacao: useStageFeed("qualificacao", serverFilters),
    proposta: useStageFeed("proposta", serverFilters),
    negociacao: useStageFeed("negociacao", serverFilters),
    fechado: useStageFeed("fechado", serverFilters),
  } satisfies Record<PipelineStageKey, ReturnType<typeof useStageFeed>>;

  // Contagens por status em uma só passada. Sem filtros as duas consultas têm a mesma chave e viram uma.
  const countsQuery = useQuery({
    queryKey: pipelineKeys.counts(serverFilters),
    queryFn: () => fetchPipelineCounts(serverFilters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  const allCountsQuery = useQuery({
    queryKey: pipelineKeys.counts(EMPTY_FILTERS),
    queryFn: () => fetchPipelineCounts(EMPTY_FILTERS),
    staleTime: 30_000,
  });
  const totals = useMemo(
    () => ({
      total: sumCounts(allCountsQuery.data, LEAD_STATUSES),
      negotiation: sumCounts(allCountsQuery.data, ["responded", "meeting"]),
      won: sumCounts(allCountsQuery.data, ["won"]),
    }),
    [allCountsQuery.data],
  );
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

  // Status dos leads que têm proposta: sem filtro (KPIs e universo autorizado) e com filtro (valor
  // por etapa). Só esses leads importam para somar valores, então nunca baixamos o conjunto todo.
  const proposalLeadIds = useMemo(
    () => (proposalsQuery.data ?? []).map((proposal) => proposal.lead_id),
    [proposalsQuery.data],
  );
  const stamp = proposalsQuery.dataUpdatedAt;
  const allStatusQuery = useQuery({
    queryKey: pipelineKeys.proposalLeads(stamp, null),
    queryFn: () => fetchProposalLeadStatuses(proposalLeadIds, null),
    enabled: proposalsQuery.isSuccess,
    staleTime: 30_000,
  });
  const filteredStatusQuery = useQuery({
    queryKey: pipelineKeys.proposalLeads(stamp, serverFilters),
    queryFn: () => fetchProposalLeadStatuses(proposalLeadIds, serverFilters),
    enabled: proposalsQuery.isSuccess && filtersActive,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const proposalDataAvailable = proposalsQuery.isSuccess && allStatusQuery.isSuccess;
  const allStatuses = allStatusQuery.data;
  const stageStatuses = filtersActive ? filteredStatusQuery.data : allStatuses;
  const proposals = useMemo(
    () =>
      allStatuses
        ? (proposalsQuery.data ?? []).filter((proposal) => allStatuses.has(proposal.lead_id))
        : [],
    [allStatuses, proposalsQuery.data],
  );
  const proposalValues = useMemo(() => latestProposalValues(proposals), [proposals]);
  const memberNames = useMemo(
    () =>
      new Map(
        (membersQuery.data ?? []).map((member) => [member.user_id, member.nome || member.email]),
      ),
    [membersQuery.data],
  );

  // Cada etapa só reprocessa os próprios cards quando os próprios dados (ou valores) mudam.
  const names = { memberNames, proposalValues, available: proposalDataAvailable };
  const byStage = {
    novo: useStageOpportunities(feeds.novo.data, names),
    contato: useStageOpportunities(feeds.contato.data, names),
    qualificacao: useStageOpportunities(feeds.qualificacao.data, names),
    proposta: useStageOpportunities(feeds.proposta.data, names),
    negociacao: useStageOpportunities(feeds.negociacao.data, names),
    fechado: useStageOpportunities(feeds.fechado.data, names),
  } satisfies Record<PipelineStageKey, OpportunityItem[]>;

  const stageFeeds = Object.fromEntries(
    PIPELINE_STAGE_DEFINITIONS.map(({ key }) => {
      const query = feeds[key];
      const feed: StageFeed = {
        opportunities: byStage[key],
        total: stageCount(countsQuery.data, key, serverFilters),
        countLoading: countsQuery.isPending,
        loading: query.isPending,
        loadingMore: query.isFetchingNextPage,
        hasMore: Boolean(query.hasNextPage),
        error: query.error,
        loadMore: () => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        },
      };
      return [key, feed];
    }),
  ) as Record<PipelineStageKey, StageFeed>;

  const opportunities = useMemo(
    () => PIPELINE_STAGE_DEFINITIONS.flatMap(({ key }) => byStage[key]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      byStage.novo,
      byStage.contato,
      byStage.qualificacao,
      byStage.proposta,
      byStage.negociacao,
      byStage.fechado,
    ],
  );

  const stageTotals = Object.fromEntries(
    PIPELINE_STAGE_DEFINITIONS.map(({ key }) => [key, stageFeeds[key].total]),
  ) as Record<PipelineStageKey, number>;
  const stageValues = useMemo(
    () => sumStageValues(stageStatuses ?? new Map(), proposalValues),
    [stageStatuses, proposalValues],
  );
  const stages = buildPipelineStagesFromTotals(
    stageTotals,
    stageValues,
    proposalDataAvailable && !(filtersActive && !filteredStatusQuery.data),
  );
  const filteredTotal = PIPELINE_STAGE_DEFINITIONS.reduce(
    (sum, { key }) => sum + stageTotals[key],
    0,
  );
  const metrics = useMemo(
    () =>
      buildPipelineMetricsFromTotals(
        totals,
        proposals,
        allStatuses ?? new Map(),
        proposalDataAvailable,
      ),
    [allStatuses, proposalDataAvailable, proposals, totals],
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
      await queryClient.cancelQueries({ queryKey: pipelineKeys.stages() });
      const previous = queryClient.getQueriesData<StageData>({ queryKey: pipelineKeys.stages() });
      const target = stageForStatus(status);
      const previousCounts = queryClient.getQueriesData<PipelineStatusCounts>({
        queryKey: pipelineKeys.countsAll(),
      });
      let moved: Lead | undefined;
      for (const [, data] of previous) {
        moved ??= data?.pages.flatMap((page) => page.items).find((lead) => lead.id === id);
      }
      for (const [key, data] of previous) {
        if (!data) continue;
        const stage = key[2] as PipelineStageKey;
        // Só a visão atual é ajustada; as de outros filtros são refeitas ao invalidar.
        if (JSON.stringify(key[3]) !== JSON.stringify(serverFilters)) continue;
        const had = data.pages.some((page) => page.items.some((lead) => lead.id === id));
        if (stage !== target && !had) continue;
        queryClient.setQueryData<StageData>(key, {
          ...data,
          pages: data.pages.map((page, index) => ({
            ...page,
            items:
              stage === target
                ? index === 0 && moved
                  ? [{ ...moved, status }, ...page.items.filter((lead) => lead.id !== id)]
                  : page.items
                : page.items.filter((lead) => lead.id !== id),
          })),
        });
      }
      // Contagens das duas etapas acompanham o card na hora (a do banco confirma em seguida).
      if (moved) {
        const from = parseLeadStatus(moved.status);
        for (const filtersKey of [serverFilters, EMPTY_FILTERS]) {
          queryClient.setQueryData<PipelineStatusCounts>(
            pipelineKeys.counts(filtersKey),
            (current) => moveCount(current, from, status),
          );
        }
      }
      return { previous, previousCounts };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data);
      for (const [key, data] of context?.previousCounts ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pipelineKeys.stages() }),
        queryClient.invalidateQueries({ queryKey: pipelineKeys.countsAll() }),
        queryClient.invalidateQueries({ queryKey: pipelineKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: ["premium-leads"] }),
        queryClient.invalidateQueries({ queryKey: ["premium-lead-metrics"] }),
      ]);
    },
  });

  const patchCachedLead = (id: string, patch: Partial<Lead>) => {
    queryClient.setQueriesData<StageData>({ queryKey: pipelineKeys.stages() }, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
            })),
          }
        : current,
    );
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pipelineKeys.stages() }),
      queryClient.invalidateQueries({ queryKey: pipelineKeys.countsAll() }),
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

  const stageError = PIPELINE_STAGE_DEFINITIONS.map(({ key }) => stageFeeds[key].error).find(
    Boolean,
  );

  return {
    opportunities,
    stageFeeds,
    stages,
    metrics,
    filteredTotal,
    empty: countsQuery.isSuccess && filteredTotal === 0 && opportunities.length === 0,
    totalLeads: allCountsQuery.data ? totals.total : null,
    pageSize: PIPELINE_PAGE_SIZE,
    members: membersQuery.data ?? [],
    lists: listsQuery.data ?? [],
    filters,
    setFilter,
    clearFilters: () => setFilters(EMPTY_FILTERS),
    activeFilterCount,
    moveMutation,
    patchCachedLead,
    refresh,
    loading: PIPELINE_STAGE_DEFINITIONS.every(({ key }) => stageFeeds[key].loading),
    refreshing: PIPELINE_STAGE_DEFINITIONS.some(
      ({ key }) => feeds[key].isFetching && !feeds[key].isFetchingNextPage,
    ),
    error: stageError ?? countsQuery.error,
    proposalsError: proposalsQuery.error,
    supportingDataError: membersQuery.error ?? listsQuery.error,
  };
}

export type PipelineChannelFilter = "all" | OpportunityChannel;
export type PipelineStageFilter = "all" | PipelineStageKey;
