import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/lib/leads-api";
import { NICHOS_POR_CATEGORIA } from "@/lib/niches";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import type {
  SearchHistoryFilters,
  SearchHistoryIndicators,
  SearchHistoryItem,
  SearchHistoryStatus,
} from "./google-maps-history-types";

function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();
  // Sanitização anti-formula injection (CSV Injection)
  if (/^[=+@\-|\t\r\n]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function resolverCategoriaPorNicho(nicho: string): string {
  const t = (nicho || "").toLowerCase().trim();
  if (!t) return "Geral";
  for (const cat of NICHOS_POR_CATEGORIA) {
    if (cat.nichos.some((n) => n.toLowerCase().trim() === t)) {
      return cat.categoria;
    }
  }
  // Heurísticas comuns
  if (t.includes("odont") || t.includes("médic") || t.includes("saúde") || t.includes("clínica")) {
    return "Saúde & Bem-estar";
  }
  if (
    t.includes("restaurante") ||
    t.includes("comida") ||
    t.includes("café") ||
    t.includes("pizz")
  ) {
    return "Alimentação";
  }
  if (t.includes("academia") || t.includes("crossfit") || t.includes("fitness")) {
    return "Saúde & Bem-estar";
  }
  if (
    t.includes("beleza") ||
    t.includes("estética") ||
    t.includes("salão") ||
    t.includes("barbearia")
  ) {
    return "Beleza & Estética";
  }
  if (t.includes("roupa") || t.includes("loja") || t.includes("moda") || t.includes("calçado")) {
    return "Varejo";
  }
  if (
    t.includes("oficina") ||
    t.includes("mecânica") ||
    t.includes("auto") ||
    t.includes("carro")
  ) {
    return "Automotivo";
  }
  if (t.includes("hotel") || t.includes("pousada") || t.includes("hospedag")) {
    return "Turismo";
  }
  if (t.includes("veterinár") || t.includes("pet") || t.includes("animal")) {
    return "Pets";
  }
  if (t.includes("contabil") || t.includes("escritório") || t.includes("advoc")) {
    return "Serviços";
  }
  return "Serviços Gerais";
}

export function useGoogleMapsHistory() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemLeads, setSelectedItemLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Filtros
  const [filters, setFilters] = useState<SearchHistoryFilters>({
    periodo: "90d",
    status: "todos",
    nicho: "todos",
    cidadeUf: "todas",
    categoria: "todas",
    buscaTexto: "",
  });

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Ordenação
  const [sortField, setSortField] = useState<"dataHora" | "solicitado" | "encontrados">("dataHora");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Carregar dados históricos reais do Supabase
  const carregarHistorico = useCallback(async () => {
    setLoading(true);
    try {
      const activeOrganization = await getActiveOrganizationContext();
      // 1. Obter listas salvas pelo usuário / organização
      const { data: listas, error: errListas } = await supabase
        .from("lead_lists")
        .select("*")
        .eq("org_id", activeOrganization.orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (errListas) {
        console.warn("[GoogleMapsHistory] Erro ao buscar listas:", errListas);
      }

      // 2. RPC expõe apenas o histórico comercial seguro; custos, provider IDs e metadata ficam no servidor.
      const { data: safeHistory, error: errLogs } = await supabase.rpc(
        "google_maps_search_history",
        { p_org: activeOrganization.orgId, p_limit: 200 },
      );

      if (errLogs) {
        console.warn("[GoogleMapsHistory] Não foi possível carregar o histórico de execuções.");
      }

      // 3. Obter leads agregados por lista para métricas de contato e coordenadas
      const listIds = (listas ?? []).map((l) => l.id);
      const leadsPorLista = new Map<string, Lead[]>();

      if (listIds.length > 0) {
        const { data: leadsData, error: errLeads } = await supabase
          .from("leads")
          .select("*")
          .eq("org_id", activeOrganization.orgId)
          .in("list_id", listIds)
          .limit(2000);

        if (!errLeads && leadsData) {
          for (const lead of leadsData as Lead[]) {
            if (!lead.list_id) continue;
            const existing = leadsPorLista.get(lead.list_id) || [];
            existing.push(lead);
            leadsPorLista.set(lead.list_id, existing);
          }
        }
      }

      // Construção dos itens a partir das listas confirmadas
      const itensConstruidos: SearchHistoryItem[] = [];

      for (const lista of listas ?? []) {
        const leadsLista = leadsPorLista.get(lista.id) || [];
        const nicho =
          lista.niche && lista.niche !== "—" ? lista.niche : lista.name.split(" — ")[0] || "Geral";
        const categoria = resolverCategoriaPorNicho(nicho);
        const cidade = lista.city && lista.city !== "—" ? lista.city : "Curitiba";
        const uf = lista.uf || "PR";
        const raioKm = lista.radius || 10;
        const totalLeads = leadsLista.length > 0 ? leadsLista.length : lista.total_leads || 0;

        // Análise de canais de contato
        const emailsCount = leadsLista.filter((l) => Boolean(l.email)).length;
        const telefonesCount = leadsLista.filter((l) => Boolean(l.phone || l.whatsapp)).length;
        const instagramCount = leadsLista.filter((l) => Boolean(l.instagram_url)).length;

        // Encontrar primeiro ponto com coordenadas válidas para o mini-mapa
        const leadComGeo = leadsLista.find((l) => l.latitude != null && l.longitude != null);
        const center =
          leadComGeo && leadComGeo.latitude && leadComGeo.longitude
            ? { lat: Number(leadComGeo.latitude), lng: Number(leadComGeo.longitude) }
            : cidade.toLowerCase().includes("curitiba")
              ? { lat: -25.4284, lng: -49.2733 }
              : null;

        // Determinar status comprovado
        let status: SearchHistoryStatus = "concluida";
        let statusLabel = "Concluída";
        if (totalLeads === 0) {
          status = "interrompida";
          statusLabel = "Interrompida";
        }

        itensConstruidos.push({
          id: lista.id,
          listId: lista.id,
          dataHora: lista.created_at,
          timestamp: new Date(lista.created_at).getTime(),
          nicho,
          categoria,
          cidade,
          uf,
          raioKm,
          solicitado: totalLeads > 0 ? Math.max(totalLeads, 50) : 50,
          encontrados: totalLeads,
          ineditos: totalLeads,
          duplicatas: 0,
          status,
          statusLabel,
          tempoColeta: null, // "—" para não inventar métrica não persistida
          nomeLista: lista.name,
          center,
          emailsCount,
          telefonesCount,
          instagramCount,
          leads: leadsLista,
          hasRecoverableResults: leadsLista.length > 0,
        });
      }

      // Execuções sem lista são retornadas pela RPC já sanitizadas e sem campos privilegiados.
      for (const log of safeHistory ?? []) {
        const nicho = log.niche || "Geral";
        const cidade = log.city || "Brasil";
        const uf = log.state || "";

        // Evitar duplicar se já foi representado por uma lista no mesmo minuto
        const logTime = new Date(log.created_at).getTime();
        const jaExiste = itensConstruidos.some(
          (item) =>
            Math.abs(item.timestamp - logTime) < 60000 &&
            item.nicho.toLowerCase() === nicho.toLowerCase(),
        );

        if (!jaExiste) {
          const isError = log.run_status === "erro";
          const status: SearchHistoryStatus = isError ? "erro" : "parcial";
          const statusLabel = isError ? "Erro" : "Parcial";

          itensConstruidos.push({
            id: log.id,
            listId: null,
            dataHora: log.created_at,
            timestamp: logTime,
            nicho,
            categoria: resolverCategoriaPorNicho(nicho),
            cidade,
            uf: uf || "—",
            raioKm: Number(log.radius_km) || 10,
            solicitado: Number(log.quantity) || 50,
            encontrados: Number(log.quantity) || 0,
            ineditos: Number(log.quantity) || 0,
            duplicatas: 0,
            status,
            statusLabel,
            tempoColeta: null,
            nomeLista: null,
            center: null,
            emailsCount: 0,
            telefonesCount: 0,
            instagramCount: 0,
            leads: [],
            hasRecoverableResults: false,
          });
        }
      }

      // Ordenar por data decrescente por padrão
      itensConstruidos.sort((a, b) => b.timestamp - a.timestamp);

      setItems(itensConstruidos);
      if (itensConstruidos.length > 0 && !selectedItemId) {
        setSelectedItemId(itensConstruidos[0].id);
        setSelectedItemLeads(itensConstruidos[0].leads || []);
      }
    } catch (err) {
      console.error("[GoogleMapsHistory] Falha ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedItemId]);

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  // Carregar leads específicos quando o item selecionado mudar
  useEffect(() => {
    if (!selectedItemId) {
      setSelectedItemLeads([]);
      return;
    }

    const currentItem = items.find((i) => i.id === selectedItemId);
    if (!currentItem) return;

    if (currentItem.leads && currentItem.leads.length > 0) {
      setSelectedItemLeads(currentItem.leads);
      return;
    }

    const listId = currentItem.listId;
    if (!listId) {
      setSelectedItemLeads([]);
      return;
    }

    let cancel = false;
    async function fetchLeads() {
      setLoadingLeads(true);
      try {
        const activeOrganization = await getActiveOrganizationContext();
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("org_id", activeOrganization.orgId)
          .eq("list_id", listId as string)
          .limit(500);

        if (!cancel && !error && data) {
          setSelectedItemLeads(data as Lead[]);
        }
      } catch (err) {
        console.warn("[GoogleMapsHistory] Erro ao buscar leads do item selecionado:", err);
      } finally {
        if (!cancel) setLoadingLeads(false);
      }
    }

    void fetchLeads();
    return () => {
      cancel = true;
    };
  }, [selectedItemId, items]);

  // Listas de opções únicas para os selects dos filtros
  const distinctNiches = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.nicho) set.add(i.nicho);
    });
    return Array.from(set).sort();
  }, [items]);

  const distinctCidadeUf = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.cidade) {
        set.add(i.uf ? `${i.cidade} - ${i.uf}` : i.cidade);
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const distinctCategorias = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.categoria) set.add(i.categoria);
    });
    return Array.from(set).sort();
  }, [items]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    const now = Date.now();
    let minTimestamp = 0;
    if (filters.periodo === "7d") {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (filters.periodo === "30d") {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    } else if (filters.periodo === "90d") {
      minTimestamp = now - 90 * 24 * 60 * 60 * 1000;
    }

    return items.filter((item) => {
      // Período
      if (minTimestamp > 0 && item.timestamp < minTimestamp) return false;

      // Status
      if (filters.status !== "todos" && item.status !== filters.status) return false;

      // Nicho
      if (filters.nicho !== "todos" && item.nicho.toLowerCase() !== filters.nicho.toLowerCase()) {
        return false;
      }

      // Cidade/UF
      if (filters.cidadeUf !== "todas") {
        const itemLocal = item.uf ? `${item.cidade} - ${item.uf}` : item.cidade;
        if (itemLocal.toLowerCase() !== filters.cidadeUf.toLowerCase()) return false;
      }

      // Categoria
      if (
        filters.categoria !== "todas" &&
        item.categoria.toLowerCase() !== filters.categoria.toLowerCase()
      ) {
        return false;
      }

      // Busca textual livre
      if (filters.buscaTexto.trim()) {
        const q = filters.buscaTexto.toLowerCase().trim();
        const matchNicho = item.nicho.toLowerCase().includes(q);
        const matchCidade = item.cidade.toLowerCase().includes(q);
        const matchUf = item.uf.toLowerCase().includes(q);
        const matchLista = item.nomeLista ? item.nomeLista.toLowerCase().includes(q) : false;
        const matchCat = item.categoria.toLowerCase().includes(q);
        if (!matchNicho && !matchCidade && !matchUf && !matchLista && !matchCat) {
          return false;
        }
      }

      return true;
    });
  }, [items, filters]);

  // Itens ordenados
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comp = 0;
      if (sortField === "dataHora") {
        comp = a.timestamp - b.timestamp;
      } else if (sortField === "solicitado") {
        comp = a.solicitado - b.solicitado;
      } else if (sortField === "encontrados") {
        comp = a.encontrados - b.encontrados;
      }
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredItems, sortField, sortDirection]);

  // Itens paginados
  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  // Cálculo rigoroso dos 6 Indicadores
  const indicators: SearchHistoryIndicators = useMemo(() => {
    const totalBuscas = filteredItems.length;
    const leadsColetados = filteredItems.reduce((acc, i) => acc + i.encontrados, 0);
    const leadsIneditos = filteredItems.reduce((acc, i) => acc + i.ineditos, 0);
    const listasCriadas = filteredItems.filter((i) => Boolean(i.listId)).length;

    // Percentual de inéditos
    const pctIneditos = leadsColetados > 0 ? Math.round((leadsIneditos / leadsColetados) * 100) : 0;
    const leadsIneditosSub = leadsColetados > 0 ? `${pctIneditos}% do total` : "—";

    // Percentual de listas criadas
    const pctListas = totalBuscas > 0 ? Math.round((listasCriadas / totalBuscas) * 100) : 0;
    const listasCriadasSub = totalBuscas > 0 ? `${pctListas}% das buscas` : "—";

    // Taxa de sucesso (buscas com status concluída sobre o total)
    const buscasConcluidas = filteredItems.filter((i) => i.status === "concluida").length;
    const taxaSucesso = totalBuscas > 0 ? Math.round((buscasConcluidas / totalBuscas) * 100) : 0;
    const taxaSucessoFormatada = totalBuscas > 0 ? `${taxaSucesso}%` : "—";
    const taxaSucessoSub =
      totalBuscas > 0 ? `${buscasConcluidas} de ${totalBuscas} buscas` : "Nenhuma busca no período";

    // Período subtext
    let periodoLabel = "nos últimos 90 dias";
    if (filters.periodo === "7d") periodoLabel = "nos últimos 7 dias";
    if (filters.periodo === "30d") periodoLabel = "nos últimos 30 dias";
    if (filters.periodo === "tudo") periodoLabel = "todo o histórico";

    return {
      totalBuscas,
      totalBuscasSub: periodoLabel,
      leadsColetados,
      leadsColetadosSub: "em todas as buscas",
      leadsIneditos,
      leadsIneditosSub,
      listasCriadas,
      listasCriadasSub,
      tempoTotalColeta: "—", // Dado seguro e honesto: durações não eram armazenadas em coluna dedicada
      tempoTotalColetaSub: "tempo processando",
      taxaSucessoFormatada,
      taxaSucessoSub,
    };
  }, [filteredItems, filters.periodo]);

  // Item atualmente selecionado no painel direito
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  // Limpar filtros
  const handleLimparFiltros = useCallback(() => {
    setFilters({
      periodo: "tudo",
      status: "todos",
      nicho: "todos",
      cidadeUf: "todas",
      categoria: "todas",
      buscaTexto: "",
    });
    setPage(1);
  }, []);

  // Seleção de linhas
  const handleToggleSelectRow = useCallback((id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectPage = useCallback(() => {
    setSelectedRowIds((prev) => {
      const allPageSelected = paginatedItems.every((item) => prev.has(item.id));
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedItems.forEach((item) => next.delete(item.id));
      } else {
        paginatedItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  }, [paginatedItems]);

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
  }, []);

  // Exportação CSV segura com UTF-8 BOM e sanitização anti-injection
  const handleExportCsv = useCallback(
    (itensParaExportar?: SearchHistoryItem[]) => {
      const exportList =
        itensParaExportar ||
        (selectedRowIds.size > 0 ? items.filter((i) => selectedRowIds.has(i.id)) : sortedItems);

      if (exportList.length === 0) return;

      const headers = [
        "Data e Hora",
        "Nicho",
        "Categoria",
        "Cidade",
        "UF",
        "Raio (km)",
        "Solicitado",
        "Encontrados",
        "Inéditos",
        "Duplicatas",
        "Status",
        "Nome da Lista",
      ];

      const rows = exportList.map((item) => [
        sanitizeCsvField(new Date(item.dataHora).toLocaleString("pt-BR")),
        sanitizeCsvField(item.nicho),
        sanitizeCsvField(item.categoria),
        sanitizeCsvField(item.cidade),
        sanitizeCsvField(item.uf),
        sanitizeCsvField(item.raioKm),
        sanitizeCsvField(item.solicitado),
        sanitizeCsvField(item.encontrados),
        sanitizeCsvField(item.ineditos),
        sanitizeCsvField(item.duplicatas),
        sanitizeCsvField(item.statusLabel),
        sanitizeCsvField(item.nomeLista || "—"),
      ]);

      const csvContent =
        "\uFEFF" +
        [headers.map(sanitizeCsvField).join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historico-buscas-maps-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [items, sortedItems, selectedRowIds],
  );

  return {
    items: sortedItems,
    paginatedItems,
    totalItems,
    totalPages,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading,
    selectedItemId,
    setSelectedItemId,
    selectedItem,
    selectedItemLeads,
    loadingLeads,
    selectedRowIds,
    handleToggleSelectRow,
    handleToggleSelectPage,
    handleClearSelection,
    filters,
    setFilters,
    handleLimparFiltros,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    distinctNiches,
    distinctCidadeUf,
    distinctCategorias,
    indicators,
    handleExportCsv,
    recarregar: carregarHistorico,
  };
}
