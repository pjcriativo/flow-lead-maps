/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";
import type { Lead } from "@/lib/leads-api";
import {
  criarListaDeLeads,
  adicionarLeadsALista,
  listarListas,
  type LeadListComStats,
} from "@/lib/lists-api";
import { MAP_CONFIG, MAP_LAYERS } from "@/lib/map-config";

import { GoogleMapsTopbar } from "./GoogleMapsTopbar";
import { GoogleMapsResultsHeader } from "./GoogleMapsResultsHeader";
import { GoogleMapsResultsIndicators } from "./GoogleMapsResultsIndicators";
import { GoogleMapsResultsInfo } from "./GoogleMapsResultsInfo";
import { GoogleMapsResultsFilters, type FilterTab } from "./GoogleMapsResultsFilters";
import { GoogleMapsResultsBulkActions } from "./GoogleMapsResultsBulkActions";
import { GoogleMapsResultsTable } from "./GoogleMapsResultsTable";
import { GoogleMapsResultsPagination } from "./GoogleMapsResultsPagination";
import { GoogleMapsCompanyDetails } from "./GoogleMapsCompanyDetails";
import { FolderPlus, MapPin, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

export interface GoogleMapsSearchResultsViewProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    initials: string;
    role?: string;
  };
  unreadNotifications?: number;
  isSuperAdmin?: boolean;
  onOpenProfile?: () => void;
  // Parâmetros da busca original
  nicho: string;
  categoria?: string;
  cidade: string;
  uf: string;
  raioKm: number;
  limite: number;
  nomeLista: string;
  dataBusca?: string;
  // Resultados da execução
  leads: Lead[];
  duplicatasCount?: number;
  isParcial?: boolean;
  listaCriadaId?: string;
  // Navegação e Ações
  onNovaBusca: () => void;
  onEditarPesquisa: () => void;
  onVerMinhasListas?: () => void;
  onOpenLeads?: (leadId?: string) => void;
  onOpenCampanhas?: () => void;
  onPrepararAbordagem?: (selectedLeadIds: Set<string>) => void;
}

/** Sanitização anti-CSV Formula Injection conforme boas práticas OWASP */
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const dangerous = ["=", "+", "-", "@", "\t", "\r"];
  let safe = str;
  if (dangerous.some((ch) => safe.startsWith(ch))) {
    safe = `'${safe}`;
  }
  return `"${safe.replace(/"/g, '""')}"`;
}

export function GoogleMapsSearchResultsView({
  user,
  unreadNotifications = 3,
  isSuperAdmin = false,
  onOpenProfile,
  nicho,
  categoria,
  cidade,
  uf,
  raioKm,
  limite,
  nomeLista,
  dataBusca,
  leads,
  duplicatasCount = 0,
  isParcial = false,
  listaCriadaId,
  onNovaBusca,
  onEditarPesquisa,
  onVerMinhasListas,
  onOpenLeads,
  onOpenCampanhas,
  onPrepararAbordagem,
}: GoogleMapsSearchResultsViewProps) {
  // Formatação amigável da data da busca
  const dataBuscaFormatada = useMemo(() => {
    if (dataBusca) return dataBusca;
    const now = new Date();
    return `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }, [dataBusca]);

  // Estados de Filtros
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [minAvaliacao, setMinAvaliacao] = useState("qualquer");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroContato, setFiltroContato] = useState("todos");
  const [activeTab, setActiveTab] = useState<FilterTab>("todos");

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Estados de Seleção Múltipla
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Lead em Foco para o Painel Lateral
  const [focusedLead, setFocusedLead] = useState<Lead | null>(leads[0] || null);

  // Modais Adicionais
  const [modalMapaAberto, setModalMapaAberto] = useState(false);
  const [modalListaAberto, setModalListaAberto] = useState(false);
  const [listasSalvas, setListasSalvas] = useState<LeadListComStats[]>([]);
  const [carregandoListas, setCarregandoListas] = useState(false);
  const [listaDestinoId, setListaDestinoId] = useState<string>("");
  const [nomeNovaLista, setNomeNovaLista] = useState("");
  const [modoLista, setModoLista] = useState<"existente" | "nova">("nova");

  const mapModalRef = useRef<HTMLDivElement>(null);
  const leafletModalMap = useRef<any>(null);

  // Atualiza lead focado inicial caso mude a lista de leads
  useEffect(() => {
    if (!focusedLead && leads.length > 0) {
      setFocusedLead(leads[0]);
    }
  }, [leads, focusedLead]);

  // Lista única de categorias reais dos leads retornados
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.category?.trim()) set.add(l.category.trim());
    }
    return Array.from(set).sort();
  }, [leads]);

  // Contagens dos badges e indicadores
  const counts = useMemo(() => {
    const ineditos = leads.length;
    const total = ineditos + duplicatasCount;
    let telefone = 0;
    let email = 0;
    let site = 0;
    let instagram = 0;

    for (const l of leads) {
      if (l.phone || l.whatsapp) telefone++;
      if (l.email) email++;
      if (l.website) site++;
      if (l.instagram_url) instagram++;
    }

    return {
      total,
      ineditos,
      duplicatas: duplicatasCount,
      telefone,
      email,
      site,
      instagram,
    };
  }, [leads, duplicatasCount]);

  // Filtragem dos leads em memória com memoização de alta performance
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Aba Rápida
      if (activeTab === "duplicatas") {
        // Se for a aba duplicatas e não houver linhas de duplicatas individuais
        return false;
      }
      if (activeTab === "telefone" && !lead.phone && !lead.whatsapp) return false;
      if (activeTab === "email" && !lead.email) return false;
      if (activeTab === "site" && !lead.website) return false;
      if (activeTab === "instagram" && !lead.instagram_url) return false;

      // 2. Busca Textual
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const nomeMatch = lead.business_name?.toLowerCase().includes(termo);
        const catMatch = lead.category?.toLowerCase().includes(termo);
        const endMatch = lead.address?.toLowerCase().includes(termo);
        const cidMatch = lead.city?.toLowerCase().includes(termo);
        if (!nomeMatch && !catMatch && !endMatch && !cidMatch) return false;
      }

      // 3. Dropdown Categoria
      if (categoriaFiltro !== "todas" && lead.category !== categoriaFiltro) {
        return false;
      }

      // 4. Dropdown Avaliação Mínima
      if (minAvaliacao !== "qualquer") {
        const minNota = parseFloat(minAvaliacao);
        const nota = lead.rating ? Number(lead.rating) : 0;
        if (nota < minNota) return false;
      }

      // 5. Dropdown Com Contato
      if (filtroContato === "telefone" && !lead.phone && !lead.whatsapp) return false;
      if (filtroContato === "email" && !lead.email) return false;
      if (filtroContato === "site" && !lead.website) return false;
      if (filtroContato === "instagram" && !lead.instagram_url) return false;

      return true;
    });
  }, [leads, activeTab, busca, categoriaFiltro, minAvaliacao, filtroContato]);

  // Paginação dos resultados filtrados
  const paginatedLeads = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return filteredLeads.slice(inicio, inicio + itensPorPagina);
  }, [filteredLeads, paginaAtual, itensPorPagina]);

  // Toggle de seleção individual de lead
  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle de selecionar todos da página atual
  const isAllPageSelected =
    paginatedLeads.length > 0 && paginatedLeads.every((l) => selectedLeadIds.has(l.id));

  const handleToggleSelectAllPage = () => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedLeads.forEach((l) => next.delete(l.id));
      } else {
        paginatedLeads.forEach((l) => next.add(l.id));
      }
      return next;
    });
  };

  // Limpeza de todos os filtros
  const handleLimparFiltros = () => {
    setBusca("");
    setCategoriaFiltro("todas");
    setMinAvaliacao("qualquer");
    setFiltroStatus("todos");
    setFiltroContato("todos");
    setActiveTab("todos");
    setPaginaAtual(1);
    toast.info("Filtros restaurados.");
  };

  // EXPORTAÇÃO CSV SEGURA (Anti-Formula Injection + UTF-8 BOM)
  const handleExportCsv = () => {
    const leadsParaExportar =
      selectedLeadIds.size > 0 ? leads.filter((l) => selectedLeadIds.has(l.id)) : filteredLeads;

    if (leadsParaExportar.length === 0) {
      toast.warning("Nenhum lead disponível para exportar.");
      return;
    }

    const headers = [
      "Nome da Empresa",
      "Categoria",
      "Avaliação",
      "Qtd Avaliações",
      "Telefone",
      "WhatsApp",
      "Site",
      "E-mail",
      "Instagram",
      "Endereço",
      "Cidade",
      "UF",
      "Score",
    ];

    const rows = leadsParaExportar.map((l) => [
      sanitizeCsvValue(l.business_name),
      sanitizeCsvValue(l.category),
      sanitizeCsvValue(l.rating),
      sanitizeCsvValue(l.review_count),
      sanitizeCsvValue(l.phone),
      sanitizeCsvValue(l.whatsapp),
      sanitizeCsvValue(l.website),
      sanitizeCsvValue(l.email),
      sanitizeCsvValue(l.instagram_url),
      sanitizeCsvValue(l.address),
      sanitizeCsvValue(l.city),
      sanitizeCsvValue(l.state),
      sanitizeCsvValue(l.score),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    // Inclui UTF-8 BOM (\uFEFF) para visualização correta de acentos no Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `leads_${nicho.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${leadsParaExportar.length} leads exportados com sucesso em CSV!`);
    posthog.capture("leads_exported_csv", { count: leadsParaExportar.length });
  };

  // Abrir Modal de Adicionar à Lista
  const handleAbrirModalLista = async () => {
    const selecionados = leads.filter((l) => selectedLeadIds.has(l.id));
    if (selecionados.length === 0) {
      toast.warning("Selecione ao menos uma empresa para adicionar à lista.");
      return;
    }
    setModalListaAberto(true);
    setCarregandoListas(true);
    try {
      const listas = await listarListas();
      setListasSalvas(listas);
      if (listas.length > 0) {
        setListaDestinoId(listas[0].id);
      }
    } catch {
      toast.error("Erro ao carregar listas existentes.");
    } finally {
      setCarregandoListas(false);
    }
  };

  // Confirmar adição dos leads selecionados à lista
  const handleConfirmarAdicionarLista = async () => {
    const selecionados = leads.filter((l) => selectedLeadIds.has(l.id));
    if (selecionados.length === 0) return;

    try {
      if (modoLista === "nova") {
        const nomeFinal = nomeNovaLista.trim() || `Lista de Leads — ${nicho}`;
        const listaCriada = await criarListaDeLeads(nomeFinal, selecionados);
        toast.success(`Lista "${listaCriada.name}" criada com ${selecionados.length} leads!`);
      } else {
        if (!listaDestinoId) {
          toast.error("Selecione uma lista de destino.");
          return;
        }
        await adicionarLeadsALista(
          listaDestinoId,
          selecionados.map((l) => l.id),
        );
        toast.success(`${selecionados.length} leads vinculados à lista selecionada!`);
      }
      setModalListaAberto(false);
      setSelectedLeadIds(new Set());
    } catch (err) {
      toast.error((err as Error).message || "Falha ao associar leads à lista.");
    }
  };

  // Inicializa mapa modal quando "Ver no mapa" é acionado
  useEffect(() => {
    if (!modalMapaAberto) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapModalRef.current) return;

      if (leafletModalMap.current) {
        leafletModalMap.current.remove();
        leafletModalMap.current = null;
      }

      const selecionados = leads.filter((l) => selectedLeadIds.has(l.id));
      const leadsComCoords = selecionados.filter((l) => l.latitude && l.longitude);

      const centerCoord: [number, number] =
        leadsComCoords.length > 0
          ? [Number(leadsComCoords[0].latitude), Number(leadsComCoords[0].longitude)]
          : MAP_CONFIG.defaultCenter;

      const map = L.map(mapModalRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView(centerCoord, 12);

      const darkLayer = MAP_LAYERS.dark;
      L.tileLayer(darkLayer.url, {
        maxZoom: darkLayer.maxZoom,
        subdomains: darkLayer.subdomains,
      }).addTo(map);

      const bounds: [number, number][] = [];

      for (const l of leadsComCoords) {
        const lat = Number(l.latitude);
        const lng = Number(l.longitude);
        bounds.push([lat, lng]);

        const markerIcon = L.divIcon({
          className: "custom-pin",
          html: `<div class="flex size-6 items-center justify-center rounded-full bg-home-orange border-2 border-white shadow-lg text-white font-bold text-[10px]">
            ★
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; color: #111;">
            <strong>${l.business_name}</strong><br/>
            ${l.category || ""}<br/>
            ${l.phone || ""}<br/>
            <small>${l.address || ""}</small>
          </div>
        `);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }

      leafletModalMap.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      if (leafletModalMap.current) {
        leafletModalMap.current.remove();
        leafletModalMap.current = null;
      }
    };
  }, [modalMapaAberto, selectedLeadIds, leads]);

  return (
    <div className="min-h-screen bg-home-background text-home-foreground pb-12 select-text">
      {/* 1. Topbar Oficial Flow Business */}
      <GoogleMapsTopbar
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
      />

      {/* Conteúdo Principal */}
      <main className="px-4 sm:px-6 lg:px-8 pt-5 space-y-5 max-w-[1680px] mx-auto">
        {/* 2. Cabeçalho Oficial: Breadcrumb, Título e Ações Superiores */}
        <GoogleMapsResultsHeader
          nicho={nicho}
          cidade={cidade}
          uf={uf}
          raioKm={raioKm}
          limite={limite}
          nomeLista={nomeLista}
          dataBusca={dataBuscaFormatada}
          selectedCount={selectedLeadIds.size}
          onNovaBusca={onNovaBusca}
          onAdicionarSelecionados={handleAbrirModalLista}
        />

        {/* 3. Seis Indicadores KPI Superiores */}
        <GoogleMapsResultsIndicators
          totalEncontrados={counts.total}
          leadsIneditos={counts.ineditos}
          duplicatasDescartadas={counts.duplicatas}
          comEmail={counts.email}
          comTelefone={counts.telefone}
          comInstagram={counts.instagram}
        />

        {/* 4. Grid de Informações da Pesquisa (Esquerda) e Filtros (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Card Esquerdo: Informações da pesquisa (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <GoogleMapsResultsInfo
              nicho={nicho}
              categoria={categoria}
              cidade={cidade}
              uf={uf}
              raioKm={raioKm}
              dataBusca={dataBuscaFormatada}
              nomeLista={nomeLista}
              limite={limite}
              leadsIneditos={counts.ineditos}
              totalEncontrados={counts.total}
              isParcial={isParcial}
              onEditarPesquisa={onEditarPesquisa}
            />
          </div>

          {/* Card Direito: Filtros de resultados (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <GoogleMapsResultsFilters
              busca={busca}
              onChangeBusca={(v) => {
                setBusca(v);
                setPaginaAtual(1);
              }}
              categoria={categoriaFiltro}
              onChangeCategoria={(v) => {
                setCategoriaFiltro(v);
                setPaginaAtual(1);
              }}
              categoriasDisponiveis={categoriasDisponiveis}
              minAvaliacao={minAvaliacao}
              onChangeMinAvaliacao={(v) => {
                setMinAvaliacao(v);
                setPaginaAtual(1);
              }}
              filtroStatus={filtroStatus}
              onChangeFiltroStatus={(v) => {
                setFiltroStatus(v);
                setPaginaAtual(1);
              }}
              filtroContato={filtroContato}
              onChangeFiltroContato={(v) => {
                setFiltroContato(v);
                setPaginaAtual(1);
              }}
              activeTab={activeTab}
              onChangeActiveTab={(tab) => {
                setActiveTab(tab);
                setPaginaAtual(1);
              }}
              onLimparFiltros={handleLimparFiltros}
              counts={counts}
            />
          </div>
        </div>

        {/* 5. Composição Inferior: Barra de Ações em Lote + Tabela e Painel Lateral */}
        <div className="space-y-3">
          {/* Barra de Ações em Lote */}
          <GoogleMapsResultsBulkActions
            selectedCount={selectedLeadIds.size}
            totalFilteredCount={filteredLeads.length}
            isAllSelected={isAllPageSelected}
            onToggleSelectAll={handleToggleSelectAllPage}
            onAdicionarALista={handleAbrirModalLista}
            onExportarSelecionados={handleExportCsv}
            onVerNoMapa={() => setModalMapaAberto(true)}
            onEnviarParaCampanha={() => {
              if (onPrepararAbordagem) {
                onPrepararAbordagem(selectedLeadIds);
              } else if (onOpenCampanhas) {
                onOpenCampanhas();
              } else {
                toast.info("Módulo de Campanhas pronto para estruturação.");
              }
            }}
          />

          {/* Tabela de Empresas com Painel Lateral de Detalhes */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Tabela Central (flex-1) */}
            <div className="flex-1 w-full space-y-2">
              <GoogleMapsResultsTable
                leads={paginatedLeads}
                selectedLeadIds={selectedLeadIds}
                onToggleSelectLead={handleToggleSelectLead}
                onToggleSelectAllPage={handleToggleSelectAllPage}
                isAllPageSelected={isAllPageSelected}
                focusedLeadId={focusedLead?.id || null}
                onSelectRow={(lead) => setFocusedLead(lead)}
                duplicatasCount={duplicatasCount}
                activeTab={activeTab}
              />

              {/* Paginação */}
              {filteredLeads.length > 0 && (
                <div className="rounded-2xl border border-home-border bg-[#101720]/90">
                  <GoogleMapsResultsPagination
                    totalItens={filteredLeads.length}
                    paginaAtual={paginaAtual}
                    itensPorPagina={itensPorPagina}
                    onMudarPagina={setPaginaAtual}
                    onMudarItensPorPagina={setItensPorPagina}
                  />
                </div>
              )}
            </div>

            {/* Painel Lateral Direito de Detalhes da Empresa (se houver empresa selecionada) */}
            {focusedLead && (
              <GoogleMapsCompanyDetails
                lead={focusedLead}
                onClose={() => setFocusedLead(null)}
                onAdicionarALista={() => handleAbrirModalLista()}
                onVerNaCentral={(id) => onOpenLeads?.(id)}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal: Ver no Mapa */}
      {modalMapaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[600px] rounded-2xl border border-home-border bg-[#101720] p-5 shadow-2xl flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-home-orange" />
                <h3 className="text-sm font-bold text-white">
                  Empresas Selecionadas no Mapa ({selectedLeadIds.size})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalMapaAberto(false)}
                className="text-home-muted hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-home-border relative bg-[#090d14]">
              <div ref={mapModalRef} className="size-full z-0" />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar à Lista */}
      {modalListaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-home-border bg-[#101720] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="size-4 text-home-orange" />
                <h3 className="text-sm font-bold text-white">
                  Adicionar {selectedLeadIds.size} leads a uma lista
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalListaAberto(false)}
                className="text-home-muted hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Opção Nova Lista vs Lista Existente */}
              <div className="flex rounded-xl border border-home-border p-1 bg-home-surface/60">
                <button
                  type="button"
                  onClick={() => setModoLista("nova")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${modoLista === "nova" ? "bg-home-orange text-white" : "text-home-muted hover:text-white"}`}
                >
                  Criar Nova Lista
                </button>
                <button
                  type="button"
                  onClick={() => setModoLista("existente")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${modoLista === "existente" ? "bg-home-orange text-white" : "text-home-muted hover:text-white"}`}
                >
                  Lista Existente
                </button>
              </div>

              {modoLista === "nova" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                    Nome da Nova Lista
                  </label>
                  <input
                    type="text"
                    value={nomeNovaLista}
                    onChange={(e) => setNomeNovaLista(e.target.value)}
                    placeholder={`Lista de Leads — ${nicho}`}
                    className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-3 text-xs text-white focus:border-home-orange focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
                    Selecione a Lista de Destino
                  </label>
                  {carregandoListas ? (
                    <p className="text-xs text-home-muted">Carregando listas...</p>
                  ) : listasSalvas.length > 0 ? (
                    <select
                      value={listaDestinoId}
                      onChange={(e) => setListaDestinoId(e.target.value)}
                      className="w-full h-9 rounded-xl border border-home-border bg-home-surface/80 px-2.5 text-xs text-white focus:border-home-orange focus:outline-none cursor-pointer"
                    >
                      {listasSalvas.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.leads_atuais} leads)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-home-muted">Nenhuma lista existente encontrada.</p>
                  )}
                  <p className="text-[11px] text-amber-300/80 pt-1">
                    Nota: O banco de dados vincula cada lead a uma única lista (1:1). Mover estes
                    leads atualizará a associação anterior.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalListaAberto(false)}
                className="rounded-xl border border-home-border bg-home-surface px-4 py-2 text-xs font-semibold text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAdicionarLista}
                className="rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white hover:bg-home-orange-hover transition-colors cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
