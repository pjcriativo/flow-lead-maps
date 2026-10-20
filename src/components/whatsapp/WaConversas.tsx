// Central de Conversas WhatsApp Premium — Flow Business (Fidelidade Absoluta ao Layout Aprovado)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  ChevronDown,
  CircleDot,
  Clock,
  Download,
  Edit2,
  FileText,
  Filter,
  Globe,
  Headphones,
  Image as ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  MessagesSquare,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { dashboardUrlForSection } from "@/lib/dashboard-navigation";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { supabase } from "@/integrations/supabase/client";
import { listarMembrosDaOrg, type Membro } from "@/services/membros";
import {
  acaoConversaWa,
  atualizarLeadCrm,
  consultarConversasWa,
  isWhatsappAuthorizationError,
  listarConversas,
  listarLeadsVinculaveisWa,
  listarScripts,
  marcarConversaLida,
  obterKpisConversasWa,
  responderConversa,
  sincronizarAvataresConversas,
  type WaConversa,
  type WaConversaKpis,
  type WaMensagem,
  type WaLeadVinculavel,
  type WaScript,
} from "@/services/whatsapp";

const MAX_FALLBACK_FAILURES = 3;
const FALLBACK_BASE_DELAY_MS = 30_000;

// ==========================================
// TIPOS E MODELOS DE DADOS DA CENTRAL
// ==========================================

export type StatusAtendimento =
  "nao_atribuida" | "em_atendimento" | "aguardando" | "concluida" | "arquivada";
type FiltroConversa =
  | "todas"
  | "minhas"
  | "nao_atribuidas"
  | "nao_lidas"
  | "em_atendimento"
  | "aguardando"
  | "concluidas";
export type StatusComercial =
  "Lead" | "Em qualificação" | "Proposta" | "Negociação" | "Cliente" | "Perdido";
export type PipelineEtapa =
  "Prospecção" | "Qualificação" | "Proposta" | "Negociação" | "Fechamento";

export interface AnexoMsg {
  tipo: "pdf" | "imagem" | "documento" | "audio";
  nome: string;
  tamanho: string;
  url: string;
}

export interface MensagemChat {
  id: string;
  direcao: "in" | "out";
  texto: string;
  horario: string;
  statusEnvio?: "pendente" | "enviado" | "entregue" | "lido" | "falha" | "incerto";
  anexo?: AnexoMsg;
}

export interface NotaLead {
  id: string;
  texto: string;
  autor: string;
  horario: string;
}

export interface InteracaoLead {
  id: string;
  tipo: "documento" | "conversa" | "lead" | "nota" | "status";
  titulo: string;
  subtitulo: string;
  horario: string;
  cor: "rose" | "emerald" | "blue" | "amber" | "purple";
}

export interface ContatoConversa {
  id: string;
  numero: string;
  nome: string;
  avatar?: string;
  crmAvatar?: string;
  ultimaMensagem: string;
  ultimaMensagemTipo?: "texto" | "imagem" | "documento" | "audio";
  horario: string;
  naoLidas: number;
  statusAtendimento: StatusAtendimento;
  statusComercial: StatusComercial;
  pipelineEtapa: PipelineEtapa;
  responsavel: {
    nome: string;
    avatar: string;
  };
  tags: string[];
  email: string;
  empresa: string;
  cargo: string;
  origem: string;
  dataCadastro: string;
  online: boolean;
  notas: NotaLead[];
  interacoes: InteracaoLead[];
  mensagens: MensagemChat[];
  leadId?: string;
  assignedTo?: string;
  proposal?: {
    id: string;
    assunto: string;
    valor: number | null;
    status: string;
  };
}

function iniciaisDoContato(nome: string, numero: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length > 0) {
    return partes
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase();
  }
  return numero.slice(-2) || "WA";
}

function ContactAvatar({
  nome,
  numero,
  src,
  className,
  onError,
}: {
  nome: string;
  numero: string;
  src?: string;
  className?: string;
  onError?: () => void;
}) {
  return (
    <Avatar className={cn("ring-1 ring-border", className)}>
      {src ? (
        <AvatarImage src={src} alt={nome} className="object-cover" onError={onError} />
      ) : null}
      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
        {iniciaisDoContato(nome, numero)}
      </AvatarFallback>
    </Avatar>
  );
}

function crmStatusFromLead(status: unknown): StatusComercial {
  if (status === "won") return "Cliente";
  if (status === "lost") return "Perdido";
  if (status === "proposta_enviada") return "Proposta";
  if (status === "responded" || status === "meeting") return "Negociação";
  if (status === "contacted" || status === "enriched" || status === "nurture") {
    return "Em qualificação";
  }
  return "Lead";
}

function pipelineFromLead(status: unknown): PipelineEtapa {
  if (status === "won") return "Fechamento";
  if (status === "proposta_enviada") return "Proposta";
  if (status === "responded" || status === "meeting" || status === "lost") {
    return "Negociação";
  }
  if (status === "contacted" || status === "enriched" || status === "nurture") {
    return "Qualificação";
  }
  return "Prospecção";
}

export function WaConversas() {
  // Estado das conversas
  const [contatos, setContatos] = useState<ContatoConversa[]>([]);
  const [contatoAtivoId, setContatoAtivoId] = useState<string>("");
  const [kpis, setKpis] = useState<WaConversaKpis>({
    conversasAtivas: 0,
    naoLidas: 0,
    aguardandoResposta: 0,
    emAtendimento: 0,
    novosContatos: 0,
    fechamentosHoje: 0,
  });

  // Filtros e busca
  const [busca, setBusca] = useState("");
  const [tabFiltro, setTabFiltro] = useState<FiltroConversa>("todas");
  const [menuFiltroAberto, setMenuFiltroAberto] = useState(false);
  const [filtroTag, setFiltroTag] = useState<string | null>(null);

  // Composer
  const [composerTab, setComposerTab] = useState<"mensagem" | "resposta_rapida">("mensagem");
  const [textoMensagem, setTextoMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [scriptsDisponiveis, setScriptsDisponiveis] = useState<WaScript[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [usuarioAtualId, setUsuarioAtualId] = useState("");
  const [papelAtual, setPapelAtual] = useState("");
  const [buscaScript, setBuscaScript] = useState("");
  const [mostrarEmojis, setMostrarEmojis] = useState(false);

  // Modais de ações
  const [modalEditarContato, setModalEditarContato] = useState(false);
  const [modalAdicionarNota, setModalAdicionarNota] = useState(false);
  const [modalVerInteracoes, setModalVerInteracoes] = useState(false);
  const [modalAnexo, setModalAnexo] = useState(false);
  const [modalVincularLead, setModalVincularLead] = useState(false);
  const [leadsVinculaveis, setLeadsVinculaveis] = useState<WaLeadVinculavel[]>([]);
  const [buscaLead, setBuscaLead] = useState("");
  const [carregandoLeads, setCarregandoLeads] = useState(false);

  // Form states de edição
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editEmpresa, setEditEmpresa] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [novaNotaTexto, setNovaNotaTexto] = useState("");
  const [novaTagTexto, setNovaTagTexto] = useState("");
  const [tagIds, setTagIds] = useState<Record<string, string>>({});
  const [mostrarInputTag, setMostrarInputTag] = useState(false);

  // Responsividade Mobile: tela ativa ("lista", "chat", "crm")
  const [viewMobile, setViewMobile] = useState<"lista" | "chat" | "crm">("chat");

  const fimRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Contato Ativo Selecionado
  const contatoAtivo = useMemo(() => {
    return contatos.find((c) => c.id === contatoAtivoId) ?? contatos[0] ?? null;
  }, [contatos, contatoAtivoId]);
  const avatarRefreshesRef = useRef(new Set<string>());

  const renovarAvatar = useCallback(async (conversaId: string) => {
    if (avatarRefreshesRef.current.has(conversaId)) return;
    avatarRefreshesRef.current.add(conversaId);
    try {
      const avatars = await sincronizarAvataresConversas([conversaId], true);
      const avatar = avatars[conversaId];
      setContatos((current) =>
        current.map((contato) =>
          contato.id === conversaId ? { ...contato, avatar: avatar || undefined } : contato,
        ),
      );
    } catch (error) {
      console.warn("Falha ao renovar foto do contato WhatsApp", error);
    }
  }, []);

  // Carregar KPIs e scripts do banco
  const carregarDadosIniciais = useCallback(async (signal?: AbortSignal) => {
    try {
      const conversationsPromise = listarConversas(signal);
      const [kpisRes, scriptsRes, conversationsRes] = await Promise.allSettled([
        conversationsPromise.then((conversations) => obterKpisConversasWa(conversations, signal)),
        listarScripts(),
        conversationsPromise,
      ]);
      if (signal?.aborted) return;
      const failure = [kpisRes, scriptsRes, conversationsRes].find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      if (failure) throw failure.reason;

      if (kpisRes.status === "fulfilled") {
        setKpis(kpisRes.value);
      }
      if (scriptsRes.status === "fulfilled") {
        setScriptsDisponiveis(scriptsRes.value);
      }
      if (conversationsRes.status === "fulfilled") {
        const mapped = conversationsRes.value.map((conversation: WaConversa): ContatoConversa => ({
          id: conversation.id,
          numero: conversation.numero,
          nome: conversation.nome_contato || conversation.numero,
          avatar: conversation.avatar_url || undefined,
          ultimaMensagem: conversation.ultima || "",
          horario: new Date(conversation.ultima_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          naoLidas: conversation.nao_lidas,
          statusAtendimento:
            conversation.status === "archived"
              ? "arquivada"
              : conversation.status === "completed"
                ? "concluida"
                : conversation.status === "waiting_contact" ||
                    conversation.status === "waiting_agent"
                  ? "aguardando"
                  : conversation.status === "in_progress"
                    ? "em_atendimento"
                    : "nao_atribuida",
          statusComercial: "Lead",
          pipelineEtapa: "Prospecção",
          responsavel: { nome: "Equipe", avatar: "" },
          tags: [],
          email: "",
          empresa: "",
          cargo: "",
          origem: "WhatsApp",
          dataCadastro: new Date(conversation.ultima_em).toLocaleDateString("pt-BR"),
          online: false,
          notas: [],
          interacoes: [],
          mensagens: [],
          leadId: conversation.lead_id ?? undefined,
          assignedTo: conversation.assigned_to ?? undefined,
        }));
        setContatos(mapped);
        setContatoAtivoId((current) => current || mapped[0]?.id || "");
        try {
          const avatars = await sincronizarAvataresConversas(
            mapped.map((contact) => contact.id),
            false,
            signal,
          );
          if (signal?.aborted) return;
          setContatos((current) =>
            current.map((contact) => ({
              ...contact,
              avatar: avatars[contact.id] || contact.avatar,
            })),
          );
        } catch (error) {
          if (!signal?.aborted) console.warn("Falha ao sincronizar fotos dos contatos", error);
        }
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Falha ao carregar conversas WhatsApp", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void carregarDadosIniciais(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [carregarDadosIniciais]);

  useEffect(() => {
    void getActiveOrganizationContext()
      .then(async (organization) => {
        setUsuarioAtualId(organization.userId);
        return listarMembrosDaOrg(organization.orgId);
      })
      .then(setMembros)
      .catch((error) => console.error("Falha ao carregar responsáveis", error));
  }, []);

  const carregarDetalhes = useCallback(
    async (conversationId: string, signal?: AbortSignal) => {
      try {
        const snapshot = await consultarConversasWa(conversationId, 0, 200, signal);
        if (signal?.aborted) return;
        setPapelAtual(snapshot.role);
        const statusMap: Record<string, MensagemChat["statusEnvio"]> = {
          pending: "pendente",
          sent: "enviado",
          delivered: "entregue",
          read: "lido",
          failed: "falha",
          uncertain: "incerto",
          received: "entregue",
        };
        const lead = snapshot.lead ?? {};
        const persistedTags = snapshot.tags
          .map((item) => {
            const relation = item.wa_etiquetas;
            const tag = Array.isArray(relation) ? relation[0] : relation;
            return tag && typeof tag === "object" ? (tag as Record<string, unknown>) : null;
          })
          .filter((tag): tag is Record<string, unknown> => Boolean(tag));
        const tags = persistedTags.map((tag) => String(tag.name ?? "")).filter(Boolean);
        setTagIds(
          Object.fromEntries(persistedTags.map((tag) => [String(tag.name), String(tag.id)])),
        );
        setContatos((previous) =>
          previous.map((contact) =>
            contact.id !== conversationId
              ? contact
              : {
                  ...contact,
                  nome: String(lead.owner_name ?? lead.business_name ?? contact.nome),
                  email: String(lead.email ?? ""),
                  empresa: String(lead.business_name ?? ""),
                  cargo: String(lead.cargo ?? ""),
                  statusComercial: crmStatusFromLead(lead.status),
                  pipelineEtapa: pipelineFromLead(lead.status),
                  proposal: snapshot.proposal
                    ? {
                        id: snapshot.proposal.id,
                        assunto: snapshot.proposal.assunto,
                        valor: snapshot.proposal.valor,
                        status: snapshot.proposal.status,
                      }
                    : undefined,
                  tags,
                  notas: snapshot.notes.map((note) => ({
                    id: note.id,
                    texto: note.body,
                    autor:
                      membros.find((member) => member.user_id === note.author_id)?.nome ||
                      membros.find((member) => member.user_id === note.author_id)?.email ||
                      note.author_id,
                    horario: new Date(note.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })),
                  interacoes: snapshot.events.map((event) => ({
                    id: event.id,
                    tipo: "status" as const,
                    titulo: event.event_type,
                    subtitulo: "Evento registrado na conversa",
                    horario: new Date(event.occurred_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    cor: "blue" as const,
                  })),
                  mensagens: snapshot.messages.map((message: WaMensagem) => ({
                    id: message.id,
                    direcao: message.direcao === "out" ? "out" : "in",
                    texto: message.texto || (message.tipo === "text" ? "" : `[${message.tipo}]`),
                    horario: new Date(
                      message.provider_occurred_at ?? message.criado_em,
                    ).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
                    statusEnvio: statusMap[message.status],
                  })),
                },
          ),
        );
      } catch (error) {
        if (signal?.aborted) return;
        console.error("Falha ao carregar detalhes da conversa", error);
        toast.error("Não foi possível atualizar esta conversa.");
        throw error;
      }
    },
    [membros],
  );

  useEffect(() => {
    if (!contatoAtivoId) return;
    const controller = new AbortController();
    void carregarDetalhes(contatoAtivoId, controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [carregarDetalhes, contatoAtivoId]);

  // Scroll automático ao fim do chat
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contatoAtivo?.mensagens]);

  // Supabase Realtime Subscription para novas mensagens recebidas
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let polling: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let fallbackActive = false;
    let inFlight = false;
    let failures = 0;
    let authenticationSuspended = false;
    const controller = new AbortController();
    const stopFallback = () => {
      fallbackActive = false;
      if (polling) clearTimeout(polling);
      polling = null;
    };
    const scheduleFallback = () => {
      if (!fallbackActive || cancelled || authenticationSuspended || polling) return;
      const delay = Math.min(FALLBACK_BASE_DELAY_MS * 2 ** failures, 120_000);
      polling = setTimeout(refresh, delay);
    };
    const refresh = async () => {
      polling = null;
      if (cancelled || authenticationSuspended || inFlight) return;
      inFlight = true;
      try {
        await Promise.all([
          carregarDadosIniciais(controller.signal),
          contatoAtivoId ? carregarDetalhes(contatoAtivoId, controller.signal) : Promise.resolve(),
        ]);
        failures = 0;
      } catch (error) {
        failures += 1;
        if (isWhatsappAuthorizationError(error) || failures >= MAX_FALLBACK_FAILURES) {
          authenticationSuspended = true;
          stopFallback();
        }
      } finally {
        inFlight = false;
      }
      scheduleFallback();
    };
    const startFallback = () => {
      if (fallbackActive || authenticationSuspended) return;
      fallbackActive = true;
      scheduleFallback();
    };
    void getActiveOrganizationContext().then((context) => {
      if (cancelled) return;
      channel = supabase
        .channel(`wa_inbox_realtime:${context.orgId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "wa_mensagens",
            filter: `org_id=eq.${context.orgId}`,
          },
          refresh,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "wa_conversas",
            filter: `org_id=eq.${context.orgId}`,
          },
          refresh,
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") stopFallback();
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            startFallback();
          }
        });
    });

    return () => {
      cancelled = true;
      controller.abort();
      stopFallback();
      if (channel) supabase.removeChannel(channel);
    };
  }, [carregarDadosIniciais, carregarDetalhes, contatoAtivoId]);

  // Selecionar conversa
  const selecionarContato = useCallback((c: ContatoConversa) => {
    setContatoAtivoId(c.id);
    setViewMobile("chat");

    // Zera contador de não lidas localmente e no banco
    if (c.naoLidas > 0) {
      setContatos((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, naoLidas: 0 } : item)),
      );
      void marcarConversaLida(c.id).catch(() => {
        toast.error("Não foi possível marcar a conversa como lida.");
      });
    }
  }, []);

  // Enviar Mensagem
  const enviarMensagem = async () => {
    if (!contatoAtivo || !textoMensagem.trim() || enviando) return;

    const texto = textoMensagem.trim();
    const operationId = crypto.randomUUID();
    setEnviando(true);

    try {
      const resp = await responderConversa(contatoAtivo.id, texto, operationId);
      if (!resp.ok || resp.status !== "sent") {
        toast.error(
          resp.status === "uncertain"
            ? "Envio sem confirmação do provedor. Não reenvie automaticamente."
            : resp.error || "A mensagem não foi enviada.",
        );
      } else {
        setTextoMensagem("");
        toast.success("Mensagem enviada com sucesso.");
      }
      await carregarDetalhes(contatoAtivo.id);
      await carregarDadosIniciais();
    } catch (error) {
      console.error("Falha ao enviar mensagem", error);
      toast.error("A mensagem não foi confirmada. Consulte o status antes de tentar novamente.");
    } finally {
      setEnviando(false);
      textareaRef.current?.focus();
    }
  };

  // Resposta Rápida (Script)
  const aplicarScript = (script: WaScript) => {
    if (!contatoAtivo || !script.mensagem) return;
    // Substitui variáveis do template: {nome}, {empresa}
    const primeiroNome = contatoAtivo.nome.split(" ")[0];
    const textoResolvido = script.mensagem
      .replace(/{nome}/gi, primeiroNome)
      .replace(/{empresa}/gi, contatoAtivo.empresa || "sua empresa");

    setTextoMensagem(textoResolvido);
    setComposerTab("mensagem");
    textareaRef.current?.focus();
    toast.success(`Script "${script.nome}" carregado na composição.`);
  };

  // Marcar como Cliente
  const marcarComoCliente = async () => {
    if (!contatoAtivo) return;
    try {
      let leadId = contatoAtivo.leadId;
      if (!leadId) {
        const conversation = await acaoConversaWa(contatoAtivo.id, "create_lead");
        leadId = typeof conversation?.lead_id === "string" ? conversation.lead_id : undefined;
      }
      if (!leadId || !(await atualizarLeadCrm(leadId, { status: "won" }))) {
        throw new Error("CRM update failed");
      }
      await carregarDetalhes(contatoAtivo.id);
      setContatos((prev) =>
        prev.map((c) =>
          c.id === contatoAtivo.id
            ? { ...c, leadId, statusComercial: "Cliente", pipelineEtapa: "Fechamento" }
            : c,
        ),
      );
      toast.success(`🎉 ${contatoAtivo.nome} marcado como Cliente!`);
    } catch (error) {
      console.error("Falha ao marcar contato como cliente", error);
      toast.error("Não foi possível atualizar o cliente no CRM.");
    }
  };

  const criarLeadNoCrm = async () => {
    if (!contatoAtivo || contatoAtivo.leadId) return;
    try {
      const conversation = await acaoConversaWa(contatoAtivo.id, "create_lead");
      const leadId = typeof conversation?.lead_id === "string" ? conversation.lead_id : undefined;
      setContatos((previous) =>
        previous.map((contact) =>
          contact.id === contatoAtivo.id ? { ...contact, leadId } : contact,
        ),
      );
      await carregarDetalhes(contatoAtivo.id);
      toast.success("Lead criado e vinculado ao CRM.");
    } catch {
      toast.error("Não foi possível criar ou vincular o lead.");
    }
  };

  const abrirVinculacaoLead = async () => {
    setModalVincularLead(true);
    setCarregandoLeads(true);
    try {
      setLeadsVinculaveis(await listarLeadsVinculaveisWa());
    } catch {
      toast.error("Não foi possível carregar os leads do CRM.");
    } finally {
      setCarregandoLeads(false);
    }
  };

  const vincularLeadExistente = async (leadId: string) => {
    if (!contatoAtivo) return;
    try {
      await acaoConversaWa(contatoAtivo.id, "link_lead", { lead_id: leadId });
      setModalVincularLead(false);
      setBuscaLead("");
      await carregarDadosIniciais();
      await carregarDetalhes(contatoAtivo.id);
      toast.success("Lead existente vinculado à conversa.");
    } catch {
      toast.error("Não foi possível vincular este lead.");
    }
  };

  const leadsVinculaveisFiltrados = useMemo(() => {
    const term = buscaLead.trim().toLocaleLowerCase("pt-BR");
    if (!term) return leadsVinculaveis;
    return leadsVinculaveis.filter((lead) =>
      [lead.business_name, lead.owner_name, lead.phone, lead.whatsapp, lead.email].some((value) =>
        value?.toLocaleLowerCase("pt-BR").includes(term),
      ),
    );
  }, [buscaLead, leadsVinculaveis]);

  const assumirAtendimento = async () => {
    if (!contatoAtivo) return;
    try {
      const conversation = await acaoConversaWa(contatoAtivo.id, "claim");
      const assignedTo =
        typeof conversation?.assigned_to === "string" ? conversation.assigned_to : undefined;
      setContatos((previous) =>
        previous.map((contact) =>
          contact.id === contatoAtivo.id
            ? { ...contact, assignedTo, statusAtendimento: "em_atendimento" }
            : contact,
        ),
      );
      toast.success("Atendimento assumido.");
    } catch {
      toast.error("Esta conversa já foi assumida ou você não possui permissão.");
    }
  };

  const transferirAtendimento = async (userId: string) => {
    if (!contatoAtivo || !userId) return;
    try {
      await acaoConversaWa(contatoAtivo.id, "transfer", { user_id: userId });
      setContatos((previous) =>
        previous.map((contact) =>
          contact.id === contatoAtivo.id
            ? { ...contact, assignedTo: userId, statusAtendimento: "em_atendimento" }
            : contact,
        ),
      );
      toast.success("Atendimento transferido.");
    } catch {
      toast.error("Não foi possível transferir o atendimento.");
    }
  };

  // Arquivar Conversa
  const arquivarConversa = async () => {
    if (!contatoAtivo) return;
    try {
      await acaoConversaWa(contatoAtivo.id, "set_status", { status: "archived" });
      setContatos((prev) =>
        prev.map((c) => (c.id === contatoAtivo.id ? { ...c, statusAtendimento: "arquivada" } : c)),
      );
      toast.success(`Conversa de ${contatoAtivo.nome} arquivada.`);
    } catch {
      toast.error("Não foi possível arquivar a conversa.");
    }
  };

  // Abrir modal de edição de contato
  const abrirModalEditar = () => {
    if (!contatoAtivo) return;
    setEditNome(contatoAtivo.nome);
    setEditEmail(contatoAtivo.email);
    setEditEmpresa(contatoAtivo.empresa);
    setEditCargo(contatoAtivo.cargo);
    setEditTelefone(contatoAtivo.numero);
    setModalEditarContato(true);
  };

  // Salvar Edição do Contato
  const salvarEdicaoContato = async () => {
    if (!contatoAtivo) return;
    if (!contatoAtivo.leadId) {
      toast.info("Crie o lead no CRM antes de editar seus dados.");
      return;
    }
    try {
      const updated = await atualizarLeadCrm(contatoAtivo.leadId, {
        owner_name: editNome,
        email: editEmail,
        business_name: editEmpresa,
        cargo: editCargo,
        phone: editTelefone,
      });
      if (!updated) throw new Error("CRM update failed");
      await carregarDetalhes(contatoAtivo.id);
      setModalEditarContato(false);
      toast.success("Dados do contato atualizados com sucesso.");
    } catch {
      toast.error("Não foi possível atualizar os dados no CRM.");
    }
  };

  // Adicionar Nota
  const salvarNovaNota = async () => {
    if (!contatoAtivo || !novaNotaTexto.trim()) return;
    try {
      await acaoConversaWa(contatoAtivo.id, "add_note", { body: novaNotaTexto.trim() });
      setNovaNotaTexto("");
      setModalAdicionarNota(false);
      await carregarDetalhes(contatoAtivo.id);
      toast.success("Nota salva com sucesso.");
    } catch {
      toast.error("Não foi possível salvar a nota.");
    }
  };

  // Adicionar Tag
  const adicionarTag = async () => {
    if (!contatoAtivo || !novaTagTexto.trim()) return;
    const tagFormatada = novaTagTexto.trim();
    if (contatoAtivo.tags.includes(tagFormatada)) {
      toast.info("Esta etiqueta já existe no contato.");
      return;
    }
    try {
      await acaoConversaWa(contatoAtivo.id, "add_tag", { name: tagFormatada, color: "#64748b" });
      setNovaTagTexto("");
      setMostrarInputTag(false);
      await carregarDetalhes(contatoAtivo.id);
      toast.success(`Etiqueta "${tagFormatada}" aplicada.`);
    } catch {
      toast.error("Não foi possível aplicar a etiqueta.");
    }
  };

  // Remover Tag
  const removerTag = async (tagParaRemover: string) => {
    if (!contatoAtivo) return;
    const tagId = tagIds[tagParaRemover];
    if (!tagId) return;
    try {
      await acaoConversaWa(contatoAtivo.id, "remove_tag", { tag_id: tagId });
      await carregarDetalhes(contatoAtivo.id);
      toast.success(`Etiqueta "${tagParaRemover}" removida.`);
    } catch {
      toast.error("Não foi possível remover a etiqueta.");
    }
  };

  // Alterar Status Comercial (Lead, Em qualificação, etc.)
  const alterarStatusComercial = async (novoStatus: StatusComercial) => {
    if (!contatoAtivo) return;
    if (!contatoAtivo.leadId) {
      toast.info("Crie o lead no CRM antes de alterar o status comercial.");
      return;
    }
    const statusMap: Record<StatusComercial, string> = {
      Lead: "new",
      "Em qualificação": "contacted",
      Proposta: "proposta_enviada",
      Negociação: "responded",
      Cliente: "won",
      Perdido: "lost",
    };
    if (!(await atualizarLeadCrm(contatoAtivo.leadId, { status: statusMap[novoStatus] }))) {
      toast.error("Não foi possível atualizar o status no CRM.");
      return;
    }
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, statusComercial: novoStatus } : c)),
    );
    toast.success(`Status comercial alterado para "${novoStatus}".`);
  };

  // Alterar Pipeline Etapa
  const alterarPipelineEtapa = async (novaEtapa: PipelineEtapa) => {
    if (!contatoAtivo) return;
    if (!contatoAtivo.leadId) {
      toast.info("Crie o lead no CRM antes de alterar o pipeline.");
      return;
    }
    const statusMap: Record<PipelineEtapa, string> = {
      Prospecção: "new",
      Qualificação: "contacted",
      Proposta: "proposta_enviada",
      Negociação: "responded",
      Fechamento: "won",
    };
    if (!(await atualizarLeadCrm(contatoAtivo.leadId, { status: statusMap[novaEtapa] }))) {
      toast.error("Não foi possível atualizar o pipeline.");
      return;
    }
    setContatos((prev) =>
      prev.map((c) => (c.id === contatoAtivo.id ? { ...c, pipelineEtapa: novaEtapa } : c)),
    );
    toast.success(`Pipeline atualizado para "${novaEtapa}".`);
  };

  // Inserir Emoji rápido
  const inserirEmoji = (emoji: string) => {
    setTextoMensagem((prev) => prev + emoji);
    setMostrarEmojis(false);
    textareaRef.current?.focus();
  };

  const informarAnexoIndisponivel = () => {
    setModalAnexo(false);
    toast.info("Envio de mídia ainda não está disponível nesta etapa.");
  };

  const etiquetasDisponiveis = useMemo(
    () => Array.from(new Set(contatos.flatMap((contact) => contact.tags))).sort(),
    [contatos],
  );

  // Filtragem da Lista de Conversas
  const contatosFiltrados = useMemo(() => {
    return contatos.filter((c) => {
      // Filtro de Tabs
      if (tabFiltro === "nao_lidas" && c.naoLidas === 0) return false;
      if (tabFiltro === "em_atendimento" && c.statusAtendimento !== "em_atendimento") return false;
      if (tabFiltro === "minhas" && c.assignedTo !== usuarioAtualId) return false;
      if (tabFiltro === "nao_atribuidas" && c.assignedTo) return false;
      if (tabFiltro === "aguardando" && c.statusAtendimento !== "aguardando") return false;
      if (tabFiltro === "concluidas" && c.statusAtendimento !== "concluida") return false;

      // Filtro de Tag
      if (filtroTag && !c.tags.includes(filtroTag)) return false;

      // Filtro de Busca
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchNome = c.nome.toLowerCase().includes(termo);
        const matchNumero = c.numero.toLowerCase().includes(termo);
        const matchEmpresa = c.empresa.toLowerCase().includes(termo);
        const matchMensagem = c.ultimaMensagem.toLowerCase().includes(termo);
        return matchNome || matchNumero || matchEmpresa || matchMensagem;
      }

      return true;
    });
  }, [contatos, tabFiltro, filtroTag, busca, usuarioAtualId]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* 1. SEIS CARDS DE INDICADORES / KPIS (ETAPA 4 DO PROMPT)  */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* KPI 1: Conversas ativas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.conversasAtivas}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Conversas ativas</div>
          </div>
        </div>

        {/* KPI 2: Não lidas */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-rose-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
            <CircleDot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.naoLidas}</div>
            <div className="truncate text-xs font-medium text-home-muted">Não lidas</div>
          </div>
        </div>

        {/* KPI 3: Aguardando resposta */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-amber-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.aguardandoResposta}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Aguardando resposta</div>
          </div>
        </div>

        {/* KPI 4: Em atendimento */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-blue-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.emAtendimento}</div>
            <div className="truncate text-xs font-medium text-home-muted">Em atendimento</div>
          </div>
        </div>

        {/* KPI 5: Novos contatos */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">{kpis.novosContatos}</div>
            <div className="truncate text-xs font-medium text-home-muted">Novos contatos</div>
          </div>
        </div>

        {/* KPI 6: Fechamentos hoje */}
        <div className="flex items-center gap-3.5 rounded-xl border border-[#1b2334] bg-[#0c101a]/95 p-3.5 shadow-sm transition-all hover:border-emerald-500/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {kpis.fechamentosHoje}
            </div>
            <div className="truncate text-xs font-medium text-home-muted">Fechamentos hoje</div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. LAYOUT PRINCIPAL DE 3 COLUNAS (ETAPAS 5, 6 E 11)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 h-[calc(100vh-270px)] min-h-[660px]">
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS (Lg: col-span-3)     */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] overflow-hidden shadow-xl lg:col-span-3 xl:col-span-3",
            viewMobile !== "lista" && "hidden lg:flex",
          )}
        >
          {/* Top Bar: Busca e Filtro */}
          <div className="p-3.5 border-b border-[#1b2334] space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-home-muted" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar conversas, contatos ou mensagens..."
                  className="h-9 w-full rounded-xl border-[#1b2334] bg-[#111723] pl-9 pr-7 text-xs text-white placeholder:text-home-muted/60 focus-visible:ring-1 focus-visible:ring-home-orange"
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-home-muted hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Botão de Filtro */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuFiltroAberto(!menuFiltroAberto)}
                  title="Filtros"
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl border border-[#1b2334] bg-[#111723] text-home-muted transition-all hover:border-white/20 hover:text-white",
                    filtroTag && "border-home-orange text-home-orange",
                  )}
                >
                  <Filter className="h-4 w-4" />
                </button>

                {/* Popover de Filtros */}
                {menuFiltroAberto && (
                  <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-[#1b2334] bg-[#111723] p-2 shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1 text-[11px] font-bold text-home-muted uppercase tracking-wider">
                      Filtrar por etiqueta
                    </div>
                    <button
                      onClick={() => {
                        setFiltroTag(null);
                        setMenuFiltroAberto(false);
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                        filtroTag === null
                          ? "text-home-orange font-bold bg-white/5"
                          : "text-white hover:bg-white/5",
                      )}
                    >
                      Todas as etiquetas
                    </button>
                    {etiquetasDisponiveis.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setFiltroTag(tag);
                          setMenuFiltroAberto(false);
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors",
                          filtroTag === tag
                            ? "text-home-orange font-bold bg-white/5"
                            : "text-white hover:bg-white/5",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status Pills / Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setTabFiltro("todas")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "todas"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Todas ({contatos.length})
              </button>
              <button
                type="button"
                onClick={() => setTabFiltro("nao_lidas")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "nao_lidas"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Não lidas ({contatos.filter((c) => c.naoLidas > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setTabFiltro("em_atendimento")}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                  tabFiltro === "em_atendimento"
                    ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                    : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                )}
              >
                Em atendimento (
                {contatos.filter((c) => c.statusAtendimento === "em_atendimento").length})
              </button>
              {(
                [
                  [
                    "minhas",
                    `Minhas (${contatos.filter((c) => c.assignedTo === usuarioAtualId).length})`,
                  ],
                  [
                    "nao_atribuidas",
                    `Não atribuídas (${contatos.filter((c) => !c.assignedTo).length})`,
                  ],
                  [
                    "aguardando",
                    `Aguardando (${contatos.filter((c) => c.statusAtendimento === "aguardando").length})`,
                  ],
                  [
                    "concluidas",
                    `Concluídas (${contatos.filter((c) => c.statusAtendimento === "concluida").length})`,
                  ],
                ] as Array<[FiltroConversa, string]>
              ).map(([filter, label]) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTabFiltro(filter)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                    tabFiltro === filter
                      ? "border border-home-orange text-home-orange bg-home-orange/10 shadow-[0_0_12px_rgba(255,98,0,0.2)]"
                      : "border border-transparent bg-[#111723] text-home-muted hover:text-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Rolável de Contatos */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {contatosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-home-muted">
                Nenhuma conversa encontrada para o filtro atual.
              </div>
            ) : (
              contatosFiltrados.map((c) => {
                const ativo = c.id === contatoAtivoId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selecionarContato(c)}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-all",
                      ativo
                        ? "border border-home-orange bg-[#131926] shadow-sm"
                        : "border border-transparent hover:border-white/5 hover:bg-white/[0.03]",
                    )}
                  >
                    {/* Avatar com badge WhatsApp verde oficial */}
                    <div className="relative shrink-0">
                      <ContactAvatar
                        nome={c.nome}
                        numero={c.numero}
                        src={c.avatar}
                        onError={() => void renovarAvatar(c.id)}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                        <SiWhatsapp className="h-2 w-2" />
                      </span>
                    </div>

                    {/* Informações centrais */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={cn(
                              "truncate text-xs font-bold",
                              ativo ? "text-white" : "text-white group-hover:text-white",
                            )}
                          >
                            {c.nome}
                          </span>
                          <span className="text-[#22c55e]">
                            <SiWhatsapp className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-home-muted font-medium">
                          {c.horario}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-home-muted group-hover:text-slate-300">
                          {c.ultimaMensagemTipo === "imagem" && "📷 "}
                          {c.ultimaMensagemTipo === "documento" && "📄 "}
                          {c.ultimaMensagem}
                        </p>

                        {/* Badge de não lidas laranja oficial */}
                        {c.naoLidas > 0 && (
                          <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-home-orange px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.6)]">
                            {c.naoLidas}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA CENTRAL: CHAT / THREAD DA CONVERSA (Lg: col-span-5) */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] overflow-hidden shadow-xl lg:col-span-5 xl:col-span-6",
            viewMobile !== "chat" && "hidden lg:flex",
          )}
        >
          {contatoAtivo ? (
            <>
              {/* Header do Chat Central */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#1b2334] bg-[#0c101a] px-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Botão Voltar no Mobile */}
                  <button
                    onClick={() => setViewMobile("lista")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 lg:hidden text-home-muted hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  {/* Avatar do Contato */}
                  <div className="relative shrink-0">
                    <ContactAvatar
                      nome={contatoAtivo.nome}
                      numero={contatoAtivo.numero}
                      src={contatoAtivo.avatar}
                      onError={() => void renovarAvatar(contatoAtivo.id)}
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                      <SiWhatsapp className="h-2 w-2" />
                    </span>
                  </div>

                  {/* Nome e Telefone */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-extrabold text-white">
                        {contatoAtivo.nome}
                      </span>
                      {/* Pill de Status Comercial (Lead v) */}
                      <div className="relative group/status">
                        <button
                          type="button"
                          className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-[#0d2218] px-2 py-0.5 text-[10px] font-semibold text-emerald-400 hover:border-emerald-500/60 transition-all"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span>{contatoAtivo.statusComercial}</span>
                          <ChevronDown className="h-2.5 w-2.5 text-emerald-400/80" />
                        </button>
                        <div className="absolute left-0 top-6 z-50 hidden group-hover/status:block w-36 rounded-xl border border-[#1b2334] bg-[#111723] p-1.5 shadow-xl">
                          {(
                            [
                              "Lead",
                              "Em qualificação",
                              "Proposta",
                              "Negociação",
                              "Cliente",
                              "Perdido",
                            ] as StatusComercial[]
                          ).map((st) => (
                            <button
                              key={st}
                              onClick={() => alterarStatusComercial(st)}
                              className="w-full text-left px-2 py-1 text-xs text-white hover:bg-white/5 rounded-lg"
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-home-muted">{contatoAtivo.numero}</div>
                  </div>
                </div>

                {/* Ações do Header: Favorito, Tags, 3 Pontos */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled
                    title="Favoritos ainda não estão disponíveis"
                    className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted opacity-50"
                  >
                    <Star className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMostrarInputTag(!mostrarInputTag)}
                    title="Etiquetas"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <Tag className="h-4 w-4" />
                  </button>

                  {/* Mais opções */}
                  <div className="relative group/more">
                    <button
                      type="button"
                      title="Mais opções"
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted transition-all hover:border-white/20 hover:text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 top-10 z-50 hidden group-hover/more:block w-44 rounded-xl border border-[#1b2334] bg-[#111723] p-1.5 shadow-xl">
                      <button
                        onClick={marcarComoCliente}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-home-orange" /> Marcar como cliente
                      </button>
                      <button
                        onClick={arquivarConversa}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <Archive className="h-3.5 w-3.5 text-home-muted" /> Arquivar conversa
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contatoAtivo.numero);
                          toast.success("Telefone copiado para a área de transferência.");
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-white hover:bg-white/5 rounded-lg flex items-center gap-2"
                      >
                        <Phone className="h-3.5 w-3.5 text-home-muted" /> Copiar telefone
                      </button>
                    </div>
                  </div>

                  {/* Botão Ver CRM no Mobile */}
                  <button
                    onClick={() => setViewMobile("crm")}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted lg:hidden hover:text-white"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Input Rápido de Tag no topo se ativado */}
              {mostrarInputTag && (
                <div className="flex items-center gap-2 border-b border-[#1b2334] bg-[#111723] px-4 py-2 animate-in fade-in">
                  <Tag className="h-3.5 w-3.5 text-home-orange" />
                  <Input
                    value={novaTagTexto}
                    onChange={(e) => setNovaTagTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && adicionarTag()}
                    placeholder="Adicionar nova etiqueta (ex: Quente, Restaurante)..."
                    className="h-7 text-xs bg-[#161d2b] border-[#1b2334] text-white"
                  />
                  <Button
                    size="sm"
                    onClick={adicionarTag}
                    className="h-7 px-2.5 text-xs bg-home-orange text-white"
                  >
                    Adicionar
                  </Button>
                </div>
              )}

              {/* Área Rolável de Mensagens (Thread) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#080b12] scrollbar-thin scrollbar-thumb-white/10">
                {/* Separador de Data: "Hoje" */}
                <div className="flex items-center justify-center my-2">
                  <span className="rounded-full border border-white/5 bg-[#141a26] px-3.5 py-1 text-[11px] font-medium text-home-muted shadow-sm">
                    Hoje
                  </span>
                </div>

                {/* Balões de Mensagem */}
                {contatoAtivo.mensagens.map((m) => {
                  const ehSaida = m.direcao === "out";
                  return (
                    <div
                      key={m.id}
                      className={cn("flex w-full", ehSaida ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-2xl p-3.5 shadow-md leading-relaxed text-sm",
                          ehSaida
                            ? "rounded-tr-xs bg-[#0e3b2e] border border-emerald-500/20 text-[#e6f4ee]"
                            : "rounded-tl-xs bg-[#151c2a] border border-white/5 text-[#e1e7f0]",
                        )}
                      >
                        {/* Se houver documento/anexo */}
                        {m.anexo && (
                          <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-[#09261d] p-3 shadow-inner">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white font-black text-xs uppercase shadow-sm">
                              PDF
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="truncate text-xs font-bold text-white">
                                {m.anexo.nome}
                              </div>
                              <div className="text-[11px] text-emerald-300/80">
                                {m.anexo.tamanho}
                              </div>
                            </div>
                            <button
                              onClick={() => toast.success(`Abrindo ${m.anexo?.nome}...`)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Texto da mensagem */}
                        <div className="whitespace-pre-wrap break-words">{m.texto}</div>

                        {/* Horário e confirmação de entrega */}
                        <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-home-muted/80">
                          <span>{m.horario}</span>
                          {ehSaida && m.statusEnvio === "falha" && (
                            <span className="text-rose-400">Falha</span>
                          )}
                          {ehSaida && m.statusEnvio === "incerto" && (
                            <span className="text-amber-400">Não confirmado</span>
                          )}
                          {ehSaida && m.statusEnvio === "pendente" && (
                            <Clock className="h-3 w-3 text-home-muted" />
                          )}
                          {ehSaida && m.statusEnvio === "enviado" && (
                            <Check className="h-3 w-3 text-emerald-400" />
                          )}
                          {ehSaida && ["entregue", "lido"].includes(m.statusEnvio ?? "") && (
                            <CheckCheck className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={fimRef} />
              </div>

              {/* ======================================================== */}
              {/* COMPOSER INFERIOR (TABS: MENSAGEM / RESPOSTA RÁPIDA)     */}
              {/* ======================================================== */}
              <div className="border-t border-[#1b2334] bg-[#0c101a] p-3 space-y-2.5">
                {/* Tabs do Composer */}
                <div className="flex items-center gap-4 px-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setComposerTab("mensagem")}
                    className={cn(
                      "font-bold transition-colors pb-0.5",
                      composerTab === "mensagem"
                        ? "text-home-orange border-b-2 border-home-orange"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    Mensagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerTab("resposta_rapida")}
                    className={cn(
                      "font-bold transition-colors pb-0.5 flex items-center gap-1",
                      composerTab === "resposta_rapida"
                        ? "text-home-orange border-b-2 border-home-orange"
                        : "text-home-muted hover:text-white",
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    Resposta rápida
                  </button>
                </div>

                {/* Gaveta de Respostas Rápidas */}
                {composerTab === "resposta_rapida" && (
                  <div className="rounded-xl border border-[#1b2334] bg-[#111723] p-3 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Escolha um script autorizado
                      </span>
                      <Input
                        value={buscaScript}
                        onChange={(e) => setBuscaScript(e.target.value)}
                        placeholder="Buscar script..."
                        className="h-6 w-36 text-[11px] bg-[#161d2b] border-[#1b2334]"
                      />
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {scriptsDisponiveis.length === 0 ? (
                        <div className="text-xs text-home-muted py-2">
                          Nenhum script autorizado salvo.
                        </div>
                      ) : null}

                      {scriptsDisponiveis
                        .filter(
                          (s) =>
                            !buscaScript ||
                            s.nome.toLowerCase().includes(buscaScript.toLowerCase()),
                        )
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => aplicarScript(s as WaScript)}
                            className="w-full text-left p-2 rounded-lg border border-white/5 bg-[#161d2b] hover:border-home-orange/40 hover:bg-[#1a2233] transition-all"
                          >
                            <div className="text-xs font-bold text-white">{s.nome}</div>
                            <div className="truncate text-[11px] text-home-muted">{s.mensagem}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Popover de Emojis Rápidos */}
                {mostrarEmojis && (
                  <div className="flex items-center gap-2 p-2 rounded-xl border border-[#1b2334] bg-[#111723] animate-in fade-in">
                    {["👋", "😊", "👍", "🙏", "🚀", "💼", "📊", "🤝", "🎯", "✅"].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => inserirEmoji(em)}
                        className="text-lg hover:scale-125 transition-transform"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea e Toolbar */}
                <div className="relative rounded-xl border border-[#1b2334] bg-[#111723] p-2.5 focus-within:border-home-orange/60 transition-all">
                  <Textarea
                    ref={textareaRef}
                    value={textoMensagem}
                    onChange={(e) => setTextoMensagem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensagem();
                      }
                    }}
                    placeholder="Digite uma mensagem..."
                    rows={2}
                    className="w-full resize-none border-none bg-transparent p-0 text-xs text-white placeholder:text-home-muted/50 focus-visible:ring-0 leading-relaxed"
                  />

                  {/* Toolbar Inferior: Emojis, Clips, Imagens, Documentos e Botão Enviar Laranja */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-home-muted">
                      <button
                        type="button"
                        onClick={() => setMostrarEmojis(!mostrarEmojis)}
                        title="Inserir emoji"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Smile className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Anexar arquivo"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Enviar imagem"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalAnexo(true)}
                        title="Enviar documento"
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Botão de Envio Laranja Vibrante Flow Business */}
                    <button
                      type="button"
                      onClick={enviarMensagem}
                      disabled={enviando || !textoMensagem.trim()}
                      title="Enviar mensagem (Enter)"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-home-orange text-white shadow-[0_0_15px_rgba(255,98,0,0.5)] transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {enviando ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <SendHorizontal className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-home-muted">
              Selecione uma conversa ao lado para iniciar o atendimento.
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: PAINEL CRM DO LEAD (Lg: col-span-4)       */}
        {/* ======================================================== */}
        <div
          className={cn(
            "flex flex-col rounded-2xl border border-[#1b2334] bg-[#0c101a] p-4 overflow-y-auto space-y-4 shadow-xl scrollbar-thin scrollbar-thumb-white/10 lg:col-span-4 xl:col-span-3",
            viewMobile !== "crm" && "hidden lg:flex",
          )}
        >
          {contatoAtivo ? (
            <>
              {/* Botão Voltar no Mobile */}
              <button
                onClick={() => setViewMobile("chat")}
                className="flex items-center gap-1.5 text-xs text-home-muted lg:hidden hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o chat
              </button>

              {/* Header do Contato */}
              <div className="flex items-center justify-between gap-3 border-b border-[#1b2334] pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <ContactAvatar
                      nome={contatoAtivo.nome}
                      numero={contatoAtivo.numero}
                      src={contatoAtivo.crmAvatar || contatoAtivo.avatar}
                      onError={() => void renovarAvatar(contatoAtivo.id)}
                      className="h-12 w-12 ring-2 ring-emerald-500/30"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-white ring-2 ring-[#0c101a]">
                      <SiWhatsapp className="h-2.5 w-2.5" />
                    </span>
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="truncate text-sm font-extrabold text-white">
                      {contatoAtivo.nome}
                    </div>
                    <div className="truncate text-xs text-home-muted">{contatoAtivo.numero}</div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <SiWhatsapp className="h-3 w-3" />
                      <span>Contato WhatsApp</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  title="Opções do contato"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#141a26] text-home-muted hover:text-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Botões de Ação Principais: Marcar como cliente & Arquivar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={marcarComoCliente}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-home-orange px-3 py-2 text-xs font-bold text-white shadow-[0_0_12px_rgba(255,98,0,0.3)] transition-all hover:bg-orange-600 active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" />
                  Marcar como cliente
                </button>

                <button
                  type="button"
                  onClick={arquivarConversa}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#141a26] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
                >
                  <Archive className="h-3.5 w-3.5 text-home-muted" />
                  Arquivar
                </button>
              </div>

              {!contatoAtivo.leadId && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={criarLeadNoCrm}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-home-orange/40 bg-home-orange/10 px-3 py-2 text-xs font-semibold text-home-orange transition-all hover:bg-home-orange/15"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Criar lead no CRM
                  </button>
                  <button
                    type="button"
                    onClick={() => void abrirVinculacaoLead()}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#141a26] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Vincular lead
                  </button>
                </div>
              )}

              {contatoAtivo.leadId && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      window.location.assign(dashboardUrlForSection(window.location.href, "leads"))
                    }
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#141a26] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10"
                  >
                    <User className="h-3.5 w-3.5" /> Abrir lead
                  </button>
                  <button
                    type="button"
                    disabled={!contatoAtivo.proposal}
                    onClick={() =>
                      window.location.assign(
                        dashboardUrlForSection(window.location.href, "propostas"),
                      )
                    }
                    title={contatoAtivo.proposal?.assunto ?? "Nenhuma proposta vinculada"}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#141a26] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FileText className="h-3.5 w-3.5" /> Abrir proposta
                  </button>
                </div>
              )}

              {/* Seção 1: Informações do contato */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Informações do contato
                  </span>
                  <button
                    type="button"
                    onClick={abrirModalEditar}
                    className="flex items-center gap-1 text-xs text-home-muted hover:text-white transition-colors"
                  >
                    <Edit2 className="h-3 w-3" /> Editar
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Nome
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.nome}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Telefone
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-white">
                      {contatoAtivo.numero}
                      <SiWhatsapp className="h-3 w-3 text-[#22c55e]" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> E-mail
                    </span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {contatoAtivo.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> Empresa
                    </span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {contatoAtivo.empresa}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Cargo
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.cargo}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Origem
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.origem}</span>
                  </div>

                  <div className="flex items-center justify-between text-home-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Data de cadastro
                    </span>
                    <span className="font-semibold text-white">{contatoAtivo.dataCadastro}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Status no CRM */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Status no CRM
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Status Dropdown */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Status</span>
                    <select
                      value={contatoAtivo.statusComercial}
                      onChange={(e) => alterarStatusComercial(e.target.value as StatusComercial)}
                      className="rounded-lg border border-emerald-500/30 bg-[#0d2218] px-2.5 py-1 text-xs font-semibold text-emerald-400 focus:outline-none"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Em qualificação">Em qualificação</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Negociação">Negociação</option>
                      <option value="Cliente">Cliente</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </div>

                  {/* Pipeline Dropdown (Azul Oficial) */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Pipeline</span>
                    <select
                      value={contatoAtivo.pipelineEtapa}
                      onChange={(e) => alterarPipelineEtapa(e.target.value as PipelineEtapa)}
                      className="rounded-lg border border-blue-500/40 bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white focus:outline-none shadow-sm"
                    >
                      <option value="Prospecção">Prospecção</option>
                      <option value="Qualificação">Qualificação</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Negociação">Negociação</option>
                      <option value="Fechamento">Fechamento</option>
                    </select>
                  </div>

                  {/* Responsável */}
                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Responsável</span>
                    <div className="flex items-center gap-2">
                      {contatoAtivo.assignedTo && ["admin", "gerente"].includes(papelAtual) ? (
                        <select
                          value={contatoAtivo.assignedTo}
                          onChange={(event) => void transferirAtendimento(event.target.value)}
                          className="max-w-36 rounded-md border border-white/10 bg-[#111723] px-2 py-1 text-[11px] font-semibold text-white"
                        >
                          {membros.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.nome || member.email}
                            </option>
                          ))}
                        </select>
                      ) : contatoAtivo.assignedTo ? (
                        <span className="font-semibold text-white">
                          {membros.find((member) => member.user_id === contatoAtivo.assignedTo)
                            ?.nome ||
                            membros.find((member) => member.user_id === contatoAtivo.assignedTo)
                              ?.email ||
                            "Equipe"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={assumirAtendimento}
                          className="rounded-md border border-home-orange/40 px-2 py-1 text-[11px] font-semibold text-home-orange"
                        >
                          Assumir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-home-muted">Oportunidade</span>
                    <span className="max-w-40 truncate font-semibold text-white">
                      {contatoAtivo.proposal
                        ? `${contatoAtivo.proposal.assunto} · ${contatoAtivo.proposal.status}`
                        : "Nenhuma proposta"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-home-muted">Tags</span>
                      <button
                        type="button"
                        onClick={() => setMostrarInputTag(true)}
                        className="text-[11px] text-home-orange hover:text-orange-400 font-semibold"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {contatoAtivo.tags.map((t) => {
                        const ehQuente = t.toLowerCase() === "quente";
                        return (
                          <span
                            key={t}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                              ehQuente
                                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                                : "border-white/10 bg-[#162030] text-slate-300",
                            )}
                          >
                            <span>{t}</span>
                            <button
                              type="button"
                              onClick={() => removerTag(t)}
                              className="text-home-muted hover:text-white"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Notas */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Notas
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalAdicionarNota(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-home-orange hover:text-orange-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Adicionar nota
                  </button>
                </div>

                {contatoAtivo.notas.length === 0 ? (
                  <div className="text-xs text-home-muted py-1">Nenhuma nota adicionada ainda.</div>
                ) : (
                  contatoAtivo.notas.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[#1b2334] bg-[#121724] p-3 space-y-1.5 shadow-sm"
                    >
                      <p className="text-xs text-slate-200 leading-relaxed">{n.texto}</p>
                      <div className="text-[10px] text-home-muted">
                        {n.autor} • {n.horario}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Seção 4: Últimas interações */}
              <div className="space-y-2.5 rounded-xl border border-[#1b2334] bg-[#0e131f] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Últimas interações
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalVerInteracoes(true)}
                    className="text-xs font-semibold text-home-orange hover:text-orange-400 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-3">
                  {contatoAtivo.interacoes.slice(0, 3).map((it) => (
                    <div key={it.id} className="flex items-start gap-2.5 text-xs">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-1.5",
                          it.cor === "rose" && "bg-rose-500/15 text-rose-400",
                          it.cor === "emerald" && "bg-emerald-500/15 text-emerald-400",
                          it.cor === "blue" && "bg-blue-500/15 text-blue-400",
                          it.cor === "amber" && "bg-amber-500/15 text-amber-400",
                        )}
                      >
                        {it.tipo === "documento" && <FileText className="h-3.5 w-3.5" />}
                        {it.tipo === "conversa" && <MessageCircle className="h-3.5 w-3.5" />}
                        {it.tipo === "lead" && <User className="h-3.5 w-3.5" />}
                        {it.tipo === "nota" && <Edit2 className="h-3.5 w-3.5" />}
                        {it.tipo === "status" && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="truncate font-semibold text-white">{it.titulo}</div>
                        <div className="truncate text-[11px] text-home-muted">{it.subtitulo}</div>
                      </div>
                      <span className="shrink-0 text-[10px] text-home-muted font-medium">
                        {it.horario}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-home-muted">
              Selecione um contato para consultar o CRM.
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAIS E DIÁLOGOS DE AÇÃO                            */}
      {/* ======================================================== */}

      {/* Modal 1: Editar Contato */}
      {modalEditarContato && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Editar Informações do Contato</h3>
              <button
                onClick={() => setModalEditarContato(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label className="text-home-muted">Nome Completo</Label>
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Telefone / WhatsApp</Label>
                <Input
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">E-mail</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Empresa</Label>
                <Input
                  value={editEmpresa}
                  onChange={(e) => setEditEmpresa(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>

              <div>
                <Label className="text-home-muted">Cargo</Label>
                <Input
                  value={editCargo}
                  onChange={(e) => setEditCargo(e.target.value)}
                  className="mt-1 bg-[#111723] border-[#1b2334] text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalEditarContato(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={salvarEdicaoContato}
                className="bg-home-orange text-white hover:bg-orange-600"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Adicionar Nota */}
      {modalAdicionarNota && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Adicionar Nova Nota</h3>
              <button
                onClick={() => setModalAdicionarNota(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-home-muted">
                Observações internas sobre o atendimento / lead:
              </Label>
              <Textarea
                value={novaNotaTexto}
                onChange={(e) => setNovaNotaTexto(e.target.value)}
                placeholder="Ex: Cliente tem interesse em marketing para o segundo semestre..."
                rows={4}
                className="bg-[#111723] border-[#1b2334] text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAdicionarNota(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={salvarNovaNota}
                disabled={!novaNotaTexto.trim()}
                className="bg-home-orange text-white hover:bg-orange-600"
              >
                Salvar Nota
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Ver Todas as Interações */}
      {modalVerInteracoes && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">
                Histórico de Interações — {contatoAtivo.nome}
              </h3>
              <button
                onClick={() => setModalVerInteracoes(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {contatoAtivo.interacoes.map((it) => (
                <div
                  key={it.id}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#111723] p-3 text-xs"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      it.cor === "rose" && "bg-rose-500/15 text-rose-400",
                      it.cor === "emerald" && "bg-emerald-500/15 text-emerald-400",
                      it.cor === "blue" && "bg-blue-500/15 text-blue-400",
                      it.cor === "amber" && "bg-amber-500/15 text-amber-400",
                    )}
                  >
                    {it.tipo === "documento" && <FileText className="h-4 w-4" />}
                    {it.tipo === "conversa" && <MessageCircle className="h-4 w-4" />}
                    {it.tipo === "lead" && <User className="h-4 w-4" />}
                    {it.tipo === "nota" && <Edit2 className="h-4 w-4" />}
                    {it.tipo === "status" && <Check className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-white">{it.titulo}</div>
                    <div className="text-home-muted">{it.subtitulo}</div>
                  </div>
                  <span className="text-[10px] text-home-muted font-medium">{it.horario}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalVerInteracoes(false)}
                className="border-[#1b2334] text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Vincular lead existente */}
      {modalVincularLead && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Vincular lead do CRM</h3>
              <button
                type="button"
                onClick={() => setModalVincularLead(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Input
              value={buscaLead}
              onChange={(event) => setBuscaLead(event.target.value)}
              placeholder="Buscar por nome, empresa, telefone ou e-mail..."
              className="border-[#1b2334] bg-[#111723] text-white"
            />
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {carregandoLeads ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-home-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando leads...
                </div>
              ) : leadsVinculaveisFiltrados.length === 0 ? (
                <div className="py-8 text-center text-xs text-home-muted">
                  Nenhum lead encontrado.
                </div>
              ) : (
                leadsVinculaveisFiltrados.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => void vincularLeadExistente(lead.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#111723] p-3 text-left transition-colors hover:border-home-orange/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-white">
                        {lead.owner_name || lead.business_name}
                      </span>
                      <span className="block truncate text-[11px] text-home-muted">
                        {[lead.business_name, lead.whatsapp || lead.phone, lead.email]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <UserPlus className="h-4 w-4 shrink-0 text-home-orange" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Envio de Anexos */}
      {modalAnexo && contatoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1b2334] bg-[#0c101a] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1b2334] pb-3">
              <h3 className="text-base font-extrabold text-white">Anexar Documento ou Imagem</h3>
              <button
                onClick={() => setModalAnexo(false)}
                className="text-home-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-home-muted">
                Selecione um arquivo para enviar diretamente a {contatoAtivo.nome}:
              </div>

              <button
                onClick={informarAnexoIndisponivel}
                className="flex w-full items-center gap-3 p-3 rounded-xl border border-white/5 bg-[#111723] text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">Envio de mídia indisponível</div>
                  <div className="text-[11px] text-home-muted">Disponível em uma etapa futura.</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAnexo(false)}
                className="border-[#1b2334] text-home-muted"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
