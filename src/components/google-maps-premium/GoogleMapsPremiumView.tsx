import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";
import { streamSearchLeads, type Lead, type SearchEvent } from "@/lib/leads-api";
import { criarListaComLeads } from "@/lib/lists-api";
import { resolveListName } from "@/lib/list-naming";
import { geocodeCidade } from "@/lib/geo";
import { NICHOS_POR_CATEGORIA } from "@/lib/niches";
import {
  sanitizeGoogleMapsUserMessage,
  toggleCaptureFilter,
  type CaptureFilter,
} from "@/lib/google-maps-capture";

import { GoogleMapsTopbar } from "./GoogleMapsTopbar";
import { GoogleMapsHeader } from "./GoogleMapsHeader";
import { GoogleMapsStatsCards } from "./GoogleMapsStatsCards";
import { GoogleMapsNicheInput } from "./GoogleMapsNicheInput";
import { GoogleMapsCategories } from "./GoogleMapsCategories";
import { GoogleMapsLocation } from "./GoogleMapsLocation";
import { GoogleMapsMapPanel } from "./GoogleMapsMapPanel";
import { GoogleMapsSearchSummary } from "./GoogleMapsSearchSummary";
import { GoogleMapsResultsPanel } from "./GoogleMapsResultsPanel";
import { GoogleMapsRunningView } from "./GoogleMapsRunningView";
import { GoogleMapsSearchResultsView } from "./GoogleMapsSearchResultsView";
import { GoogleMapsApproachView } from "./GoogleMapsApproachView";
import { GoogleMapsHistoryView } from "./GoogleMapsHistoryView";
import { useGoogleMapsStats } from "./useGoogleMapsStats";
import { Radar } from "lucide-react";

export interface GoogleMapsPremiumViewProps {
  user?: {
    name: string;
    email: string;
    avatarUrl: string;
    initials: string;
    role?: string;
  };
  unreadNotifications?: number;
  isSuperAdmin?: boolean;
  onOpenProfile?: () => void;
  onOpenMinhasListas?: () => void;
  onOpenLeads?: (leadId?: string) => void;
  onOpenCampanhas?: () => void;
  onFinished?: () => void;
}

export function GoogleMapsPremiumView({
  user = {
    name: "Marcos Gonçalves",
    email: "marcos@flowbusiness.com",
    avatarUrl: "",
    initials: "MG",
    role: "Administrador",
  },
  unreadNotifications = 3,
  isSuperAdmin = false,
  onOpenProfile,
  onOpenMinhasListas,
  onOpenLeads,
  onOpenCampanhas,
  onFinished,
}: GoogleMapsPremiumViewProps) {
  // Hook de métricas reais da organização
  const stats = useGoogleMapsStats();

  // Estados de Configuração da Busca
  const [nicho, setNicho] = useState("Clínica odontológica");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | undefined>("Saúde & Bem-estar");
  const [uf, setUf] = useState("PR");
  const [cidade, setCidade] = useState("Curitiba");
  const [nomeListaCustom, setNomeListaCustom] = useState("");
  const [limite, setLimite] = useState(50);
  const [buscarEmails, setBuscarEmails] = useState(true);
  const [raioKm, setRaioKm] = useState(10);
  const [filtrosCaptura, setFiltrosCaptura] = useState<CaptureFilter[]>([]);

  // Estados do Mapa
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>({
    lat: -25.4284,
    lng: -49.2733,
  });
  const [pinManual, setPinManual] = useState(false);

  // Estados Operacionais da Coleta
  const [running, setRunning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("Pronto para prospecção");
  const [progress, setProgress] = useState({ found: 0, target: 50 });
  const [listaCriadaId, setListaCriadaId] = useState<string | undefined>();

  const abortRef = useRef<AbortController | null>(null);
  const insertedIdsRef = useRef<string[]>([]);
  const geoAbort = useRef<AbortController | null>(null);

  // Estados de visualização: "config" (Tela 01), "running" (Tela 02), "results" (Tela 03), "approach" (Tela 04) ou "history" (Tela 05)
  const [activeView, setActiveView] = useState<
    "config" | "running" | "results" | "approach" | "history"
  >("config");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duplicatasCount, setDuplicatasCount] = useState(0);
  const [isParcial, setIsParcial] = useState(false);
  const [dataUltimaBusca, setDataUltimaBusca] = useState<string>("");
  const [approachSelectedIds, setApproachSelectedIds] = useState<Set<string>>(new Set());

  // Timer em tempo real durante a execução ativa
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (running) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running]);

  // Nome resolvido da lista
  const nomeListaResolvido = resolveListName(nomeListaCustom, nicho, cidade, uf);

  // Descobre a categoria correspondente ao nicho no catálogo (se houver correspondência exata)
  const categoriaCorrespondente = useCallback((termo: string) => {
    const t = termo.toLowerCase().trim();
    if (!t) return undefined;
    for (const cat of NICHOS_POR_CATEGORIA) {
      if (cat.nichos.some((n) => n.toLowerCase().trim() === t)) {
        return cat.categoria;
      }
    }
    return undefined;
  }, []);

  // Geocodificação resiliente da cidade
  const geocodar = useCallback(async (c: string, u: string) => {
    if (!c.trim()) return null;
    geoAbort.current?.abort();
    const ctrl = new AbortController();
    geoAbort.current = ctrl;

    try {
      const g = await geocodeCidade(c.trim(), u, ctrl.signal);
      if (g) {
        setPin({ lat: g.lat, lng: g.lng });
        setPinManual(false);
        setRaioKm(g.raioKmSugerido);
      }
      return g;
    } catch {
      return null;
    }
  }, []);

  // Ao alterar a cidade ou a UF, recalcula as coordenadas do mapa (com debounce)
  useEffect(() => {
    if (!cidade.trim()) return;
    const timer = setTimeout(() => {
      void geocodar(cidade, uf);
    }, 700);
    return () => clearTimeout(timer);
  }, [cidade, uf, geocodar]);

  // Limpeza de AbortControllers ao desmontar
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      geoAbort.current?.abort();
    };
  }, []);

  const pushLog = (line: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  // Seleção de Nicho a partir de Chips ou Autocomplete
  const handleSelectNicho = (novoNicho: string, categoria?: string) => {
    setNicho(novoNicho);
    const cat = categoria || categoriaCorrespondente(novoNicho);
    setCategoriaAtiva(cat);
  };

  // Alternar filtros de captura (telefone, site, instagram)
  const handleToggleFiltroCaptura = (filtro: CaptureFilter) => {
    setFiltrosCaptura((prev) => toggleCaptureFilter(prev, filtro));
  };

  // Centralizar endereço digitado no mapa
  const handleSearchEndereco = async (endereco: string) => {
    try {
      const g = await geocodeCidade(endereco, uf);
      if (g) {
        setPin({ lat: g.lat, lng: g.lng });
        setPinManual(true);
        toast.success(`Mapa centralizado em: ${g.rotulo}`);
      } else {
        toast.error("Endereço não localizado no mapa.");
      }
    } catch {
      toast.error("Erro ao localizar endereço.");
    }
  };

  // Salvar preferências do usuário
  const handleSalvarConfiguracao = () => {
    try {
      const config = { nicho, uf, cidade, limite, raioKm, buscarEmails, filtrosCaptura };
      localStorage.setItem("flow_google_maps_preset", JSON.stringify(config));
      toast.success("Configuração de busca salva com sucesso!");
    } catch {
      toast.error("Falha ao salvar configuração.");
    }
  };

  // Disparar prospecção pelo motor de busca configurado no backend.
  const handleIniciarProspeccao = async () => {
    if (!nicho.trim()) {
      toast.error("Informe um nicho para a busca.");
      return;
    }
    if (!cidade.trim() && !pinManual) {
      toast.error("Selecione um município oficial ou marque um ponto no mapa.");
      return;
    }

    setRunning(true);
    setActiveView("running");
    setIsParcial(false);
    setDataUltimaBusca(
      new Date().toLocaleDateString("pt-BR") +
        " às " +
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    );
    setElapsedSeconds(0);
    setDuplicatasCount(0);
    setLeads([]);
    setLogs([]);
    setProgress({ found: 0, target: limite });
    insertedIdsRef.current = [];
    setListaCriadaId(undefined);

    const controller = new AbortController();
    abortRef.current = controller;
    let streamHadError = false;
    let doneRecebido = false;

    try {
      let centro = pin;
      let raio = raioKm;

      if (!pinManual && cidade.trim()) {
        const g = await geocodeCidade(cidade.trim(), uf, controller.signal).catch(() => null);
        if (g) {
          centro = { lat: g.lat, lng: g.lng };
          raio = g.raioKmSugerido;
          setPin(centro);
          setRaioKm(raio);
        }
      }

      const usarMapa = Boolean(centro);
      setStatus(
        `Buscando: ${nicho} em ${cidade}${uf ? "/" + uf : ""}${usarMapa ? ` · raio ${raio}km` : ""}...`,
      );
      posthog.capture("search_leads_started", {
        nicho,
        cidade,
        uf,
        limite,
        fonte: "apify",
        usarMapa,
      });

      // Executa o motor real de prospecção.
      await streamSearchLeads(
        {
          nicho,
          cidade,
          uf,
          limite,
          buscarEmails,
          filtrosCaptura,
          fonte: "apify",
          ...(usarMapa
            ? {
                lat: centro!.lat,
                lng: centro!.lng,
                raioKm: raio,
                usarAreaMapa: pinManual,
              }
            : {}),
        },
        (ev: SearchEvent) => {
          switch (ev.type) {
            case "log":
              pushLog(sanitizeGoogleMapsUserMessage(ev.message));
              if (
                ev.message.toLowerCase().includes("já pertenci") ||
                ev.message.toLowerCase().includes("já existe") ||
                ev.message.toLowerCase().includes("duplicat")
              ) {
                const matchDupl = ev.message.match(/(\d+)\s+estabelecimento/i);
                if (matchDupl) {
                  setDuplicatasCount((prev) => prev + Number(matchDupl[1]));
                } else {
                  setDuplicatasCount((prev) => prev + 1);
                }
              }
              break;
            case "lead":
              setLeads((prev) => [...prev, ev.lead]);
              if (ev.lead.id) insertedIdsRef.current.push(ev.lead.id);
              break;
            case "progress":
              setProgress({ found: ev.found, target: ev.target });
              setStatus(`Qualificando... ${ev.found}/${ev.target} leads encontrados`);
              break;
            case "done":
              doneRecebido = true;
              setStatus(ev.inserted > 0 ? "Finalizando lista..." : "Concluído — nenhum lead novo");
              pushLog(`Coleta finalizada. ${ev.inserted} leads encontrados no banco.`);
              break;
            case "error":
              streamHadError = true;
              setStatus(`Erro: ${sanitizeGoogleMapsUserMessage(ev.message)}`);
              pushLog(`✖ ${sanitizeGoogleMapsUserMessage(ev.message)}`);
              toast.error(sanitizeGoogleMapsUserMessage(ev.message));
              break;
          }
        },
        controller.signal,
      );

      // Vincula os leads inseridos em uma nova lista persistida
      const ids = insertedIdsRef.current;
      if (ids.length > 0) {
        try {
          const nomeFinal = resolveListName(nomeListaCustom, nicho, cidade, uf);
          const lista = await criarListaComLeads({
            name: nomeFinal,
            niche: nicho,
            city: cidade,
            uf,
            fonte: "apify",
            radius: raio,
            leadIds: ids,
          });

          setListaCriadaId(lista.id);
          pushLog(
            `🗂️ Lista salva: "${lista.name}" (${ids.length} leads). Acesse em "Minhas Listas".`,
          );
          setStatus(
            streamHadError
              ? `Parcial — ${ids.length} leads vinculados à lista`
              : `Concluído — ${ids.length} leads vinculados à lista`,
          );
          toast.success(`Lista "${lista.name}" criada com ${ids.length} leads!`);

          posthog.capture("search_leads_done", {
            inserted: ids.length,
            partial: streamHadError,
          });
          posthog.capture("lead_list_created", {
            list_id: lista.id,
            total: ids.length,
            nicho,
            cidade,
            uf,
            fonte: "apify",
          });

          onFinished?.();
        } catch (err) {
          const msg = sanitizeGoogleMapsUserMessage(
            (err as Error).message ?? "Falha ao vincular leads à lista",
          );
          pushLog(`⚠️ Atenção: ${msg}`);
          toast.error(msg);
        }
      }
      if (!doneRecebido && !streamHadError) {
        setIsParcial(true);
        setStatus("Parcial — conexão encerrada");
        pushLog("⚠️ Conexão encerrada antes da confirmação terminal.");
      }
    } catch (err) {
      setIsParcial(true);
      if ((err as Error).name !== "AbortError") {
        const msg = sanitizeGoogleMapsUserMessage(
          (err as Error).message ?? "Erro inesperado na busca",
        );
        setStatus(`Erro: ${msg}`);
        pushLog(`✖ ${msg}`);
        toast.error(msg);
      }
    } finally {
      setRunning(false);
    }
  };

  // Interrupção honesta da busca pelo usuário
  const handleCancelarBusca = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setRunning(false);
    setIsParcial(true);
    setStatus("Interrompido pelo usuário");
    pushLog("⏹️ Prospecção interrompida pelo usuário no navegador.");
    toast.info("Busca interrompida. Os leads já capturados foram preservados.");
  };

  // Renderização da Tela 02: Prospecção em Andamento
  if (activeView === "running") {
    return (
      <GoogleMapsRunningView
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
        nicho={nicho}
        categoria={categoriaAtiva}
        cidade={cidade}
        uf={uf}
        raioKm={raioKm}
        limite={limite}
        nomeLista={nomeListaResolvido}
        buscarEmails={buscarEmails}
        filtrosCaptura={filtrosCaptura}
        pin={pin}
        running={running}
        leads={leads}
        logs={logs}
        status={status}
        progress={progress}
        elapsedSeconds={elapsedSeconds}
        duplicatasCount={duplicatasCount}
        onCancelarBusca={handleCancelarBusca}
        onVoltarConfiguracao={() => setActiveView("config")}
        onVerResultados={() => setActiveView("results")}
      />
    );
  }

  // Renderização da Tela 03: Resultados da Busca
  if (activeView === "results") {
    return (
      <GoogleMapsSearchResultsView
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
        nicho={nicho}
        categoria={categoriaAtiva}
        cidade={cidade}
        uf={uf}
        raioKm={raioKm}
        limite={limite}
        nomeLista={nomeListaResolvido}
        dataBusca={dataUltimaBusca}
        leads={leads}
        duplicatasCount={duplicatasCount}
        isParcial={isParcial}
        listaCriadaId={listaCriadaId}
        onNovaBusca={() => setActiveView("config")}
        onEditarPesquisa={() => setActiveView("config")}
        onVerMinhasListas={onOpenMinhasListas}
        onOpenLeads={onOpenLeads}
        onOpenCampanhas={onOpenCampanhas}
        onPrepararAbordagem={(selectedIds) => {
          setApproachSelectedIds(selectedIds);
          setActiveView("approach");
        }}
      />
    );
  }

  // Renderização da Tela 04: Preparar Abordagem Comercial
  if (activeView === "approach") {
    return (
      <GoogleMapsApproachView
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
        leads={leads}
        initialSelectedLeadIds={approachSelectedIds}
        nicho={nicho}
        categoria={categoriaAtiva}
        cidade={cidade}
        uf={uf}
        nomeLista={nomeListaResolvido}
        listaCriadaId={listaCriadaId}
        onVoltarParaResultados={() => setActiveView("results")}
        onOpenCampanhas={onOpenCampanhas}
        onOpenMinhasListas={onOpenMinhasListas}
      />
    );
  }

  // Renderização da Tela 05: Histórico de Buscas
  if (activeView === "history") {
    return (
      <GoogleMapsHistoryView
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
        onNovaBusca={() => setActiveView("config")}
        onVoltarParaConfig={() => setActiveView("config")}
        onNovaBuscaComCriterios={(criterios) => {
          setNicho(criterios.nicho);
          setCategoriaAtiva(criterios.categoria || categoriaCorrespondente(criterios.nicho));
          setCidade(criterios.cidade);
          setUf(criterios.uf);
          setRaioKm(criterios.raioKm);
          setLimite(criterios.limite);
          if (criterios.nomeLista) setNomeListaCustom(criterios.nomeLista);
          setActiveView("config");
        }}
        onVerResultadosBusca={(item) => {
          if (item.leads && item.leads.length > 0) {
            setLeads(item.leads);
            setNicho(item.nicho);
            setCategoriaAtiva(item.categoria);
            setCidade(item.cidade);
            setUf(item.uf);
            setRaioKm(item.raioKm);
            setLimite(item.solicitado);
            setDuplicatasCount(item.duplicatas);
            setListaCriadaId(item.listId || undefined);
            setDataUltimaBusca(item.dataHora);
            setActiveView("results");
          }
        }}
        onUsarLeads={(item) => {
          if (item.leads && item.leads.length > 0) {
            setLeads(item.leads);
            setNicho(item.nicho);
            setCategoriaAtiva(item.categoria);
            setCidade(item.cidade);
            setUf(item.uf);
            setApproachSelectedIds(new Set(item.leads.map((l) => l.id)));
            setListaCriadaId(item.listId || undefined);
            setActiveView("approach");
          } else {
            onOpenMinhasListas?.();
          }
        }}
        onOpenMinhasListas={onOpenMinhasListas}
        onOpenLeads={onOpenLeads}
      />
    );
  }

  return (
    <div className="min-h-screen bg-home-background text-home-foreground pb-12 select-text">
      {/* 1. Topbar Oficial */}
      <GoogleMapsTopbar
        user={user}
        unreadNotifications={unreadNotifications}
        isSuperAdmin={isSuperAdmin}
        onOpenProfile={onOpenProfile}
      />

      {/* Conteúdo Principal com espaçamentos da referência */}
      <main className="px-4 sm:px-6 lg:px-8 pt-5 space-y-5 max-w-[1680px] mx-auto">
        {/* 2. Cabeçalho: Título, Descrição e Breadcrumbs com Acesso ao Histórico */}
        <GoogleMapsHeader onOpenHistorico={() => setActiveView("history")} />

        {/* 3. Indicadores Superiores (5 cards) */}
        <GoogleMapsStatsCards stats={stats} />

        {/* 4. Composição Principal em Três Colunas */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Coluna 1: Esquerda (4 cols) — Formulário de Nichos e Categorias */}
          <section className="lg:col-span-4 rounded-2xl border border-home-border bg-home-surface/90 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-home-border/60 pb-3">
              <Radar className="size-4 text-home-orange" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Buscar por nicho e localização
              </h2>
            </div>

            {/* Nome da Lista + Nicho Livre com Autocomplete */}
            <GoogleMapsNicheInput
              nicho={nicho}
              onChangeNicho={(v) => {
                setNicho(v);
                setCategoriaAtiva(categoriaCorrespondente(v));
              }}
              nomeLista={nomeListaCustom}
              onChangeNomeLista={setNomeListaCustom}
              onSelectNicho={handleSelectNicho}
              categoriaAtiva={categoriaAtiva}
            />

            {/* Catálogo de 132 Categorias / Segmentos */}
            <GoogleMapsCategories
              nichoSelecionado={nicho}
              onSelectCategoria={(n, cat) => {
                setNicho(n);
                setCategoriaAtiva(cat);
              }}
              disabled={running}
            />
          </section>

          {/* Coluna 2: Centro (5 cols) — Localização (UF antes de Cidade), Mapa e Raio */}
          <section className="lg:col-span-5 space-y-3 relative">
            {/* Barra de Localização: UF → Cidade (IBGE) → busca → E-mails */}
            <div className="relative z-30">
              <GoogleMapsLocation
                uf={uf}
                cidade={cidade}
                onSelectUf={(novaUf) => {
                  setUf(novaUf);
                  setCidade("");
                  setPin(null);
                  setPinManual(false);
                }}
                onSelectCidade={(novaCidade) => {
                  setCidade(novaCidade);
                  void geocodar(novaCidade, uf);
                }}
                buscarEmails={buscarEmails}
                onToggleBuscarEmails={setBuscarEmails}
                disabled={running}
              />
            </div>

            {/* Mapa Interativo Leaflet Dark com Raio e Marcador */}
            <div className="relative z-10">
              <GoogleMapsMapPanel
                pin={pin}
                raioKm={raioKm}
                cidade={cidade}
                uf={uf}
                onChangeRaio={setRaioKm}
                onPickPin={(p) => {
                  setPin(p);
                  setPinManual(true);
                }}
                onSearchEndereco={handleSearchEndereco}
              />
            </div>
          </section>

          {/* Coluna 3: Direita (3 cols) — Resumo da Prospecção e Ações */}
          <section className="lg:col-span-3">
            <GoogleMapsSearchSummary
              nicho={nicho}
              categoria={categoriaAtiva}
              cidade={cidade}
              uf={uf}
              raioKm={raioKm}
              limite={limite}
              onChangeLimite={setLimite}
              maxLimite={1000}
              nomeLista={nomeListaResolvido}
              onEditarNomeLista={() => {
                const novo = window.prompt(
                  "Nome personalizado da lista:",
                  nomeListaCustom || nomeListaResolvido,
                );
                if (novo !== null) setNomeListaCustom(novo.trim());
              }}
              filtrosCaptura={filtrosCaptura}
              onToggleFiltroCaptura={handleToggleFiltroCaptura}
              buscarEmails={buscarEmails}
              running={running}
              onIniciar={handleIniciarProspeccao}
              onSalvarConfiguracao={handleSalvarConfiguracao}
            />
          </section>
        </div>

        {/* 5. Área Inferior: Resultados da Busca */}
        <section className="pt-2">
          <GoogleMapsResultsPanel
            leads={leads}
            running={running}
            status={status}
            logs={logs}
            progress={progress}
            filtrosCaptura={filtrosCaptura}
            onLimparFiltrosCaptura={() => setFiltrosCaptura([])}
            listaCriadaId={listaCriadaId}
            onVerMinhasListas={onOpenMinhasListas}
          />
        </section>
      </main>
    </div>
  );
}
