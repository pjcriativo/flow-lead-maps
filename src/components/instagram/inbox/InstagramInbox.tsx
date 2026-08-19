import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Plus, Loader2, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";

type Account = {
  id: string;
  instagram_id: string;
  username: string;
  facebook_page_id: string;
  status: string;
};

type Conversation = {
  id: string;
  external_contact_id: string;
  external_contact_username: string;
  external_contact_name: string;
  external_contact_avatar: string;
  last_message_text: string;
  last_message_at: string;
  status: string;
};

type Message = {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  text: string;
  media_url: string;
  timestamp: string;
};

export function InstagramInbox() {
  const { session } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load account
  useEffect(() => {
    async function loadAccount() {
      const { data } = await supabase.from("instagram_accounts").select("*").eq('status', 'active').limit(1);
      if (data && data.length > 0) {
        setAccount(data[0]);
        loadConversations(data[0].id);
      } else {
        setLoading(false);
      }
    }
    void loadAccount();
  }, []);

  const loadConversations = async (accountId: string) => {
    const { data } = await supabase
      .from("instagram_conversations")
      .select("*")
      .eq("account_id", accountId)
      .order("last_message_at", { ascending: false });
    if (data) setConversations(data);
    setLoading(false);
  };

  const loadMessages = async (convId: string) => {
    setActiveConvId(convId);
    const { data } = await supabase
      .from("instagram_messages")
      .select("*")
      .eq("conversation_id", convId)
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
      .channel("public:instagram_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "instagram_messages", filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          scrollToBottom();
        }
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
    setInputText(""); // optimistico

    try {
      const { data, error } = await supabase.functions.invoke("instagram-send", {
        body: { conversationId: activeConvId, text: textToSend }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // The real-time subscription will catch the message insertion and update the UI
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      setInputText(textToSend); // rollback
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex p-10 justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Caixa de Entrada Oficial</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Para usar a mensageria oficial da Meta, você precisa vincular sua conta do Instagram Business e fornecer um Token de Acesso permanente.
        </p>
        <Button className="mt-6" variant="outline">Configurar Integração</Button>
      </div>
    );
  }

  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="grid h-[700px] grid-cols-[300px_1fr] overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* Sidebar - Conversas */}
      <div className="flex flex-col border-r border-border bg-muted/20">
        <div className="border-b border-border p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Inbox ({account.username})
          </h3>
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
                  <AvatarImage src={conv.external_contact_avatar} />
                  <AvatarFallback>{conv.external_contact_username?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-medium text-sm">
                    {conv.external_contact_name || conv.external_contact_username}
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
                <AvatarImage src={activeConv?.external_contact_avatar} />
                <AvatarFallback>{activeConv?.external_contact_username?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold leading-tight">{activeConv?.external_contact_name || activeConv?.external_contact_username}</h3>
                <p className="text-xs text-muted-foreground">@{activeConv?.external_contact_username}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOut = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOut ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                      {msg.media_url && (
                         // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.media_url} alt="Media" className="mt-2 rounded-lg max-h-48" />
                      )}
                      <span className={`text-[10px] mt-1 block opacity-70 ${isOut ? "text-right" : "text-left"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void sendMessage())}
                  disabled={sending}
                />
                <Button onClick={() => void sendMessage()} disabled={sending || !inputText.trim()} size="icon">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
  );
}
