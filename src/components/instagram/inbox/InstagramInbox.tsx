import { useEffect, useState, useRef } from "react";
import { AlertTriangle, MessageCircle, Send, Loader2, Settings, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { FlowBusinessAccount } from "@/services/flow-business";

type Conversation = Tables<"ig_conversas">;
type Message = Tables<"ig_mensagens">;

export function InstagramInbox({
  accounts,
  onOpenAccounts,
}: {
  accounts: FlowBusinessAccount[];
  onOpenAccounts: () => void;
}) {
  const [account, setAccount] = useState<FlowBusinessAccount | null>(
    accounts.find((item) => item.provider === "unipile") ??
      accounts.find((item) => item.status === "conectado") ??
      accounts[0] ??
      null,
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (account) void loadConversations(account.id);
    else setLoading(false);
  }, [account]);

  const loadConversations = async (instanciaId: string) => {
    const { data } = await supabase
      .from("ig_conversas")
      .select("*")
      .eq("instancia_id", instanciaId)
      .order("last_message_at", { ascending: false });
    if (data) setConversations(data);
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    setActiveConvId(convId);
    const { data } = await supabase
      .from("ig_mensagens")
      .select("*")
      .eq("conversa_id", convId)
      .order("timestamp", { ascending: true });
    if (data) setMessages(data);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    if (!activeConvId) return;
    const channel = supabase
      .channel("public:ig_mensagens")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ig_mensagens",
          filter: `conversa_id=eq.${activeConvId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          scrollToBottom();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeConvId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConvId) return;

    setSending(true);
    const textToSend = inputText;
    setInputText("");

    try {
      const functionName =
        account?.provider === "meta_official"
          ? "flow-business-meta"
          : account?.provider === "unipile"
            ? "flow-business-unipile"
            : "ig-send";
      const { data, error } = await supabase.functions.invoke(functionName, {
        body:
          account?.provider === "meta_official" || account?.provider === "unipile"
            ? { action: "send", conversationId: activeConvId, text: textToSend }
            : { conversaId: activeConvId, text: textToSend },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      setInputText(textToSend); // rollback
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex p-10 justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Conecte uma conta profissional</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Conecte uma conta do Instagram para sincronizar e responder suas conversas.
        </p>
        <Button className="mt-6" onClick={onOpenAccounts}>
          Abrir contas conectadas
        </Button>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="space-y-3">
      {account.provider === "evolution_legacy" ? (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="size-4 text-warning" />
          Esta conta precisa ser reconectada para usar a sincronização mais recente do Instagram.
        </div>
      ) : account.provider === "unipile" ? (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
          <ShieldCheck className="size-4 text-warning" />A conexão está protegida. Reconecte a conta
          se o Instagram solicitar uma nova verificação de segurança.
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-3 text-sm">
          <ShieldCheck className="size-4 text-success" />
          Conta conectada e pronta para acompanhar as conversas iniciadas pelos contatos.
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto">
        {accounts.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={account.id === item.id ? "default" : "outline"}
            onClick={() => {
              setAccount(item);
              setActiveConvId(null);
              setMessages([]);
            }}
          >
            {item.username ? `@${item.username}` : item.name}
          </Button>
        ))}
      </div>
      <div className="grid h-[700px] grid-cols-[300px_1fr] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        {/* Sidebar - Conversas */}
        <div className="flex flex-col border-r border-border bg-muted/20">
          <div className="border-b border-border p-4 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Inbox (
              {account.username ? `@${account.username}` : account.name})
            </h3>
            <span
              className={`text-[10px] font-medium px-2 py-1 rounded-full ${account.status === "conectado" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
            >
              {account.status === "conectado" ? "Conectado" : "Atenção"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => void loadMessages(conv.id)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                    activeConvId === conv.id ? "bg-primary/10" : "hover:bg-secondary/50"
                  }`}
                >
                  <Avatar className="h-10 w-10 border bg-background">
                    <AvatarImage src={conv.external_contact_avatar ?? undefined} />
                    <AvatarFallback>{conv.external_contact_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium text-sm">
                      {conv.external_contact_name || conv.external_contact_id}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {conv.last_message_text}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col bg-background">
          {activeConvId ? (
            <>
              <div className="flex items-center gap-3 border-b border-border bg-card p-4 shadow-sm z-10">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeConv?.external_contact_avatar ?? undefined} />
                  <AvatarFallback>
                    {activeConv?.external_contact_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold leading-tight">
                    {activeConv?.external_contact_name || activeConv?.external_contact_id}
                  </h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isOut = msg.direction === "outbound";
                  return (
                    <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOut ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        {msg.media_url && (
                          <img
                            src={msg.media_url}
                            alt="Media"
                            className="mt-2 rounded-lg max-h-48"
                          />
                        )}
                        <span
                          className={`text-[10px] mt-1 block opacity-70 ${isOut ? "text-right" : "text-left"}`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendMessage())
                    }
                    disabled={sending}
                  />
                  <Button
                    onClick={() => void sendMessage()}
                    disabled={sending || !inputText.trim()}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="mb-4 h-12 w-12 opacity-20" />
              <p>Selecione uma conversa para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
