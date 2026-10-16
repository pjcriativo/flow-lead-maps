// Tela 03 — Campanhas WhatsApp Premium — Flow Business (Fidelidade Absoluta ao Layout Aprovado)
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Headphones,
  HeartHandshake,
  History,
  Info,
  Loader2,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { supabase } from "@/integrations/supabase/client";
import {
  listarChips,
  listarScripts,
  consultarElegibilidadeCampanhaWa,
  consultarMotorCampanhasWa,
  controlarCampanhaWa,
  criarRascunhoCampanhaWa,
  prepararCampanhaWa,
  reagendarCampanhaWa,
  type WaCampanhasKpis,
  type WaChipDistribuicao,
  type WaCampanhaAtividade,
  type WaScript,
  type WaChip,
} from "@/services/whatsapp";
import { listarCampanhas } from "@/services/campanhas";

export const DISPARO_EM_MASSA_BLOQUEADO = true;

// ==========================================
// TIPOS E MODELOS DE DADOS DA TELA 03
// ==========================================

export type TipoCampanha = "prospeccao" | "followup" | "relacionamento" | "promocao";
export type StatusFiltroCampanha =
  "todas" | "rascunho" | "agendada" | "em_execucao" | "concluida" | "pausada" | "falhou";

export interface CampanhaItemWa {
  id: string;
  nome: string;
  listaNome: string;
  status: "concluida" | "em_execucao" | "agendada" | "pausada" | "falhou" | "rascunho";
  enviados: number;
  entregues: number;
  taxaEntrega: number;
  respostas: number;
  taxaResposta: number;
  leads: number;
  taxaLeads: number;
  criadaEm: string;
  tipo?: TipoCampanha;
  dispatchEnabled?: boolean;
  scheduledAt?: string | null;
}

export function WaCampanhas({ onConectar }: { onConectar?: () => void } = {}) {
  // Dados de Campanhas
  const [campanhas, setCampanhas] = useState<CampanhaItemWa[]>([]);
  const [chips, setChips] = useState<WaChipDistribuicao[]>([]);
  const [atividades, setAtividades] = useState<WaCampanhaAtividade[]>([]);
  const [kpis, setKpis] = useState<WaCampanhasKpis>({
    totalCampanhas: 0,
    mensagensEnviadas: 0,
    entregues: 0,
    taxaEntrega: 0,
    respostas: 0,
    taxaResposta: 0,
    leadsGerados: 0,
    taxaLeads: 0,
    vendasAtribuidas: 0,
  });

  // Filtros
  const [busca, setBusca] = useState("");
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d">("30d");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltroCampanha>("todas");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  // Assistente de Criação de Campanha (Painel Direito)
  const [etapaAssistente, setEtapaAssistente] = useState<1 | 2 | 3 | 4>(1);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoCampanha>("prospeccao");
  const [nomeNovaCampanha, setNomeNovaCampanha] = useState("");
  const [listaSelecionadaId, setListaSelecionadaId] = useState<string>("");
  const [listasDisponiveis, setListasDisponiveis] = useState<
    { id: string; name: string; count?: number }[]
  >([]);
  const [elegibilidade, setElegibilidade] = useState({ total: 0, elegiveis: 0 });
  const [textoMensagem, setTextoMensagem] = useState(
    "Olá, {nome}! Tudo bem? Vi que o {empresa} é referência em gastronomia. Gostaria de apresentar uma oportunidade exclusiva de aceleração comercial.",
  );
  const [scripts, setScripts] = useState<WaScript[]>([]);
  const [salvandoRascunho, setSalvandoRascunho] = useState(false);
  const [acaoCampanhaId, setAcaoCampanhaId] = useState<string | null>(null);
  const [agendamento, setAgendamento] = useState("");
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo");
  const [reagendamentoDetalhes, setReagendamentoDetalhes] = useState("");

  // Modais de Apoio
  const [modalDetalhes, setModalDetalhes] = useState<CampanhaItemWa | null>(null);
  const [modalTodasAtividades, setModalTodasAtividades] = useState(false);
  const [modalTodosChips, setModalTodosChips] = useState(false);

  // Carregar dados reais do Supabase
  const carregarDadosReais = useCallback(async () => {
    try {
      const context = await getActiveOrganizationContext();
      const [engineRes, campsDb, listasDb, scriptsDb, chipsDb] = await Promise.allSettled([
        consultarMotorCampanhasWa(),
        listarCampanhas("whatsapp", context.orgId),
        supabase.from("lead_lists").select("id, name").eq("org_id", context.orgId).order("name"),
        listarScripts(),
        listarChips(),
      ]);

      if (engineRes.status === "fulfilled") {
        const metrics = engineRes.value.metrics;
        setKpis({
          totalCampanhas: engineRes.value.campaigns.length,
          mensagensEnviadas: metrics.sent,
          entregues: metrics.delivered,
          taxaEntrega:
            metrics.sent > 0 ? Math.round((metrics.delivered / metrics.sent) * 1000) / 10 : 0,
          respostas: metrics.responses,
          taxaResposta:
            metrics.sent > 0 ? Math.round((metrics.responses / metrics.sent) * 1000) / 10 : 0,
          leadsGerados: 0,
          taxaLeads: 0,
          vendasAtribuidas: 0,
        });
      }

      if (listasDb.status === "fulfilled" && listasDb.value.data) {
        setListasDisponiveis(listasDb.value.data);
        if (listasDb.value.data.length > 0 && !listaSelecionadaId) {
          setListaSelecionadaId(listasDb.value.data[0].id);
        }
      }

      if (scriptsDb.status === "fulfilled") {
        setScripts(scriptsDb.value);
      }

      // Combina o estado operacional do motor com os nomes das listas persistidas.
      if (engineRes.status === "fulfilled") {
        const details =
          campsDb.status === "fulfilled"
            ? new Map(campsDb.value.map((campaign) => [campaign.id, campaign]))
            : new Map();
        const mapeadas: CampanhaItemWa[] = engineRes.value.campaigns.map((c) => {
          const detail = details.get(c.id);
          const enviados =
            (c.counts.accepted ?? 0) +
            (c.counts.sent ?? 0) +
            (c.counts.delivered ?? 0) +
            (c.counts.read ?? 0);
          const entregues = (c.counts.delivered ?? 0) + (c.counts.read ?? 0);
          return {
            id: c.id,
            nome: c.nome,
            listaNome: detail?.list_name || "Lista direta",
            status:
              c.status === "ativa"
                ? "em_execucao"
                : c.status === "concluida"
                  ? "concluida"
                  : c.status === "agendada"
                    ? "agendada"
                    : c.status === "pausada"
                      ? "pausada"
                      : c.status === "falhou" || c.status === "cancelada"
                        ? "falhou"
                        : "rascunho",
            enviados,
            entregues,
            taxaEntrega: enviados > 0 ? Math.round((entregues / enviados) * 1000) / 10 : 0,
            respostas: c.counts.responses ?? 0,
            taxaResposta:
              enviados > 0 ? Math.round(((c.counts.responses ?? 0) / enviados) * 1000) / 10 : 0,
            leads: 0,
            taxaLeads: 0,
            criadaEm: new Date(c.criada_em).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            tipo: "prospeccao",
            dispatchEnabled: c.dispatch_enabled,
            scheduledAt: c.scheduled_at,
          };
        });

        setCampanhas(mapeadas);
        setAtividades(
          engineRes.value.campaigns.slice(0, 6).map((campaign) => ({
            id: `campaign-${campaign.id}`,
            tipo:
              campaign.status === "concluida"
                ? "concluida"
                : campaign.status === "pausada"
                  ? "pausada"
                  : campaign.status === "falhou"
                    ? "falha"
                    : "iniciada",
            titulo:
              campaign.status === "concluida"
                ? "Campanha concluída"
                : campaign.status === "pausada"
                  ? "Campanha pausada"
                  : campaign.status === "falhou"
                    ? "Falha na campanha"
                    : "Campanha atualizada",
            subtitulo: campaign.nome,
            horario: new Date(campaign.criada_em).toLocaleDateString("pt-BR"),
            cor:
              campaign.status === "concluida"
                ? "emerald"
                : campaign.status === "pausada"
                  ? "amber"
                  : campaign.status === "falhou"
                    ? "rose"
                    : "blue",
          })),
        );
      }
      if (chipsDb.status === "fulfilled") {
        setChips(
          chipsDb.value.map((chip, index) => ({
            id: chip.id,
            nome: chip.nome,
            numero: chip.numero ?? "—",
            avatar: "/placeholder.svg",
            totalMensagens:
              engineRes.status === "fulfilled"
                ? (engineRes.value.chipMetrics[chip.id]?.sent ?? 0)
                : 0,
            porcentagem:
              engineRes.status === "fulfilled"
                ? (engineRes.value.chipMetrics[chip.id]?.percentage ?? 0)
                : 0,
            cor: (["emerald", "blue", "amber", "cyan", "purple"] as const)[index % 5],
          })),
        );
      }
    } catch (error) {
      console.error("Falha ao carregar campanhas WhatsApp", error);
      toast.error("Não foi possível carregar as campanhas desta organização.");
    }
  }, [listaSelecionadaId]);

  useEffect(() => {
    carregarDadosReais();
  }, [carregarDadosReais]);

  useEffect(() => {
    let ativo = true;
    const carregarElegibilidade = async () => {
      if (!listaSelecionadaId) {
        setElegibilidade({ total: 0, elegiveis: 0 });
        return;
      }
      const result = await consultarElegibilidadeCampanhaWa(listaSelecionadaId);
      if (!Number.isFinite(result.total) || !Number.isFinite(result.eligible)) {
        throw new Error("Não foi possível validar os destinatários da lista.");
      }
      if (ativo) {
        setElegibilidade({
          total: result.total,
          elegiveis: result.eligible,
        });
      }
    };
    void carregarElegibilidade().catch((error) => {
      if (ativo) {
        setElegibilidade({ total: 0, elegiveis: 0 });
        toast.error(error instanceof Error ? error.message : "Falha ao validar destinatários.");
      }
    });
    return () => {
      ativo = false;
    };
  }, [listaSelecionadaId]);

  // Filtragem da Tabela
  const campanhasFiltradas = useMemo(() => {
    return campanhas.filter((c) => {
      // Filtro de status
      if (statusFiltro !== "todas" && c.status !== statusFiltro) return false;

      // Filtro de busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = c.nome.toLowerCase().includes(termo);
        const matchLista = c.listaNome.toLowerCase().includes(termo);
        return matchNome || matchLista;
      }

      return true;
    });
  }, [campanhas, statusFiltro, busca]);

  // Seleção de checkboxes
  const toggleSelecaoTodas = () => {
    if (selecionadas.size === campanhasFiltradas.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(campanhasFiltradas.map((c) => c.id)));
    }
  };

  const toggleSelecaoLinha = (id: string) => {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  // Salvar Rascunho da Campanha
  const salvarRascunho = async () => {
    setSalvandoRascunho(true);
    const nomeFinal =
      nomeNovaCampanha.trim() ||
      `Campanha ${tipoSelecionado.toUpperCase()} - ${new Date().toLocaleDateString("pt-BR")}`;

    try {
      if (!listaSelecionadaId) throw new Error("Selecione uma lista.");
      const campanhaCriada = await criarRascunhoCampanhaWa({
        name: nomeFinal,
        listId: listaSelecionadaId,
        message: textoMensagem,
        campaignType: tipoSelecionado,
        scheduledAt: agendamento ? new Date(agendamento).toISOString() : null,
        timezone: fusoHorario,
      });
      const novaCamp: CampanhaItemWa = {
        id: campanhaCriada.id,
        nome: nomeFinal,
        listaNome:
          listasDisponiveis.find((l) => l.id === listaSelecionadaId)?.name || "Lista selecionada",
        status: "rascunho",
        enviados: 0,
        entregues: 0,
        taxaEntrega: 0,
        respostas: 0,
        taxaResposta: 0,
        leads: 0,
        taxaLeads: 0,
        criadaEm: new Date(campanhaCriada.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        tipo: tipoSelecionado,
        scheduledAt: agendamento ? new Date(agendamento).toISOString() : null,
      };

      setCampanhas((prev) => [novaCamp, ...prev]);
      setAtividades((prev) => [
        {
          id: `atv-${Date.now()}`,
          tipo: "iniciada",
          titulo: "Rascunho salvo",
          subtitulo: nomeFinal,
          horario: "Agora",
          cor: "blue",
        },
        ...prev,
      ]);

      toast.success(`Campanha "${nomeFinal}" salva como rascunho com sucesso.`);
      setEtapaAssistente(1);
      setNomeNovaCampanha("");
      await carregarDadosReais();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar o rascunho.");
    } finally {
      setSalvandoRascunho(false);
    }
  };

  // Inserir variável no texto
  const executarAcaoCampanha = async (
    campanha: CampanhaItemWa,
    action: "prepare" | "pause" | "resume" | "cancel",
  ) => {
    setAcaoCampanhaId(campanha.id);
    try {
      if (action === "prepare") {
        const result = await prepararCampanhaWa({
          campaignId: campanha.id,
          purpose: campanha.tipo ?? "prospeccao",
          scheduledAt: campanha.scheduledAt ?? null,
          timezone: fusoHorario,
        });
        toast.success(
          `${result.queued} itens preparados; ${result.blocked} bloqueados. Envio permanece desativado.`,
        );
      } else {
        await controlarCampanhaWa(
          campanha.id,
          action,
          action === "cancel" ? "Cancelada pelo operador." : undefined,
        );
        toast.success(
          action === "pause"
            ? "Campanha pausada."
            : action === "resume"
              ? "Campanha retomada."
              : "Campanha cancelada.",
        );
      }
      await carregarDadosReais();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar a campanha.");
    } finally {
      setAcaoCampanhaId(null);
    }
  };

  const reagendarCampanhaSelecionada = async () => {
    if (!modalDetalhes || !reagendamentoDetalhes) return;
    setAcaoCampanhaId(modalDetalhes.id);
    try {
      await reagendarCampanhaWa(
        modalDetalhes.id,
        new Date(reagendamentoDetalhes).toISOString(),
        fusoHorario,
      );
      toast.success("Agendamento atualizado.");
      setModalDetalhes(null);
      setReagendamentoDetalhes("");
      await carregarDadosReais();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao reagendar a campanha.");
    } finally {
      setAcaoCampanhaId(null);
    }
  };

  const inserirVariavel = (variavel: string) => {
    setTextoMensagem((prev) => prev + ` {${variavel}}`);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. SEIS INDICADORES SUPERIORES (ETAPA 3 DO PROMPT)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* KPI 1: Campanhas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-cyan-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.totalCampanhas}</div>
            <div className="truncate text-xs font-medium text-home-muted">Campanhas</div>
          </div>
        </div>

        {/* KPI 2: Mensagens enviadas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.mensagensEnviadas.toLocaleString("pt-BR")}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Mensagens enviadas</div>
          </div>
        </div>

        {/* KPI 3: Entregues */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                {kpis.entregues.toLocaleString("pt-BR")}
              </span>
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-bold text-emerald-400">
                {kpis.taxaEntrega}%
              </span>
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Entregues</div>
          </div>
        </div>

        {/* KPI 4: Respostas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-rose-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                {kpis.respostas.toLocaleString("pt-BR")}
              </span>
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-bold text-emerald-400">
                {kpis.taxaResposta}%
              </span>
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Respostas</div>
          </div>
        </div>

        {/* KPI 5: Leads gerados */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white">
                {kpis.leadsGerados}
              </span>
              <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px] font-bold text-emerald-400">
                {kpis.taxaLeads}%
              </span>
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Leads gerados</div>
          </div>
        </div>

        {/* KPI 6: Vendas atribuídas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.vendasAtribuidas > 0
                ? `R$ ${kpis.vendasAtribuidas.toLocaleString("pt-BR")}`
                : "Indisponível"}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Vendas atribuídas</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRID PRINCIPAL: TABELA + ASSISTENTE DE CRIAÇÃO        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ======================================================== */}
        {/* PAINEL ESQUERDO: TABELA DE CAMPANHAS WHATSAPP (Lg: col-8)*/}
        {/* ======================================================== */}
        <div className="flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-xl lg:col-span-8 space-y-4">
          {/* Header da Tabela */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <SiWhatsapp className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-base font-extrabold text-white">Campanhas WhatsApp</h2>
                <p className="text-xs text-home-muted">
                  Gerencie suas campanhas e acompanhe os resultados em tempo real
                </p>
              </div>
            </div>

            {/* Botão + Nova Campanha */}
            <button
              type="button"
              onClick={() => {
                setEtapaAssistente(1);
                toast.info("Preencha o assistente ao lado para criar sua campanha.");
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-home-orange px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.4)] transition-all hover:bg-orange-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Nova campanha
            </button>
          </div>

          {/* Barra de Busca e Filtro de Período */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar campanhas..."
                className="h-9 w-full rounded-xl border-[#1b2334] bg-[#111723] pl-9 pr-4 text-xs text-white placeholder:text-home-muted/60 focus-visible:ring-1 focus-visible:ring-home-orange"
              />
            </div>

            {/* Dropdown de Período */}
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as "7d" | "30d" | "90d")}
              className="h-9 rounded-xl border border-[#1b2334] bg-[#111723] px-3 text-xs text-white focus:outline-none"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {(
              [
                { key: "todas", label: `Todas (${campanhas.length})` },
                {
                  key: "rascunho",
                  label: `Rascunho (${campanhas.filter((c) => c.status === "rascunho").length})`,
                },
                {
                  key: "agendada",
                  label: `Agendada (${campanhas.filter((c) => c.status === "agendada").length})`,
                },
                {
                  key: "em_execucao",
                  label: `Em execução (${campanhas.filter((c) => c.status === "em_execucao").length})`,
                },
                {
                  key: "concluida",
                  label: `Concluída (${campanhas.filter((c) => c.status === "concluida").length})`,
                },
                {
                  key: "pausada",
                  label: `Pausada (${campanhas.filter((c) => c.status === "pausada").length})`,
                },
                {
                  key: "falhou",
                  label: `Falhou (${campanhas.filter((c) => c.status === "falhou").length})`,
                },
              ] as { key: StatusFiltroCampanha; label: string }[]
            ).map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFiltro(st.key)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  statusFiltro === st.key
                    ? "border border-home-orange bg-home-orange/10 text-white font-bold shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Tabela de Campanhas */}
          <div className="overflow-x-auto rounded-xl border border-[#1b2334] scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#1b2334] bg-[#0e131f] text-home-muted font-bold">
                <tr>
                  <th className="p-3 w-8">
                    <Checkbox
                      checked={
                        selecionadas.size === campanhasFiltradas.length &&
                        campanhasFiltradas.length > 0
                      }
                      onCheckedChange={toggleSelecaoTodas}
                      className="border-white/20 data-[state=checked]:bg-home-orange data-[state=checked]:border-home-orange"
                    />
                  </th>
                  <th className="p-3">Nome da campanha</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Enviados</th>
                  <th className="p-3 text-right">Entregues</th>
                  <th className="p-3 text-right">Respostas</th>
                  <th className="p-3 text-right">Leads</th>
                  <th className="p-3">Criada em</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2334] bg-[#0c101a]">
                {campanhasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-home-muted">
                      Nenhuma campanha encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  campanhasFiltradas.map((c) => {
                    const sel = selecionadas.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          "transition-colors hover:bg-white/[0.02]",
                          sel && "bg-home-orange/[0.04]",
                        )}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={sel}
                            onCheckedChange={() => toggleSelecaoLinha(c.id)}
                            className="border-white/20 data-[state=checked]:bg-home-orange data-[state=checked]:border-home-orange"
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white">{c.nome}</div>
                          <div className="text-[11px] text-home-muted">Lista: {c.listaNome}</div>
                        </td>
                        <td className="p-3">
                          {c.status === "concluida" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#0d2218] px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Concluída
                            </span>
                          )}
                          {c.status === "em_execucao" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-[#0d1a2d] px-2.5 py-1 text-[11px] font-semibold text-blue-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                              Em execução
                            </span>
                          )}
                          {c.status === "agendada" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-[#1c1228] px-2.5 py-1 text-[11px] font-semibold text-purple-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                              Agendada
                            </span>
                          )}
                          {c.status === "pausada" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#251b0f] px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              Pausada
                            </span>
                          )}
                          {c.status === "falhou" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-[#2b1016] px-2.5 py-1 text-[11px] font-semibold text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              Falhou
                            </span>
                          )}
                          {c.status === "rascunho" && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#141a26] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Rascunho
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-semibold text-white">
                          {c.enviados.toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-white">
                            {c.entregues.toLocaleString("pt-BR")}
                          </div>
                          {c.enviados > 0 && (
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {c.taxaEntrega}%
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-white">
                            {c.respostas.toLocaleString("pt-BR")}
                          </div>
                          {c.enviados > 0 && (
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {c.taxaResposta}%
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-semibold text-white">{c.leads}</div>
                          {c.enviados > 0 && (
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {c.taxaLeads}%
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-home-muted font-medium whitespace-nowrap">
                          {c.criadaEm}
                        </td>
                        <td className="p-3 text-center">
                          <div className="relative group/acoes inline-block">
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-home-muted hover:text-white transition-all"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-8 z-50 hidden group-hover/acoes:block w-40 rounded-xl border border-[#1b2334] bg-[#111723] p-1.5 shadow-xl text-left">
                              <button
                                onClick={() => {
                                  setModalDetalhes(c);
                                  setReagendamentoDetalhes("");
                                }}
                                className="w-full px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                              >
                                <Eye className="h-3.5 w-3.5 text-cyan-400" /> Detalhes
                              </button>
                              {c.status === "rascunho" && (
                                <button
                                  onClick={() => void executarAcaoCampanha(c, "prepare")}
                                  disabled={acaoCampanhaId === c.id}
                                  className="w-full px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                  <Clock className="h-3.5 w-3.5 text-purple-400" /> Preparar fila
                                </button>
                              )}
                              {(c.status === "pausada" ||
                                c.status === "em_execucao" ||
                                c.status === "agendada") && (
                                <button
                                  onClick={() =>
                                    void executarAcaoCampanha(
                                      c,
                                      c.status === "pausada" ? "resume" : "pause",
                                    )
                                  }
                                  disabled={acaoCampanhaId === c.id}
                                  className="w-full px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                  {c.status === "pausada" ? (
                                    <>
                                      <Play className="h-3.5 w-3.5 text-emerald-400" /> Retomar
                                    </>
                                  ) : (
                                    <>
                                      <Pause className="h-3.5 w-3.5 text-amber-400" /> Pausar
                                    </>
                                  )}
                                </button>
                              )}
                              {!["concluida", "falhou"].includes(c.status) && (
                                <button
                                  onClick={() => void executarAcaoCampanha(c, "cancel")}
                                  disabled={acaoCampanhaId === c.id}
                                  className="w-full px-2.5 py-1.5 text-xs text-rose-300 hover:bg-white/5 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PAINEL DIREITO: CRIAR NOVA CAMPANHA (Lg: col-4)          */}
        {/* ======================================================== */}
        <div className="flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-xl lg:col-span-4 space-y-4">
          {/* Header do Assistente */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <SiWhatsapp className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-base font-extrabold text-white">Criar nova campanha</h2>
              <p className="text-xs text-home-muted">
                Dispare mensagens para seus leads em poucos passos
              </p>
            </div>
          </div>

          {/* Stepper Horizontal de 4 Etapas */}
          <div className="flex items-center justify-between border-y border-[#1b2334] py-3 px-1">
            {[
              { num: 1, label: "Tipo" },
              { num: 2, label: "Público" },
              { num: 3, label: "Mensagem" },
              { num: 4, label: "Revisão" },
            ].map((st, i, arr) => {
              const ativo = etapaAssistente === st.num;
              const concluido = etapaAssistente > st.num;
              return (
                <div key={st.num} className="flex items-center gap-1.5 flex-1 last:flex-none">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                      ativo && "bg-home-orange text-white shadow-[0_0_10px_rgba(255,98,0,0.6)]",
                      concluido && "bg-emerald-500 text-white",
                      !ativo && !concluido && "bg-[#161d2b] text-home-muted border border-white/10",
                    )}
                  >
                    {concluido ? <Check className="h-3 w-3" /> : st.num}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold whitespace-nowrap",
                      ativo
                        ? "text-home-orange font-bold"
                        : concluido
                          ? "text-white"
                          : "text-home-muted",
                    )}
                  >
                    {st.label}
                  </span>
                  {i < arr.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2",
                        concluido ? "bg-emerald-500/50" : "bg-[#1b2334]",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Conteúdo da Etapa 1: Tipo de campanha */}
          {etapaAssistente === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Tipo de campanha
              </div>

              {/* 4 Opções em Grid 2x2 */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Prospecção */}
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("prospeccao")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all space-y-1.5",
                    tipoSelecionado === "prospeccao"
                      ? "border-home-orange bg-[#1c1815] shadow-sm"
                      : "border-[#1b2334] bg-[#111723] hover:border-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      tipoSelecionado === "prospeccao"
                        ? "bg-home-orange/20 text-home-orange"
                        : "bg-white/5 text-home-muted",
                    )}
                  >
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Prospecção</div>
                    <div className="text-[11px] text-home-muted leading-tight">
                      Conquiste novos clientes
                    </div>
                  </div>
                </button>

                {/* 2. Follow-up */}
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("followup")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all space-y-1.5",
                    tipoSelecionado === "followup"
                      ? "border-home-orange bg-[#1c1815] shadow-sm"
                      : "border-[#1b2334] bg-[#111723] hover:border-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      tipoSelecionado === "followup"
                        ? "bg-home-orange/20 text-home-orange"
                        : "bg-white/5 text-home-muted",
                    )}
                  >
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Follow-up</div>
                    <div className="text-[11px] text-home-muted leading-tight">
                      Reative oportunidades
                    </div>
                  </div>
                </button>

                {/* 3. Relacionamento */}
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("relacionamento")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all space-y-1.5",
                    tipoSelecionado === "relacionamento"
                      ? "border-home-orange bg-[#1c1815] shadow-sm"
                      : "border-[#1b2334] bg-[#111723] hover:border-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      tipoSelecionado === "relacionamento"
                        ? "bg-home-orange/20 text-home-orange"
                        : "bg-white/5 text-home-muted",
                    )}
                  >
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Relacionamento</div>
                    <div className="text-[11px] text-home-muted leading-tight">
                      Mantenha contato com sua base
                    </div>
                  </div>
                </button>

                {/* 4. Promoção */}
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("promocao")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all space-y-1.5",
                    tipoSelecionado === "promocao"
                      ? "border-home-orange bg-[#1c1815] shadow-sm"
                      : "border-[#1b2334] bg-[#111723] hover:border-white/10",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      tipoSelecionado === "promocao"
                        ? "bg-home-orange/20 text-home-orange"
                        : "bg-white/5 text-home-muted",
                    )}
                  >
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Promoção</div>
                    <div className="text-[11px] text-home-muted leading-tight">
                      Divulgue ofertas e novidades
                    </div>
                  </div>
                </button>
              </div>

              {/* Botão Continuar */}
              <button
                type="button"
                onClick={() => setEtapaAssistente(2)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-home-orange py-3 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,98,0,0.4)] transition-all hover:bg-orange-600 active:scale-95"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Conteúdo da Etapa 2: Público */}
          {etapaAssistente === 2 && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div className="space-y-1">
                <Label className="text-white font-bold">Nome da Campanha</Label>
                <Input
                  value={nomeNovaCampanha}
                  onChange={(e) => setNomeNovaCampanha(e.target.value)}
                  placeholder="Ex: Prospecção de Restaurantes São Paulo"
                  className="bg-[#111723] border-[#1b2334] text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-white font-bold">Selecionar Lista de Leads</Label>
                <select
                  value={listaSelecionadaId}
                  onChange={(e) => setListaSelecionadaId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-[#1b2334] bg-[#111723] px-3 text-xs text-white focus:outline-none"
                >
                  <option value="">Selecione uma lista de leads...</option>
                  {listasDisponiveis.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resumo do público */}
              <div className="rounded-xl border border-[#1b2334] bg-[#111723] p-3 space-y-2">
                <div className="font-bold text-white">Resumo de Elegibilidade</div>
                <div className="flex justify-between text-home-muted">
                  <span>Contatos na lista:</span>
                  <span className="font-bold text-white">{elegibilidade.total} contatos</span>
                </div>
                <div className="flex justify-between text-home-muted">
                  <span>Com WhatsApp válido:</span>
                  <span className="font-bold text-emerald-400">
                    {elegibilidade.elegiveis} elegíveis (
                    {elegibilidade.total
                      ? Math.round((elegibilidade.elegiveis / elegibilidade.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="flex justify-between text-home-muted">
                  <span>Sem WhatsApp / Bloqueados:</span>
                  <span className="font-bold text-rose-400">
                    {Math.max(0, elegibilidade.total - elegibilidade.elegiveis)} excluídos
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEtapaAssistente(1)}
                  className="flex-1 border-[#1b2334] text-home-muted"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setEtapaAssistente(3)}
                  className="flex-1 bg-home-orange text-white hover:bg-orange-600"
                >
                  Continuar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo da Etapa 3: Mensagem */}
          {etapaAssistente === 3 && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-bold">Mensagem do Disparo</Label>
                  <span className="text-[10px] text-home-muted">
                    {textoMensagem.length} caracteres
                  </span>
                </div>
                <Textarea
                  value={textoMensagem}
                  onChange={(e) => setTextoMensagem(e.target.value)}
                  rows={4}
                  className="bg-[#111723] border-[#1b2334] text-white text-xs leading-relaxed"
                />
              </div>

              {/* Variáveis rápidas */}
              <div className="space-y-1">
                <span className="text-home-muted font-bold text-[11px]">
                  Variáveis disponíveis:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["nome", "empresa", "cargo", "telefone"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => inserirVariavel(v)}
                      className="rounded-lg border border-white/10 bg-[#161d2b] px-2 py-0.5 text-[10px] text-cyan-300 hover:border-cyan-400"
                    >
                      +{`{${v}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview no WhatsApp */}
              <div className="rounded-xl border border-emerald-500/20 bg-[#080b12] p-3 space-y-1.5">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <SiWhatsapp className="h-3 w-3" /> Prévia da mensagem
                </div>
                <div className="rounded-lg bg-[#0e3b2e] p-2.5 text-xs text-[#e6f4ee] leading-relaxed shadow-sm">
                  {textoMensagem
                    .replace(/{nome}/g, "Carla")
                    .replace(/{empresa}/g, "Restaurante Sabor & Arte")}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEtapaAssistente(2)}
                  className="flex-1 border-[#1b2334] text-home-muted"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => setEtapaAssistente(4)}
                  className="flex-1 bg-home-orange text-white hover:bg-orange-600"
                >
                  Revisar <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Conteúdo da Etapa 4: Revisão */}
          {etapaAssistente === 4 && (
            <div className="space-y-4 animate-in fade-in text-xs">
              <div className="rounded-xl border border-[#1b2334] bg-[#111723] p-3.5 space-y-2.5">
                <div className="font-bold text-white text-sm">Resumo da Campanha</div>
                <div className="space-y-1.5 text-home-muted">
                  <div>
                    <span className="font-bold text-white">Tipo:</span>{" "}
                    {tipoSelecionado.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-white">Nome:</span>{" "}
                    {nomeNovaCampanha || `Campanha ${tipoSelecionado.toUpperCase()}`}
                  </div>
                  <div>
                    <span className="font-bold text-white">Destinatários:</span>{" "}
                    {elegibilidade.elegiveis} leads elegíveis
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="wa-campaign-schedule" className="text-[11px] text-home-muted">
                      Agendar para (opcional)
                    </Label>
                    <Input
                      id="wa-campaign-schedule"
                      type="datetime-local"
                      value={agendamento}
                      onChange={(event) => setAgendamento(event.target.value)}
                      className="h-8 border-[#1b2334] bg-[#0c101a] text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wa-campaign-timezone" className="text-[11px] text-home-muted">
                      Fuso horÃ¡rio
                    </Label>
                    <select
                      id="wa-campaign-timezone"
                      value={fusoHorario}
                      onChange={(event) => setFusoHorario(event.target.value)}
                      className="h-8 w-full rounded-md border border-[#1b2334] bg-[#0c101a] px-2 text-xs text-white"
                    >
                      <option value="America/Sao_Paulo">BrasÃ­lia (America/Sao_Paulo)</option>
                      <option value="America/Manaus">Manaus (America/Manaus)</option>
                      <option value="America/Rio_Branco">Rio Branco (America/Rio_Branco)</option>
                    </select>
                  </div>
                </div>

                {/* Alerta de Segurança e Disparo a Frio */}
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Disparo em massa temporariamente bloqueado:</span>{" "}
                    Para proteger sua reputação e cumprir as diretrizes anti-spam, a campanha será
                    salva como rascunho oficial. A ativação direta sem aquecimento prévio permanece
                    restrita.
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEtapaAssistente(3)}
                  className="flex-1 border-[#1b2334] text-home-muted"
                >
                  Voltar
                </Button>
                <Button
                  onClick={salvarRascunho}
                  disabled={salvandoRascunho}
                  className="flex-1 bg-home-orange text-white hover:bg-orange-600 font-bold"
                >
                  {salvandoRascunho ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Salvar Rascunho
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TRÊS CARDS INFERIORES (ETAPAS 11, 12 E 13 DO PROMPT)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* ======================================================== */}
        {/* CARD 1 (INFERIOR ESQUERDO): DESEMPENHO DAS CAMPANHAS     */}
        {/* ======================================================== */}
        <div className="flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-white">Desempenho das campanhas</h3>
                <p className="text-[11px] text-home-muted">
                  Evolução dos envios, entregas e respostas
                </p>
              </div>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as "7d" | "30d" | "90d")}
              className="rounded-lg border border-[#1b2334] bg-[#111723] px-2 py-1 text-[11px] text-white focus:outline-none"
            >
              <option value="30d">Últimos 30 dias</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>

          {/* 3 Mini-Indicadores com setinhas verdes */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="rounded-xl border border-white/5 bg-[#111723] p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-home-muted">Mensagens enviadas</span>
                <Send className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">8.547</span>
                <span className="text-[10px] font-bold text-emerald-400">↑ 12%</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#111723] p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-home-muted">Taxa de entrega</span>
                <CheckCheck className="h-3 w-3 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">92,4%</span>
                <span className="text-[10px] font-bold text-emerald-400">↑ 3%</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#111723] p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-home-muted">Taxa de resposta</span>
                <MessageCircle className="h-3 w-3 text-home-orange" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">15,7%</span>
                <span className="text-[10px] font-bold text-emerald-400">↑ 8%</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Linhas SVG com 3 Séries (Azul, Verde, Laranja) */}
          <div className="relative pt-2">
            <div className="h-36 w-full">
              <svg viewBox="0 0 500 140" className="h-full w-full overflow-visible">
                {/* Linhas de Grade Horizontais */}
                <line x1="30" y1="20" x2="490" y2="20" stroke="#1b2334" strokeDasharray="3 3" />
                <line x1="30" y1="50" x2="490" y2="50" stroke="#1b2334" strokeDasharray="3 3" />
                <line x1="30" y1="80" x2="490" y2="80" stroke="#1b2334" strokeDasharray="3 3" />
                <line x1="30" y1="110" x2="490" y2="110" stroke="#1b2334" strokeDasharray="3 3" />

                {/* Rótulos do Eixo Y */}
                <text x="5" y="24" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  1.200
                </text>
                <text x="12" y="54" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  900
                </text>
                <text x="12" y="84" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  600
                </text>
                <text x="12" y="114" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  300
                </text>
                <text x="22" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  0
                </text>

                {/* Curva 1: Enviadas (Azul) */}
                <path
                  d="M 40 115 Q 110 80, 180 60 T 320 40 T 480 30"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
                {[
                  { cx: 40, cy: 115 },
                  { cx: 115, cy: 95 },
                  { cx: 180, cy: 60 },
                  { cx: 250, cy: 45 },
                  { cx: 320, cy: 40 },
                  { cx: 400, cy: 35 },
                  { cx: 480, cy: 30 },
                ].map((pt, idx) => (
                  <circle
                    key={`bl-${idx}`}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="3"
                    fill="#3b82f6"
                    stroke="#0c101a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Curva 2: Entregues (Verde Esmeralda) */}
                <path
                  d="M 40 120 Q 110 90, 180 70 T 320 50 T 480 40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                {[
                  { cx: 40, cy: 120 },
                  { cx: 115, cy: 102 },
                  { cx: 180, cy: 70 },
                  { cx: 250, cy: 55 },
                  { cx: 320, cy: 50 },
                  { cx: 400, cy: 45 },
                  { cx: 480, cy: 40 },
                ].map((pt, idx) => (
                  <circle
                    key={`gr-${idx}`}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="3"
                    fill="#10b981"
                    stroke="#0c101a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Curva 3: Respostas (Laranja Flow Business) */}
                <path
                  d="M 40 130 Q 110 125, 180 115 T 320 100 T 480 95"
                  fill="none"
                  stroke="#ff6200"
                  strokeWidth="2.5"
                />
                {[
                  { cx: 40, cy: 130 },
                  { cx: 115, cy: 126 },
                  { cx: 180, cy: 115 },
                  { cx: 250, cy: 108 },
                  { cx: 320, cy: 100 },
                  { cx: 400, cy: 98 },
                  { cx: 480, cy: 95 },
                ].map((pt, idx) => (
                  <circle
                    key={`or-${idx}`}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="3"
                    fill="#ff6200"
                    stroke="#0c101a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* Rótulos do Eixo X */}
                <text x="35" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  01/03
                </text>
                <text x="105" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  05/03
                </text>
                <text x="175" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  10/03
                </text>
                <text x="245" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  15/03
                </text>
                <text x="315" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  20/03
                </text>
                <text x="390" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  25/03
                </text>
                <text x="465" y="138" fill="#64748b" fontSize="9" fontFamily="sans-serif">
                  30/03
                </text>
              </svg>
            </div>

            {/* Legenda do Gráfico */}
            <div className="flex items-center justify-center gap-4 pt-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Enviadas
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Entregues
              </span>
              <span className="flex items-center gap-1.5 text-home-orange">
                <span className="h-2 w-2 rounded-full bg-home-orange" /> Respostas
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 2 (INFERIOR CENTRAL): MENSAGENS POR NÚMERO          */}
        {/* ======================================================== */}
        <div className="flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-white">Mensagens por número</h3>
                <p className="text-[11px] text-home-muted">
                  Distribuição de envios entre seus chips
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalTodosChips(true)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todas
            </button>
          </div>

          {/* Lista de Chips com Barras de Progresso e Percentuais */}
          <div className="space-y-3 pt-1">
            {chips.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 text-xs">
                {/* Avatar do Chip com badge WhatsApp */}
                <div className="relative shrink-0">
                  <img
                    src={ch.avatar}
                    alt={ch.nome}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#22c55e] text-white ring-1 ring-[#0c101a]">
                    <SiWhatsapp className="h-1.5 w-1.5" />
                  </span>
                </div>

                {/* Nome e Número */}
                <div className="min-w-0 w-28 shrink-0">
                  <div className="truncate font-bold text-white text-[11px]">{ch.nome}</div>
                  <div className="truncate text-[10px] text-home-muted">{ch.numero}</div>
                </div>

                {/* Total */}
                <div className="font-bold text-white text-[11px] w-12 text-right shrink-0">
                  {ch.totalMensagens.toLocaleString("pt-BR")}
                </div>

                {/* Barra de Progresso */}
                <div className="flex-1 bg-[#161d2b] h-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      ch.cor === "emerald" && "bg-emerald-500",
                      ch.cor === "blue" && "bg-blue-500",
                      ch.cor === "amber" && "bg-home-orange",
                      ch.cor === "cyan" && "bg-cyan-500",
                      ch.cor === "purple" && "bg-purple-500",
                    )}
                    style={{ width: `${ch.porcentagem}%` }}
                  />
                </div>

                {/* Porcentagem */}
                <div className="text-[11px] text-home-muted font-semibold w-10 text-right shrink-0">
                  {ch.porcentagem}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CARD 3 (INFERIOR DIREITO): ATIVIDADE RECENTE             */}
        {/* ======================================================== */}
        <div className="flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-5 shadow-xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-white">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-white">Atividade recente</h3>
                <p className="text-[11px] text-home-muted">
                  Últimas ações realizadas nas campanhas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalTodasAtividades(true)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Ver todas
            </button>
          </div>

          {/* Lista de Atividades com Ícones Coloridos */}
          <div className="space-y-3 pt-1">
            {atividades.slice(0, 6).map((atv) => (
              <div key={atv.id} className="flex items-start gap-3 text-xs">
                {/* Ícone com badge colorido */}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-1.5",
                    atv.cor === "emerald" && "bg-emerald-500/15 text-emerald-400",
                    atv.cor === "blue" && "bg-blue-500/15 text-blue-400",
                    atv.cor === "amber" && "bg-amber-500/15 text-amber-400",
                    atv.cor === "rose" && "bg-rose-500/15 text-rose-400",
                  )}
                >
                  {atv.tipo === "concluida" && <Check className="h-3.5 w-3.5" />}
                  {atv.tipo === "iniciada" && <Play className="h-3.5 w-3.5" />}
                  {atv.tipo === "resposta" && <MessageCircle className="h-3.5 w-3.5" />}
                  {atv.tipo === "lead" && <UserCheck className="h-3.5 w-3.5" />}
                  {atv.tipo === "pausada" && <Pause className="h-3.5 w-3.5" />}
                  {atv.tipo === "falha" && <AlertCircle className="h-3.5 w-3.5" />}
                </div>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="truncate font-bold text-white text-[11px]">{atv.titulo}</div>
                  <div className="truncate text-[10px] text-home-muted">{atv.subtitulo}</div>
                </div>

                {/* Horário */}
                <span className="shrink-0 text-[10px] text-home-muted font-medium">
                  {atv.horario}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAIS E DIÁLOGOS DE AÇÃO                             */}
      {/* ======================================================== */}

      {/* Modal: Detalhes da Campanha */}
      {modalDetalhes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">
                Detalhes da Campanha: {modalDetalhes.nome}
              </h3>
              <button
                onClick={() => setModalDetalhes(null)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Status:</span>
                <div className="font-bold text-white uppercase">{modalDetalhes.status}</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Lista Vinculada:</span>
                <div className="font-bold text-white">{modalDetalhes.listaNome}</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Total de Envios:</span>
                <div className="font-bold text-white">
                  {modalDetalhes.enviados.toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Taxa de Entrega:</span>
                <div className="font-bold text-emerald-400">{modalDetalhes.taxaEntrega}%</div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Respostas Recebidas:</span>
                <div className="font-bold text-white">
                  {modalDetalhes.respostas} ({modalDetalhes.taxaResposta}%)
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-1">
                <span className="text-home-muted">Criada em:</span>
                <div className="font-bold text-white">{modalDetalhes.criadaEm}</div>
              </div>
            </div>

            {["agendada", "pausada", "em_execucao"].includes(modalDetalhes.status) && (
              <div className="rounded-xl border border-white/5 bg-[#111723] p-3 space-y-2">
                <Label htmlFor="reagendamento-campanha" className="text-xs text-home-muted">
                  Alterar agendamento antes do processamento
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="reagendamento-campanha"
                    type="datetime-local"
                    value={reagendamentoDetalhes}
                    onChange={(event) => setReagendamentoDetalhes(event.target.value)}
                    className="border-[#1b2334] bg-[#0c101a] text-white"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!reagendamentoDetalhes || acaoCampanhaId === modalDetalhes.id}
                    onClick={() => void reagendarCampanhaSelecionada()}
                    className="bg-[#ff6200] text-white hover:bg-[#ff7a26]"
                  >
                    Reagendar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalDetalhes(null)}
                className="border-[#1b2334] text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Todas as Atividades */}
      {modalTodasAtividades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Histórico de Atividades</h3>
              <button
                onClick={() => setModalTodasAtividades(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 scrollbar-thin">
              {atividades.map((atv) => (
                <div
                  key={atv.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-[#111723] text-xs"
                >
                  <div className="font-bold text-white flex-1">
                    {atv.titulo} — {atv.subtitulo}
                  </div>
                  <div className="text-home-muted text-[10px]">{atv.horario}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalTodasAtividades(false)}
                className="border-[#1b2334] text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ver Todos os Chips */}
      {modalTodosChips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">
                Distribuição por Número / Chip
              </h3>
              <button
                onClick={() => setModalTodosChips(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 scrollbar-thin">
              {chips.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#111723] text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{ch.nome}</div>
                    <div className="text-home-muted">{ch.numero}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">
                      {ch.totalMensagens.toLocaleString("pt-BR")} msgs
                    </div>
                    <div className="text-[10px] text-home-muted">{ch.porcentagem}% do total</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalTodosChips(false)}
                className="border-[#1b2334] text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
