// Hook de Gestão de Estado da Central de Listas Premium
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listarListas,
  fetchLeadsDaLista,
  renomearLista,
  excluirLista,
  type LeadListComStats,
} from "@/lib/lists-api";
import type { Lead } from "@/lib/leads-api";
import {
  deriveListStatus,
  formatTimeAgo,
  getNicheThumbnail,
  type CampanhaComCanal,
  type LeadListWithFullStats,
} from "./listas-premium-data";
import { calculateListKpis } from "./listas-premium-metrics";

export interface ListasFilterState {
  search: string;
  fonte: string;
  nicho: string;
  cidade: string;
  status: string;
  ordenarPor: "recentes" | "maior_leads" | "alfabetico";
}

export function useListasPremium() {
  const [listas, setListas] = useState<LeadListWithFullStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lista selecionada
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [linkedCampaigns, setLinkedCampaigns] = useState<CampanhaComCanal[]>([]);

  // Filtros
  const [filters, setFilters] = useState<ListasFilterState>({
    search: "",
    fonte: "todas",
    nicho: "todos",
    cidade: "todas",
    status: "todos",
    ordenarPor: "recentes",
  });

  // Carrega todas as listas com dados reais e contagens vinculadas
  const carregarListas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listasBase, campanhasRes, leadsContatoRes] = await Promise.all([
        listarListas(),
        supabase.from("campanhas").select("id, list_id, nome, status, canal, criada_em"),
        supabase.from("leads").select("list_id, phone, email, whatsapp, website, instagram_url"),
      ]);

      if (campanhasRes.error) throw campanhasRes.error;
      if (leadsContatoRes.error) throw leadsContatoRes.error;

      // Mapeamento de contatos válidos por list_id
      const contatosPorLista = new Map<string, number>();
      for (const lead of leadsContatoRes.data ?? []) {
        if (!lead.list_id) continue;
        const temContato = Boolean(
          lead.phone || lead.email || lead.whatsapp || lead.website || lead.instagram_url,
        );
        if (temContato) {
          contatosPorLista.set(lead.list_id, (contatosPorLista.get(lead.list_id) ?? 0) + 1);
        }
      }

      // Mapeamento de campanhas por list_id
      const campanhasPorLista = new Map<string, number>();
      for (const camp of campanhasRes.data ?? []) {
        if (!camp.list_id) continue;
        campanhasPorLista.set(camp.list_id, (campanhasPorLista.get(camp.list_id) ?? 0) + 1);
      }

      const formatadas: LeadListWithFullStats[] = listasBase.map((item) => {
        const campanhasCount = campanhasPorLista.get(item.id) ?? 0;
        const comContato = contatosPorLista.get(item.id) ?? 0;
        const taxa = item.leads_atuais > 0 ? Math.round((comContato / item.leads_atuais) * 100) : 0;

        return {
          ...item,
          com_contato_count: comContato,
          taxa_contato: taxa,
          status: deriveListStatus(item),
          thumbnail_url: getNicheThumbnail(item.niche, item.name),
          campanhas_count: campanhasCount,
          last_activity_text: formatTimeAgo(item.created_at),
        };
      });

      setListas(formatadas);

      // Se nenhuma lista estiver selecionada ou se a selecionada não existe mais, seleciona a primeira
      if (formatadas.length > 0) {
        setSelectedListId((curr) => {
          if (curr && formatadas.some((l) => l.id === curr)) return curr;
          return formatadas[0].id;
        });
      } else {
        setSelectedListId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar biblioteca de listas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarListas();
  }, [carregarListas]);

  // Lista selecionada atual
  const selectedList = useMemo(() => {
    return listas.find((l) => l.id === selectedListId) ?? null;
  }, [listas, selectedListId]);

  // Carrega leads e campanhas da lista selecionada
  useEffect(() => {
    if (!selectedListId) {
      setSelectedLeads([]);
      setLinkedCampaigns([]);
      return;
    }

    let ativo = true;
    setLeadsLoading(true);

    Promise.all([
      fetchLeadsDaLista(selectedListId),
      supabase
        .from("campanhas")
        .select("id, list_id, nome, status, canal, criada_em")
        .eq("list_id", selectedListId)
        .order("criada_em", { ascending: false }),
    ])
      .then(async ([leadsData, campanhasData]) => {
        if (!ativo) return;
        if (campanhasData.error) throw campanhasData.error;

        const campaignIds = (campanhasData.data ?? []).map((campaign) => campaign.id);
        const campaignLeadCounts = new Map<
          string,
          Pick<
            CampanhaComCanal,
            "total" | "pendente" | "rascunho" | "aprovado" | "enviado" | "descartado" | "erro"
          >
        >();

        if (campaignIds.length > 0) {
          const { data: campaignLeads, error: campaignLeadsError } = await supabase
            .from("campanha_leads")
            .select("campanha_id, estado")
            .in("campanha_id", campaignIds);
          if (campaignLeadsError) throw campaignLeadsError;

          for (const campaignLead of campaignLeads ?? []) {
            const current = campaignLeadCounts.get(campaignLead.campanha_id) ?? {
              total: 0,
              pendente: 0,
              rascunho: 0,
              aprovado: 0,
              enviado: 0,
              descartado: 0,
              erro: 0,
            };
            current.total += 1;
            const state = campaignLead.estado === "gerando" ? "pendente" : campaignLead.estado;
            if (state in current) {
              current[state as keyof typeof current] += 1;
            }
            campaignLeadCounts.set(campaignLead.campanha_id, current);
          }
        }

        if (!ativo) return;
        setSelectedLeads(leadsData);
        const camps = (campanhasData.data ?? []).map((c) => ({
          id: c.id,
          list_id: c.list_id,
          nome: c.nome,
          status: c.status,
          canal: c.canal,
          criada_em: c.criada_em,
          ...(campaignLeadCounts.get(c.id) ?? {
            total: 0,
            pendente: 0,
            rascunho: 0,
            aprovado: 0,
            enviado: 0,
            descartado: 0,
            erro: 0,
          }),
        }));
        setLinkedCampaigns(camps);
      })
      .catch((e) => {
        if (!ativo) return;
        toast.error(e instanceof Error ? e.message : "Erro ao carregar detalhes da lista.");
      })
      .finally(() => {
        if (ativo) setLeadsLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [selectedListId]);

  // Indicadores Superiores Reais
  const kpis = useMemo(() => {
    return calculateListKpis(listas);
  }, [listas]);

  // Opções para filtros dinâmicos
  const filterOptions = useMemo(() => {
    const fontes = Array.from(new Set(listas.map((l) => l.fonte).filter(Boolean))) as string[];
    const nichos = Array.from(new Set(listas.map((l) => l.niche).filter(Boolean))) as string[];
    const cidades = Array.from(
      new Set(listas.map((l) => l.city).filter((c) => c && c !== "—")),
    ) as string[];

    return { fontes, nichos, cidades };
  }, [listas]);

  // Listas filtradas e ordenadas
  const filteredListas = useMemo(() => {
    let result = [...listas];

    // Busca textual
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.niche.toLowerCase().includes(q) ||
          (l.city && l.city.toLowerCase().includes(q)) ||
          (l.uf && l.uf.toLowerCase().includes(q)) ||
          (l.fonte && l.fonte.toLowerCase().includes(q)),
      );
    }

    // Filtro por Fonte
    if (filters.fonte !== "todas") {
      result = result.filter((l) => (l.fonte || "").toLowerCase() === filters.fonte.toLowerCase());
    }

    // Filtro por Nicho
    if (filters.nicho !== "todos") {
      result = result.filter((l) => (l.niche || "").toLowerCase() === filters.nicho.toLowerCase());
    }

    // Filtro por Cidade
    if (filters.cidade !== "todas") {
      result = result.filter((l) => (l.city || "").toLowerCase() === filters.cidade.toLowerCase());
    }

    // Filtro por Status
    if (filters.status !== "todos") {
      result = result.filter((l) => l.status === filters.status);
    }

    // Ordenação
    if (filters.ordenarPor === "recentes") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filters.ordenarPor === "maior_leads") {
      result.sort((a, b) => b.leads_atuais - a.leads_atuais);
    } else if (filters.ordenarPor === "alfabetico") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [listas, filters]);

  // Ações de gerenciamento
  const handleRenomear = async (listId: string, novoNome: string) => {
    if (!novoNome.trim()) return;
    const nomeLimpo = novoNome.trim();
    const prev = listas;

    // Atualização otimista
    setListas((prevListas) =>
      prevListas.map((l) => (l.id === listId ? { ...l, name: nomeLimpo } : l)),
    );

    try {
      await renomearLista(listId, nomeLimpo);
      toast.success("Lista renomeada com sucesso.");
    } catch (e) {
      setListas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao renomear lista.");
      throw e;
    }
  };

  const handleExcluir = async (listId: string) => {
    const alvo = listas.find((l) => l.id === listId);
    if (!alvo) return;

    if (alvo.leads_atuais > 0) {
      toast.error(
        `Exclusão bloqueada por segurança: "${alvo.name}" possui ${alvo.leads_atuais} lead(s). Nenhum registro foi removido.`,
      );
      return;
    }

    const prev = listas;
    setListas((p) => p.filter((x) => x.id !== listId));
    if (selectedListId === listId) {
      setSelectedListId(listas.find((x) => x.id !== listId)?.id ?? null);
    }

    try {
      await excluirLista(listId);
      toast.success("Lista excluída com sucesso.");
    } catch (e) {
      setListas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao excluir lista.");
      throw e;
    }
  };

  return {
    listas,
    filteredListas,
    loading,
    error,
    selectedListId,
    selectedList,
    selectedLeads,
    leadsLoading,
    linkedCampaigns,
    kpis,
    filters,
    setFilters,
    filterOptions,
    setSelectedListId,
    refresh: carregarListas,
    handleRenomear,
    handleExcluir,
  };
}
