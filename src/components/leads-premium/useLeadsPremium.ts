import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLeadMetrics,
  fetchLeadsPage,
  getLeadWorkspaceContext,
  type LeadPageFilters,
  type LeadSortField,
} from "@/lib/leads-api";
import { listarListas } from "@/lib/lists-api";
import { listarCampanhas } from "@/services/campanhas";
import { listarMembrosDaOrg } from "@/services/membros";
import { metricsFromCounts, toLeadItem } from "./leads-premium-data";

const PAGE_SIZE = 10;

export function useLeadsPremium() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedList, setSelectedList] = useState("all");
  const [selectedScore, setSelectedScore] = useState("all");
  const [selectedResponsible, setSelectedResponsible] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const [sortBy, setSortBy] = useState<LeadSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filters = useMemo<LeadPageFilters>(
    () => ({
      search: debouncedSearch || undefined,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      source:
        selectedChannel === "all"
          ? undefined
          : (selectedChannel as NonNullable<LeadPageFilters["source"]>),
      score:
        selectedScore === "all"
          ? undefined
          : (selectedScore as NonNullable<LeadPageFilters["score"]>),
      listId: selectedList === "all" ? undefined : selectedList,
      assignedTo: selectedResponsible === "all" ? undefined : selectedResponsible,
      createdFrom: createdFrom ? new Date(`${createdFrom}T00:00:00`).toISOString() : undefined,
      createdTo: createdTo ? new Date(`${createdTo}T23:59:59.999`).toISOString() : undefined,
      updatedFrom: updatedFrom ? new Date(`${updatedFrom}T00:00:00`).toISOString() : undefined,
      updatedTo: updatedTo ? new Date(`${updatedTo}T23:59:59.999`).toISOString() : undefined,
    }),
    [
      debouncedSearch,
      createdFrom,
      createdTo,
      selectedChannel,
      selectedList,
      selectedResponsible,
      selectedScore,
      selectedStatus,
      updatedFrom,
      updatedTo,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, sortDirection]);

  const leadsQuery = useQuery({
    queryKey: ["premium-leads", page, PAGE_SIZE, filters, sortBy, sortDirection] as const,
    queryFn: () => fetchLeadsPage({ page, pageSize: PAGE_SIZE, filters, sortBy, sortDirection }),
    placeholderData: (previous) => previous,
  });
  const metricsQuery = useQuery({
    queryKey: ["premium-lead-metrics"],
    queryFn: fetchLeadMetrics,
  });
  const listsQuery = useQuery({
    queryKey: ["lead-lists"],
    queryFn: listarListas,
  });
  const contextQuery = useQuery({
    queryKey: ["lead-workspace-context"],
    queryFn: getLeadWorkspaceContext,
  });
  const membersQuery = useQuery({
    queryKey: ["lead-workspace-members", contextQuery.data?.orgId],
    queryFn: () => {
      const orgId = contextQuery.data?.orgId;
      if (!orgId) throw new Error("Workspace não disponível para listar responsáveis.");
      return listarMembrosDaOrg(orgId);
    },
    enabled: Boolean(contextQuery.data?.orgId),
  });
  const campaignsQuery = useQuery({
    queryKey: ["lead-campaign-options"],
    queryFn: async () => {
      const [email, whatsapp] = await Promise.all([
        listarCampanhas("email"),
        listarCampanhas("whatsapp"),
      ]);
      return [
        ...email.map((campaign) => ({
          id: campaign.id,
          label: `${campaign.nome} · E-mail`,
          active: campaign.status === "ativa",
        })),
        ...whatsapp.map((campaign) => ({
          id: campaign.id,
          label: `${campaign.nome} · WhatsApp`,
          active: campaign.status === "ativa",
        })),
      ];
    },
  });

  const activeFilterCount = [
    searchQuery.trim(),
    selectedChannel !== "all",
    selectedStatus !== "all",
    selectedList !== "all",
    selectedScore !== "all",
    selectedResponsible !== "all",
    createdFrom,
    createdTo,
    updatedFrom,
    updatedTo,
  ].filter(Boolean).length;

  const total = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const leads = useMemo(
    () => (leadsQuery.data?.leads ?? []).map(toLeadItem),
    [leadsQuery.data?.leads],
  );
  const metrics = metricsQuery.data
    ? metricsFromCounts(metricsQuery.data)
    : metricsFromCounts({
        total: 0,
        contacted: 0,
        opportunities: 0,
        proposals: 0,
        customers: 0,
      }).map((metric) => ({ ...metric, value: "—" }));

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedChannel("all");
    setSelectedStatus("all");
    setSelectedList("all");
    setSelectedScore("all");
    setSelectedResponsible("all");
    setCreatedFrom("");
    setCreatedTo("");
    setUpdatedFrom("");
    setUpdatedTo("");
  };

  const toggleCreatedAtSort = () => {
    if (sortBy === "created_at")
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
    else {
      setSortBy("created_at");
      setSortDirection("desc");
    }
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["premium-leads"] }),
      queryClient.invalidateQueries({ queryKey: ["premium-lead-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["lead-lists"] }),
    ]);
  };

  return {
    page,
    setPage,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
    leads,
    metrics,
    lists: listsQuery.data ?? [],
    members: membersQuery.data ?? [],
    campaigns: campaignsQuery.data?.filter((campaign) => campaign.active) ?? [],
    context: contextQuery.data,
    filters,
    searchQuery,
    setSearchQuery,
    selectedChannel,
    setSelectedChannel,
    selectedStatus,
    setSelectedStatus,
    selectedList,
    setSelectedList,
    selectedScore,
    setSelectedScore,
    selectedResponsible,
    setSelectedResponsible,
    createdFrom,
    setCreatedFrom,
    createdTo,
    setCreatedTo,
    updatedFrom,
    setUpdatedFrom,
    updatedTo,
    setUpdatedTo,
    activeFilterCount,
    clearFilters,
    sortBy,
    sortDirection,
    toggleCreatedAtSort,
    loading: leadsQuery.isLoading,
    refreshing: leadsQuery.isFetching,
    error: leadsQuery.error,
    metricsLoading: metricsQuery.isLoading,
    metricsError: metricsQuery.error,
    campaignsError: campaignsQuery.error,
    refresh,
  };
}
