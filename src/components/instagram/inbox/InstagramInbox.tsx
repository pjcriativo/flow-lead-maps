import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Contact,
  EllipsisVertical,
  ExternalLink,
  Filter,
  Heart,
  History,
  Instagram,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Paperclip,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  Tag,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  addFlowBusinessNote,
  sendInstagramConversationMessage,
  type FlowBusinessAccount,
  type FlowBusinessActivity,
  type FlowBusinessCard,
  type FlowBusinessStage,
  type FlowBusinessWorkspace,
} from "@/services/flow-business";

type Conversation = Tables<"ig_conversas">;
type Message = Tables<"ig_mensagens">;
type InboxFilter = "all" | "unread" | "progress";
type MobilePanel = "list" | "chat" | "details";

interface InstagramInboxProps {
  accounts: FlowBusinessAccount[];
  workspace: FlowBusinessWorkspace;
  onOpenAccounts: () => void;
  onOpenAutomations: () => void;
  onMoveCard: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
  onWorkspaceChanged: () => Promise<void>;
}

interface InboxMetrics {
  total: number;
  answered: number;
  progress: number;
  unanswered: number;
  marked: number;
}

const STAGE_LABELS: Record<FlowBusinessStage, string> = {
  novo: "Novo lead",
  analisando: "Em análise",
  aquecendo: "Em aquecimento",
  pronto_abordar: "Pronto para abordar",
  abordado: "Abordado",
  respondeu: "Respondeu",
  qualificado: "Lead qualificado",
  proposta: "Proposta enviada",
  cliente: "Cliente",
  perdido: "Perdido",
};

const CHAT_STAGES = Object.entries(STAGE_LABELS) as Array<[FlowBusinessStage, string]>;

export function InstagramInbox({
  accounts,
  workspace,
  onOpenAccounts,
  onOpenAutomations,
  onMoveCard,
  onWorkspaceChanged,
}: InstagramInboxProps) {
  const [account, setAccount] = useState<FlowBusinessAccount | null>(() =>
    preferredAccount(accounts),
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<InboxMetrics>(emptyMetrics());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [inputText, setInputText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = preferredAccount(accounts);
    if (!account || !accounts.some((item) => item.id === account.id)) setAccount(next);
  }, [account, accounts]);

  const loadConversations = useCallback(async (instanceId: string) => {
    const { data, error } = await supabase
      .from("ig_conversas")
      .select("*")
      .eq("instancia_id", instanceId)
      .order("last_message_at", { ascending: false });
    if (error) throw error;
    setConversations(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!account) {
      setConversations([]);
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setActiveConvId(null);
    setMessages([]);
    void loadConversations(account.id).catch(() => {
      setLoading(false);
      toast.error("Não foi possível carregar as conversas.");
    });
  }, [account, loadConversations]);

  useEffect(() => {
    if (!account) return;
    const channel = supabase
      .channel(`instagram-inbox:${account.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ig_conversas",
          filter: `instancia_id=eq.${account.id}`,
        },
        () => void loadConversations(account.id),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [account, loadConversations]);

  useEffect(() => {
    const openAssistant = () => setAssistantOpen(true);
    window.addEventListener("instagram-ai-assistant", openAssistant);
    return () => window.removeEventListener("instagram-ai-assistant", openAssistant);
  }, []);

  useEffect(() => {
    const ids = conversations.map((conversation) => conversation.id);
    if (!ids.length) {
      setMetrics(emptyMetrics());
      return;
    }
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    void supabase
      .from("ig_mensagens")
      .select("conversa_id,direction,timestamp")
      .in("conversa_id", ids)
      .gte("timestamp", cutoff)
      .then(({ data }) => setMetrics(buildMetrics(conversations, data ?? [])));
  }, [conversations]);

  const loadMessages = useCallback(async (conversation: Conversation) => {
    setLoadingMessages(true);
    setActiveConvId(conversation.id);
    setMobilePanel("chat");
    const { data, error } = await supabase
      .from("ig_mensagens")
      .select("*")
      .eq("conversa_id", conversation.id)
      .order("timestamp", { ascending: true });
    if (error) {
      toast.error("Não foi possível carregar o histórico desta conversa.");
    } else {
      setMessages(data ?? []);
      window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView());
      if (conversation.unread_count > 0) {
        await Promise.all([
          supabase.from("ig_conversas").update({ unread_count: 0 }).eq("id", conversation.id),
          supabase
            .from("ig_mensagens")
            .update({ is_read: true })
            .eq("conversa_id", conversation.id)
            .eq("direction", "inbound"),
        ]);
        setConversations((current) =>
          current.map((item) =>
            item.id === conversation.id ? { ...item, unread_count: 0 } : item,
          ),
        );
      }
    }
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel(`instagram-messages:${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ig_mensagens",
          filter: `conversa_id=eq.${activeConvId}`,
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((current) =>
            current.some((message) => message.id === next.id) ? current : [...current, next],
          );
          window.requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView());
        },
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [activeConvId]);

  const activeConversation = conversations.find((item) => item.id === activeConvId) ?? null;
  const activeCard = useMemo(
    () => findCardForConversation(activeConversation, workspace.cards),
    [activeConversation, workspace.cards],
  );
  const cardActivities = useMemo(
    () =>
      (workspace.activities ?? [])
        .filter((activity) => activity.cardId === activeCard?.id)
        .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt)),
    [activeCard?.id, workspace.activities],
  );
  const filteredConversations = useMemo(() => {
    const normalized = normalize(query);
    return conversations.filter((conversation) => {
      const matchesQuery =
        !normalized ||
        normalize(
          `${conversation.external_contact_name ?? ""} ${conversation.external_contact_id} ${conversation.last_message_text ?? ""}`,
        ).includes(normalized);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && conversation.unread_count > 0) ||
        (filter === "progress" && isInProgress(conversation));
      return matchesQuery && matchesFilter;
    });
  }, [conversations, filter, query]);

  const canSend = Boolean(
    account?.status === "conectado" &&
    activeConversation &&
    (account.provider !== "meta_official" || messagingWindowOpen(activeConversation)),
  );

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConversation || !account || sending) return;
    if (!canSend) {
      toast.error("A conta precisa estar conectada e dentro da janela de atendimento.");
      return;
    }
    setSending(true);
    setInputText("");
    try {
      await sendInstagramConversationMessage({
        provider: account.provider,
        conversationId: activeConversation.id,
        text,
      });
    } catch (error) {
      setInputText(text);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const markUnread = async () => {
    if (!activeConversation) return;
    const { error } = await supabase
      .from("ig_conversas")
      .update({ unread_count: Math.max(1, activeConversation.unread_count) })
      .eq("id", activeConversation.id);
    if (error) return toast.error("Não foi possível marcar a conversa.");
    setConversations((current) =>
      current.map((item) =>
        item.id === activeConversation.id ? { ...item, unread_count: 1 } : item,
      ),
    );
    toast.success("Conversa marcada como não lida.");
  };

  const toggleMarked = async () => {
    if (!activeConversation) return;
    const marked = conversationMarked(activeConversation);
    const tags = marked
      ? activeConversation.tags.filter((tag) => normalize(tag) !== "marcada")
      : [...activeConversation.tags, "marcada"];
    const { error } = await supabase
      .from("ig_conversas")
      .update({ tags })
      .eq("id", activeConversation.id);
    if (error) return toast.error("Não foi possível atualizar a marcação.");
    setConversations((current) =>
      current.map((item) => (item.id === activeConversation.id ? { ...item, tags } : item)),
    );
  };

  const saveNote = async () => {
    if (!activeCard || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await addFlowBusinessNote(activeCard.id, noteText);
      setNoteText("");
      await onWorkspaceChanged();
      toast.success("Nota adicionada ao histórico do contato.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a nota.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-4">
      <InboxHero
        cards={workspace.cards}
        metrics={metrics}
        onAssistant={() => setAssistantOpen(true)}
        onAutomations={onOpenAutomations}
      />

      <div className="grid min-h-[575px] overflow-hidden rounded-2xl border border-border bg-card shadow-xs xl:grid-cols-[minmax(280px,0.92fr)_minmax(440px,1.45fr)_minmax(260px,0.78fr)]">
        <ConversationList
          account={account}
          accounts={accounts}
          conversations={conversations}
          visibleConversations={filteredConversations}
          activeId={activeConvId}
          filter={filter}
          query={query}
          loading={loading}
          mobilePanel={mobilePanel}
          onAccountChange={(id) => setAccount(accounts.find((item) => item.id === id) ?? null)}
          onFilterChange={setFilter}
          onQueryChange={setQuery}
          onSelect={(conversation) => void loadMessages(conversation)}
          onOpenAccounts={onOpenAccounts}
        />

        <ChatPanel
          account={account}
          conversation={activeConversation}
          card={activeCard}
          messages={messages}
          inputText={inputText}
          loading={loadingMessages}
          sending={sending}
          canSend={canSend}
          mobilePanel={mobilePanel}
          messagesEndRef={messagesEndRef}
          onBack={() => setMobilePanel("list")}
          onDetails={() => setMobilePanel("details")}
          onInputChange={setInputText}
          onSend={() => void sendMessage()}
          onAssistant={() => setAssistantOpen(true)}
          onMarkUnread={() => void markUnread()}
          onToggleMarked={() => void toggleMarked()}
          onMoveCard={onMoveCard}
        />

        <ContactPanel
          conversation={activeConversation}
          card={activeCard}
          activities={cardActivities}
          noteText={noteText}
          savingNote={savingNote}
          mobilePanel={mobilePanel}
          onBack={() => setMobilePanel("chat")}
          onNoteChange={setNoteText}
          onSaveNote={() => void saveNote()}
        />
      </div>

      <AssistantDialog open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}

function InboxHero({
  cards,
  metrics,
  onAssistant,
  onAutomations,
}: {
  cards: FlowBusinessCard[];
  metrics: InboxMetrics;
  onAssistant: () => void;
  onAutomations: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F0B6D0] bg-card px-6 py-5 shadow-xs sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_57%_48%,rgba(247,37,133,0.13),transparent_30%),linear-gradient(115deg,rgba(247,119,55,0.08),transparent_38%,rgba(131,58,180,0.09))]" />
      <div className="relative grid items-center gap-5 lg:grid-cols-[minmax(0,1.08fr)_330px_320px]">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#F72585]">
            Nenhuma oportunidade sem resposta
          </p>
          <h2 className="mt-2 max-w-xl text-2xl font-extrabold leading-[1.08] tracking-tight text-[#101828] sm:text-[30px]">
            Converse, relacione e converta{" "}
            <span className="bg-gradient-to-r from-[#F77737] via-[#E1306C] to-[#833AB4] bg-clip-text text-transparent">
              no Instagram.
            </span>
          </h2>
          <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#475467]">
            Centralize todas as mensagens, use a IA para responder mais rápido e transforme
            conversas em clientes.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              className="rounded-lg bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              onClick={onAssistant}
            >
              <Sparkles className="size-4" /> Responder com IA
            </Button>
            <Button variant="outline" className="rounded-lg bg-card" onClick={onAutomations}>
              Ver automações <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
        <InboxArtwork cards={cards} />
        <MessagesTodayCard metrics={metrics} />
      </div>
    </section>
  );
}

function InboxArtwork({ cards }: { cards: FlowBusinessCard[] }) {
  const avatars = cards.filter((card) => card.profilePictureUrl).slice(0, 3);
  return (
    <div className="relative hidden h-44 items-center justify-center lg:flex" aria-hidden="true">
      <div className="absolute size-44 rounded-full border border-[#FBCFE8]/80" />
      <div className="absolute size-32 rounded-full border border-[#E9D5FF]" />
      <div className="absolute size-24 rounded-full bg-[#F72585]/10 blur-xl" />
      <div className="relative z-10 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white shadow-[0_14px_30px_rgba(225,48,108,0.30)] ring-4 ring-card/80">
        <Instagram className="size-11" />
      </div>
      {avatars.map((card, index) => (
        <Avatar
          key={card.id}
          className={cn(
            "absolute z-20 size-10 border-4 border-card shadow-md",
            ["left-14 top-0", "right-10 top-2", "right-9 bottom-0"][index],
          )}
        >
          <AvatarImage src={card.profilePictureUrl ?? undefined} alt="" />
          <AvatarFallback className="bg-muted" />
        </Avatar>
      ))}
      <FloatingMessage
        className="left-0 top-7 rotate-[-4deg]"
        icon={Heart}
        tone="pink"
        title="Novo seguidor"
        detail="Oi, tenho interesse!"
      />
      <FloatingMessage
        className="right-0 top-8 rotate-[4deg]"
        icon={Shield}
        tone="green"
        title="Pedido de informação"
        detail="Como funciona?"
      />
      <FloatingMessage
        className="left-8 bottom-0 rotate-[-3deg]"
        icon={MessageSquare}
        tone="blue"
        title="Pergunta sobre preço"
        detail="Qual o valor?"
      />
    </div>
  );
}

function FloatingMessage({
  className,
  icon: Icon,
  tone,
  title,
  detail,
}: {
  className: string;
  icon: typeof Heart;
  tone: "pink" | "green" | "blue";
  title: string;
  detail: string;
}) {
  const tones = {
    pink: "bg-[#FFF1F6] text-[#F72585]",
    green: "bg-[#ECFDF3] text-[#10B981]",
    blue: "bg-[#EFF6FF] text-[#2563EB]",
  };
  return (
    <div
      className={cn(
        "absolute z-30 flex min-w-32 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-md",
        className,
      )}
    >
      <span className={cn("flex size-7 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="size-3.5" />
      </span>
      <span>
        <strong className="block text-[9px] font-semibold text-[#101828]">{title}</strong>
        <span className="block text-[8px] text-[#667085]">{detail}</span>
      </span>
    </div>
  );
}

function MessagesTodayCard({ metrics }: { metrics: InboxMetrics }) {
  const rows = [
    ["Respondidas", metrics.answered, "bg-[#10B981]"],
    ["Em andamento", metrics.progress, "bg-[#2563EB]"],
    ["Não respondidas", metrics.unanswered, "bg-[#F97316]"],
    ["Marcadas", metrics.marked, "bg-[#833AB4]"],
  ] as const;
  return (
    <div className="rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-[#F72585]">
          <span className="flex size-6 items-center justify-center rounded-lg bg-[#FFF1F6]">
            <MessageCircle className="size-3.5" />
          </span>
          Mensagens hoje
        </div>
        <span className="rounded-lg border border-border px-2 py-1 text-[9px] text-[#475467]">
          Últimas 24 horas
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_94px] items-center gap-3">
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-[#101828]">{metrics.total}</p>
          <p className="text-[10px] text-[#667085]">mensagens recebidas</p>
          <div className="mt-3 space-y-1.5">
            {rows.map(([label, value, color]) => (
              <div
                key={label}
                className="grid grid-cols-[8px_1fr_auto] items-center gap-2 text-[9px]"
              >
                <span className={cn("size-2 rounded-full", color)} />
                <span className="text-[#475467]">{label}</span>
                <strong className="text-[#101828]">{percentage(value, metrics.total)}%</strong>
              </div>
            ))}
          </div>
        </div>
        <DonutChart metrics={metrics} />
      </div>
    </div>
  );
}

function DonutChart({ metrics }: { metrics: InboxMetrics }) {
  const total = Math.max(metrics.total, 1);
  const circumference = 2 * Math.PI * 36;
  const segments = [
    [metrics.answered, "#10B981"],
    [metrics.progress, "#2563EB"],
    [metrics.unanswered, "#F97316"],
    [metrics.marked, "#833AB4"],
  ] as const;
  let offset = 0;
  return (
    <div className="relative size-[94px]">
      <svg viewBox="0 0 94 94" className="-rotate-90">
        <circle cx="47" cy="47" r="36" fill="none" stroke="#E5E7EB" strokeWidth="10" />
        {metrics.total > 0
          ? segments.map(([value, color], index) => {
              const length = (value / total) * circumference;
              const circle = (
                <circle
                  key={color}
                  cx="47"
                  cy="47"
                  r="36"
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })
          : null}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-[#101828]">
        <strong className="text-base">{metrics.total}</strong>
        <small className="text-[8px] text-[#667085]">total</small>
      </span>
    </div>
  );
}

interface ConversationListProps {
  account: FlowBusinessAccount | null;
  accounts: FlowBusinessAccount[];
  conversations: Conversation[];
  visibleConversations: Conversation[];
  activeId: string | null;
  filter: InboxFilter;
  query: string;
  loading: boolean;
  mobilePanel: MobilePanel;
  onAccountChange: (id: string) => void;
  onFilterChange: (filter: InboxFilter) => void;
  onQueryChange: (query: string) => void;
  onSelect: (conversation: Conversation) => void;
  onOpenAccounts: () => void;
}

function ConversationList(props: ConversationListProps) {
  const unread = props.conversations.filter((item) => item.unread_count > 0).length;
  const progress = props.conversations.filter(isInProgress).length;
  return (
    <section
      className={cn(
        "min-w-0 border-r border-border bg-card",
        props.mobilePanel !== "list" && "hidden xl:block",
      )}
    >
      <div className="flex gap-2 border-b border-border p-3">
        {(
          [
            ["all", "Todas", props.conversations.length],
            ["unread", "Não lidas", unread],
            ["progress", "Em andamento", progress],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onFilterChange(id)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold transition-colors",
              props.filter === id
                ? "bg-[#FFF1F6] text-[#E1306C]"
                : "bg-muted/45 text-[#475467] hover:bg-muted",
            )}
          >
            <span className="truncate">{label}</span>
            <span className="rounded-full bg-card px-1.5 py-0.5 text-[9px]">{count}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 p-3">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder="Buscar conversas..."
            className="h-9 pl-9 text-xs"
          />
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-9" aria-label="Filtros e contas">
              <Filter className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {props.accounts.map((account) => (
              <DropdownMenuItem key={account.id} onClick={() => props.onAccountChange(account.id)}>
                {account.username ? `@${account.username}` : account.name}
                {account.id === props.account?.id ? " · ativa" : ""}
              </DropdownMenuItem>
            ))}
            {!props.accounts.length ? (
              <DropdownMenuItem onClick={props.onOpenAccounts}>Conectar conta</DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-[484px] overflow-y-auto px-2 pb-2">
        {props.loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-[#E1306C]" />
          </div>
        ) : null}
        {!props.loading && !props.account ? (
          <EmptyList
            title="Conecte uma conta"
            detail="Uma conta conectada é necessária para sincronizar o Inbox."
            action="Abrir configurações"
            onAction={props.onOpenAccounts}
          />
        ) : null}
        {!props.loading && props.account && !props.visibleConversations.length ? (
          <EmptyList
            title="Nenhuma conversa encontrada"
            detail="As mensagens recebidas aparecerão aqui em tempo real."
          />
        ) : null}
        {props.visibleConversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            selected={conversation.id === props.activeId}
            onClick={() => props.onSelect(conversation)}
          />
        ))}
      </div>
    </section>
  );
}

function ConversationItem({
  conversation,
  selected,
  onClick,
}: {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  const badge = conversationBadge(conversation);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors",
        selected ? "border-[#FBCFE8] bg-[#FFF7FA]" : "hover:bg-muted/45",
      )}
    >
      {conversation.unread_count > 0 ? (
        <span className="absolute left-0 size-1.5 rounded-full bg-[#2563EB]" />
      ) : null}
      <Avatar
        className={cn("size-10 shrink-0 border-2", selected ? "border-[#F72585]" : "border-card")}
      >
        <AvatarImage src={conversation.external_contact_avatar ?? undefined} alt="" />
        <AvatarFallback className="bg-muted text-xs">
          {initials(conversation.external_contact_name ?? conversation.external_contact_id)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <strong className="truncate text-xs text-[#101828]">
            {conversation.external_contact_name || conversation.external_contact_id}
          </strong>
          <time className="shrink-0 text-[9px] text-[#667085]">
            {relativeTime(conversation.last_message_at)}
          </time>
        </span>
        <span className="block truncate text-[9px] text-[#667085]">
          @{conversation.external_contact_id}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[9px] text-[#98A2B3]">
            {conversation.last_message_text || "Sem prévia disponível"}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        </span>
      </span>
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white">
        <Instagram className="size-3" />
      </span>
    </button>
  );
}

interface ChatPanelProps {
  account: FlowBusinessAccount | null;
  conversation: Conversation | null;
  card: FlowBusinessCard | null;
  messages: Message[];
  inputText: string;
  loading: boolean;
  sending: boolean;
  canSend: boolean;
  mobilePanel: MobilePanel;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onDetails: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onAssistant: () => void;
  onMarkUnread: () => void;
  onToggleMarked: () => void;
  onMoveCard: (cardId: string, stage: FlowBusinessStage) => Promise<void>;
}

function ChatPanel(props: ChatPanelProps) {
  return (
    <section
      className={cn(
        "min-w-0 bg-[#FBFCFE] xl:border-r xl:border-border",
        props.mobilePanel !== "chat" && "hidden xl:flex",
        "flex-col",
      )}
    >
      {props.conversation ? (
        <>
          <div className="flex min-h-16 items-center gap-3 border-b border-border bg-card px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 xl:hidden"
              onClick={props.onBack}
              aria-label="Voltar às conversas"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Avatar className="size-10">
              <AvatarImage src={props.conversation.external_contact_avatar ?? undefined} alt="" />
              <AvatarFallback>
                {initials(
                  props.conversation.external_contact_name ??
                    props.conversation.external_contact_id,
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate text-sm font-bold text-[#101828]">
                {props.conversation.external_contact_name || props.conversation.external_contact_id}
                {props.card?.score && props.card.score >= 85 ? (
                  <BadgeCheck className="size-3.5 fill-[#2563EB] text-card" />
                ) : null}
              </p>
              <p className="truncate text-[10px] text-[#667085]">
                @{props.card?.username ?? props.conversation.external_contact_id}
              </p>
            </div>
            {props.card ? (
              <Select
                value={props.card.stage}
                onValueChange={(value) =>
                  void props.onMoveCard(props.card!.id, value as FlowBusinessStage)
                }
              >
                <SelectTrigger className="hidden h-8 w-32 text-[9px] sm:flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_STAGES.map(([stage, label]) => (
                    <SelectItem key={stage} value={stage}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1 text-[9px] sm:flex"
              onClick={props.onMarkUnread}
            >
              <Heart className="size-3" /> Não lida
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 gap-1 text-[9px] sm:flex"
              onClick={props.onToggleMarked}
            >
              <Shield className="size-3" /> Marcar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 xl:hidden"
              onClick={props.onDetails}
              aria-label="Informações do contato"
            >
              <Contact className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Mais ações">
              <EllipsisVertical className="size-4" />
            </Button>
          </div>
          <div className="h-[405px] flex-1 space-y-3 overflow-y-auto p-4">
            {props.loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[#2563EB]" />
              </div>
            ) : null}
            {!props.loading && !props.messages.length ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="mb-3 size-10 opacity-20" />
                <p className="text-xs">O histórico desta conversa está vazio.</p>
              </div>
            ) : null}
            {props.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                avatar={props.conversation?.external_contact_avatar}
                name={props.conversation?.external_contact_name}
              />
            ))}
            <div ref={props.messagesEndRef} />
          </div>
          <div className="border-t border-border bg-card p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              <QuickAction
                icon={Sparkles}
                label="Responder com IA"
                active
                onClick={props.onAssistant}
              />
              <QuickAction icon={NotebookPen} label="Enviar proposta" />
              <QuickAction icon={CalendarDays} label="Agendar reunião" />
              <QuickAction icon={Paperclip} label="Compartilhar material" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-2 focus-within:ring-2 focus-within:ring-ring/30">
              <Input
                value={props.inputText}
                onChange={(event) => props.onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    props.onSend();
                  }
                }}
                placeholder={
                  props.canSend ? "Digite uma mensagem..." : "Envio indisponível para esta conversa"
                }
                disabled={!props.canSend || props.sending}
                className="h-10 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled
                aria-label="Anexar arquivo"
              >
                <Paperclip className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled
                aria-label="Adicionar emoji"
              >
                <Smile className="size-4" />
              </Button>
              <Button
                size="icon"
                className="size-9 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                onClick={props.onSend}
                disabled={!props.canSend || !props.inputText.trim() || props.sending}
                aria-label="Enviar mensagem"
              >
                {props.sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            {props.account?.provider === "meta_official" &&
            props.conversation &&
            !messagingWindowOpen(props.conversation) ? (
              <p className="mt-1.5 text-[9px] text-destructive">
                A janela de atendimento da Meta está encerrada.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex min-h-[575px] flex-col items-center justify-center px-6 text-center text-muted-foreground">
          <MessageCircle className="mb-4 size-12 opacity-20" />
          <p className="text-sm font-medium text-foreground">Selecione uma conversa</p>
          <p className="mt-1 max-w-64 text-xs">
            O histórico real, o contato e as ações do CRM serão carregados aqui.
          </p>
        </div>
      )}
    </section>
  );
}

function MessageBubble({
  message,
  avatar,
  name,
}: {
  message: Message;
  avatar: string | null | undefined;
  name: string | null | undefined;
}) {
  const outbound = message.direction === "outbound";
  const isAudio = message.message_type === "audio" && message.media_url;
  return (
    <div className={cn("flex items-end gap-2", outbound && "justify-end")}>
      {!outbound ? (
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={avatar ?? undefined} alt="" />
          <AvatarFallback className="text-[9px]">{initials(name ?? "Contato")}</AvatarFallback>
        </Avatar>
      ) : null}
      <div className={cn("max-w-[78%]", outbound && "text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-left text-[11px] leading-relaxed text-[#344054]",
            outbound ? "rounded-br-md bg-[#DDEAFF]" : "rounded-bl-md bg-[#EEF1F5]",
          )}
        >
          {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
          {isAudio ? <AudioMessage url={message.media_url!} metadata={message.metadata} /> : null}
          {message.media_url && !isAudio ? (
            <a
              href={message.media_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block overflow-hidden rounded-lg"
            >
              <img
                src={message.media_url}
                alt="Anexo da conversa"
                className="max-h-48 w-full object-cover"
              />
            </a>
          ) : null}
        </div>
        <span
          className={cn(
            "mt-1 flex items-center gap-1 text-[8px] text-[#667085]",
            outbound && "justify-end",
          )}
        >
          {formatTime(message.timestamp)}
          {outbound ? (
            <DeliveryIcon status={message.delivery_status} />
          ) : (
            <Instagram className="size-2.5 text-[#E1306C]" />
          )}
        </span>
      </div>
    </div>
  );
}

function AudioMessage({ url, metadata }: { url: string; metadata: Json }) {
  const duration = metadataValue(metadata, "duration");
  return (
    <div className="flex min-w-48 items-center gap-2 py-1">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white"
        aria-label="Abrir áudio"
      >
        <Play className="ml-0.5 size-3.5 fill-current" />
      </a>
      <span className="flex h-7 flex-1 items-center gap-0.5">
        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            className="w-0.5 rounded-full bg-[#7AA7F8]"
            style={{ height: `${7 + ((index * 7) % 17)}px` }}
          />
        ))}
      </span>
      <span className="text-[9px] text-[#475467]">
        {typeof duration === "string" || typeof duration === "number" ? String(duration) : "Áudio"}
      </span>
    </div>
  );
}

function DeliveryIcon({ status }: { status: string }) {
  if (status === "failed") return <span className="text-destructive">Erro</span>;
  if (status === "queued") return <Clock3 className="size-2.5" />;
  return (
    <CheckCheck className={cn("size-3", status === "read" ? "text-[#2563EB]" : "text-[#667085]")} />
  );
}

function QuickAction({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const unavailable = !onClick;
  return (
    <button
      type="button"
      onClick={onClick ?? (() => toast.info(`${label}: integração ainda indisponível.`))}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[9px] font-medium",
        active
          ? "border-[#E9D5FF] bg-[#FAF5FF] text-[#833AB4]"
          : "border-border bg-card text-[#475467]",
      )}
      aria-label={unavailable ? `${label}, indisponível` : label}
    >
      <Icon className="size-3" />
      {label}
    </button>
  );
}

interface ContactPanelProps {
  conversation: Conversation | null;
  card: FlowBusinessCard | null;
  activities: FlowBusinessActivity[];
  noteText: string;
  savingNote: boolean;
  mobilePanel: MobilePanel;
  onBack: () => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
}

function ContactPanel(props: ContactPanelProps) {
  const username = props.card?.username ?? props.conversation?.external_contact_id ?? null;
  const profileUrl =
    props.card?.instagramUrl ??
    (username ? `https://instagram.com/${username.replace(/^@/, "")}` : null);
  return (
    <aside
      className={cn(
        "h-[575px] space-y-3 overflow-y-auto bg-[#FBFCFE] p-3",
        props.mobilePanel !== "details" && "hidden xl:block",
      )}
    >
      <Button variant="ghost" size="sm" className="xl:hidden" onClick={props.onBack}>
        <ArrowLeft className="size-4" /> Voltar à conversa
      </Button>
      <InfoCard title="Informações do contato" icon={Contact}>
        {props.conversation ? (
          <>
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage
                  src={
                    props.card?.profilePictureUrl ??
                    props.conversation.external_contact_avatar ??
                    undefined
                  }
                  alt=""
                />
                <AvatarFallback>
                  {initials(
                    props.conversation.external_contact_name ??
                      props.conversation.external_contact_id,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#101828]">
                  {props.card?.fullName ??
                    props.conversation.external_contact_name ??
                    props.conversation.external_contact_id}
                </p>
                <p className="truncate text-[9px] text-[#667085]">@{username}</p>
              </div>
              {profileUrl ? (
                <Button variant="outline" size="sm" className="h-8 px-2 text-[9px]" asChild>
                  <a href={profileUrl} target="_blank" rel="noreferrer">
                    Ver perfil <ExternalLink className="size-3" />
                  </a>
                </Button>
              ) : null}
            </div>
            {profileUrl ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-8 w-full gap-1 text-[9px]"
                asChild
              >
                <a href={profileUrl} target="_blank" rel="noreferrer">
                  <Shield className="size-3 text-[#2563EB]" /> Acompanhar perfil manualmente
                </a>
              </Button>
            ) : null}
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <ContactRow
                icon={Tag}
                value={props.card?.category ?? "Nicho não informado"}
                badge={props.card ? STAGE_LABELS[props.card.stage] : undefined}
              />
              <ContactRow
                icon={MapPin}
                value={
                  [props.card?.city, props.card?.state].filter(Boolean).join(", ") ||
                  "Localização não informada"
                }
              />
              <ContactRow
                icon={UsersRound}
                value={
                  props.card?.followersCount != null
                    ? `${compactNumber(props.card.followersCount)} seguidores`
                    : "Seguidores não informados"
                }
              />
              <ContactRow icon={Mail} value="E-mail não informado" />
              <ContactRow icon={Phone} value="Telefone não informado" />
            </div>
          </>
        ) : (
          <p className="py-5 text-center text-[10px] text-muted-foreground">
            Selecione uma conversa para ver o contato.
          </p>
        )}
      </InfoCard>

      <InfoCard title="Notas internas" icon={NotebookPen}>
        <div className="flex gap-2">
          <Input
            value={props.noteText}
            onChange={(event) => props.onNoteChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && props.onSaveNote()}
            placeholder={props.card ? "Adicionar nota..." : "Contato sem vínculo no CRM"}
            disabled={!props.card || props.savingNote}
            className="h-8 text-[10px]"
          />
          <Button
            size="icon"
            className="size-8 shrink-0 bg-[#2563EB]"
            onClick={props.onSaveNote}
            disabled={!props.card || !props.noteText.trim() || props.savingNote}
            aria-label="Adicionar nota"
          >
            {props.savingNote ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </Button>
        </div>
      </InfoCard>

      <InfoCard title="Histórico e atividades" icon={History} action="Ver tudo">
        <div className="space-y-2.5">
          {props.activities.slice(0, 6).map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
          {!props.activities.length ? (
            <p className="py-4 text-center text-[10px] text-muted-foreground">
              Nenhuma atividade registrada para este contato.
            </p>
          ) : null}
        </div>
      </InfoCard>
    </aside>
  );
}

function InfoCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Contact;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-lg bg-[#FFF1F6] text-[#E1306C]">
          <Icon className="size-3.5" />
        </span>
        <h3 className="flex-1 text-xs font-bold text-[#101828]">{title}</h3>
        {action ? <span className="text-[9px] text-[#475467]">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function ContactRow({
  icon: Icon,
  value,
  badge,
}: {
  icon: typeof Tag;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[9px] text-[#475467]">
      <Icon className="size-3.5 shrink-0 text-[#667085]" />
      <span className="min-w-0 flex-1 truncate">{value}</span>
      {badge ? (
        <span className="rounded-full bg-[#ECFDF3] px-2 py-1 font-medium text-[#039855]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function ActivityRow({ activity }: { activity: FlowBusinessActivity }) {
  const activityIcons: Record<string, typeof MessageCircle> = {
    reply_received: MessageCircle,
    created: CircleUserRound,
    dm_sent: Send,
    qualified: BadgeCheck,
    proposal: NotebookPen,
    won: CheckCheck,
    note: NotebookPen,
    stage_changed: UsersRound,
  };
  const Icon = activityIcons[activity.activityType] ?? Clock3;
  return (
    <div className="flex gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
        <Icon className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] font-semibold text-[#344054]">{activity.title}</p>
        {activity.detail ? (
          <p className="truncate text-[8px] text-[#667085]">{activity.detail}</p>
        ) : null}
      </div>
      <time className="shrink-0 text-[8px] text-[#98A2B3]">
        {relativeTime(activity.occurredAt)}
      </time>
    </div>
  );
}

function AssistantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#833AB4]" /> Assistente de IA
          </DialogTitle>
          <DialogDescription>
            A interface está preparada para gerar respostas com o contexto da conversa, mas nenhum
            serviço de geração de respostas está configurado nesta etapa.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-[#E9D5FF] bg-[#FAF5FF] p-4 text-sm text-[#6941C6]">
          Nenhuma resposta foi criada ou enviada. Quando um modelo autorizado for configurado, a
          sugestão aparecerá aqui para revisão e edição antes do envio.
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyList({
  title,
  detail,
  action,
  onAction,
}: {
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mx-2 mt-8 rounded-xl border border-dashed border-border p-5 text-center">
      <MessageCircle className="mx-auto size-8 text-muted-foreground/30" />
      <p className="mt-3 text-xs font-semibold">{title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
      {action && onAction ? (
        <Button size="sm" variant="outline" className="mt-3" onClick={onAction}>
          {action}
        </Button>
      ) : null}
    </div>
  );
}

function preferredAccount(accounts: FlowBusinessAccount[]) {
  return (
    accounts.find((item) => item.status === "conectado" && item.provider === "meta_official") ??
    accounts.find((item) => item.status === "conectado" && item.provider === "unipile") ??
    accounts.find((item) => item.status === "conectado") ??
    accounts[0] ??
    null
  );
}

function findCardForConversation(conversation: Conversation | null, cards: FlowBusinessCard[]) {
  if (!conversation) return null;
  if (conversation.lead_id) {
    const exact = cards.find((card) => card.leadId === conversation.lead_id);
    if (exact) return exact;
  }
  const identity = normalize(conversation.external_contact_id).replace(/^@/, "");
  return (
    cards.find((card) => normalize(card.username ?? "").replace(/^@/, "") === identity) ?? null
  );
}

function buildMetrics(
  conversations: Conversation[],
  messages: Array<Pick<Message, "conversa_id" | "direction" | "timestamp">>,
): InboxMetrics {
  const byId = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  const result = emptyMetrics();
  messages
    .filter((message) => message.direction === "inbound")
    .forEach((message) => {
      const conversation = byId.get(message.conversa_id);
      if (!conversation) return;
      result.total += 1;
      if (conversationMarked(conversation)) result.marked += 1;
      else if (conversation.unread_count > 0) result.unanswered += 1;
      else if (isInProgress(conversation)) result.progress += 1;
      else result.answered += 1;
    });
  return result;
}

function emptyMetrics(): InboxMetrics {
  return { total: 0, answered: 0, progress: 0, unanswered: 0, marked: 0 };
}
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
function conversationMarked(conversation: Conversation) {
  return conversation.tags.some((tag) => ["marcada", "marked"].includes(normalize(tag)));
}
function isInProgress(conversation: Conversation) {
  return ["open", "active", "in_progress", "em_andamento"].includes(normalize(conversation.status));
}
function messagingWindowOpen(conversation: Conversation) {
  return (
    !conversation.messaging_window_expires_at ||
    Date.parse(conversation.messaging_window_expires_at) > Date.now()
  );
}
function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}
function initials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}
function relativeTime(value: string) {
  const delta = Date.now() - Date.parse(value);
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}
function metadataValue(metadata: Json, key: string): Json | undefined {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? metadata[key]
    : undefined;
}
function conversationBadge(conversation: Conversation) {
  if (conversation.unread_count > 0)
    return { label: "Não lida", className: "bg-[#FFF1F6] text-[#E1306C]" };
  if (conversationMarked(conversation))
    return { label: "Marcada", className: "bg-muted text-[#475467]" };
  if (isInProgress(conversation))
    return { label: "Em andamento", className: "bg-[#EFF6FF] text-[#2563EB]" };
  return { label: "Respondida", className: "bg-[#ECFDF3] text-[#039855]" };
}
