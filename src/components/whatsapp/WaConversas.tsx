// Aba CONVERSAS — bate-papo de autoatendimento (cara do S-zap/Kaptar): lista de conversas à
// esquerda, thread da conversa + caixa de resposta à direita. Lê wa_mensagens (recebidas pelo
// webhook) e responde pelo chip da org (edge wa-responder). Atualiza sozinho (polling leve).
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessagesSquare,
  Send,
  Loader2,
  RefreshCw,
  User,
  Sparkles,
  Check,
  Pencil,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  listarConversas,
  listarMensagens,
  responderConversa,
  listarSugestoesSdr,
  rodarSdr,
  aprovarSugestaoSdr,
  descartarSugestaoSdr,
  type SdrSugestao,
  marcarConversaLida,
  type WaConversa,
  type WaMensagem,
} from "@/services/whatsapp";

function horaCurta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtNumero(n: string): string {
  // 5541999990000 -> +55 41 99999-0000 (aproximado, só para exibir)
  const m = n.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]}-${m[4]}` : n;
}

export function WaConversas() {
  const [conversas, setConversas] = useState<WaConversa[]>([]);
  const [ativo, setAtivo] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<WaMensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  // rascunhos do agente SDR — ele sugere, o dono decide. Nada sai sem clique.
  const [sugestoes, setSugestoes] = useState<SdrSugestao[]>([]);
  const [rodandoSdr, setRodandoSdr] = useState(false);
  const sugestaoAtiva = sugestoes.find((s) => s.numero === ativo) ?? null;

  const carregarSugestoes = useCallback(() => {
    listarSugestoesSdr()
      .then(setSugestoes)
      .catch(() => {});
  }, []);
  useEffect(() => {
    carregarSugestoes();
  }, [carregarSugestoes]);

  const pedirRascunho = async () => {
    setRodandoSdr(true);
    try {
      const r = await rodarSdr(3);
      if (!r.ok) {
        toast.error(
          r.reason === "teto" ? `Teto de IA: ${r.motivo}` : "Não foi possível rascunhar.",
        );
      } else if (!r.criadas) {
        toast.info(
          "Nenhum rascunho: o agente só responde conversa de LEAD que esteja esperando resposta.",
        );
      } else {
        toast.success(`${r.criadas} rascunho(s) pronto(s) para revisar.`);
        carregarSugestoes();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao rascunhar");
    } finally {
      setRodandoSdr(false);
    }
  };

  const aprovarRascunho = async () => {
    if (!sugestaoAtiva) return;
    setEnviando(true);
    try {
      const r = await aprovarSugestaoSdr(sugestaoAtiva, texto.trim() || sugestaoAtiva.texto);
      if (!r.ok) {
        toast.error(r.error ?? "Falha ao enviar");
        return;
      }
      toast.success("Resposta enviada.");
      setTexto("");
      carregarSugestoes();
      if (ativo) setMensagens(await listarMensagens(ativo));
    } finally {
      setEnviando(false);
    }
  };

  const descartarRascunho = async () => {
    if (!sugestaoAtiva) return;
    await descartarSugestaoSdr(sugestaoAtiva.id).catch(() => {});
    toast.success("Rascunho descartado — nada foi enviado.");
    carregarSugestoes();
  };
  const fimRef = useRef<HTMLDivElement>(null);

  const carregarConversas = useCallback(async () => {
    try {
      setConversas(await listarConversas());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar conversas");
    } finally {
      setCarregando(false);
    }
  }, []);

  const abrir = useCallback(async (numero: string) => {
    setAtivo(numero);
    try {
      setMensagens(await listarMensagens(numero));
      await marcarConversaLida(numero);
      setConversas((cs) => cs.map((c) => (c.numero === numero ? { ...c, nao_lidas: 0 } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir conversa");
    }
  }, []);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  // polling leve: atualiza a conversa aberta + a lista a cada 8s
  useEffect(() => {
    const t = setInterval(() => {
      carregarConversas();
      if (ativo)
        listarMensagens(ativo)
          .then(setMensagens)
          .catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [ativo, carregarConversas]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  const responder = async () => {
    if (!ativo || !texto.trim()) return;
    const t = texto.trim();
    setEnviando(true);
    setTexto("");
    try {
      const r = await responderConversa(ativo, t);
      if (!r.ok) {
        toast.error(r.error ?? "Falha ao enviar");
        setTexto(t);
      } else {
        setMensagens(await listarMensagens(ativo));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
      setTexto(t);
    } finally {
      setEnviando(false);
    }
  };

  if (carregando)
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando conversas…
      </div>
    );

  if (conversas.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <MessagesSquare className="h-7 w-7 text-muted-foreground" />
        </span>
        <div className="mt-1 font-semibold">Nenhuma conversa ainda</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Quando um lead responder ao seu WhatsApp, a conversa aparece aqui para você atender.
          Conecte um chip na aba WhatsApp e dispare uma campanha para começar.
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={carregarConversas}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>
    );

  return (
    <div className="grid h-[600px] grid-cols-[280px_1fr] overflow-hidden rounded-2xl border bg-card">
      {/* Lista de conversas */}
      <div className="flex flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
          <span className="flex items-center gap-1.5">
            Conversas ({conversas.length})
            {sugestoes.length > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {sugestoes.length} rascunho(s)
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            {/* o agente só rascunha para conversa de LEAD — nunca para conversa pessoal */}
            <button
              onClick={pedirRascunho}
              disabled={rodandoSdr}
              title="Agente SDR: rascunha resposta para conversas de LEAD (não envia nada)"
              className="rounded p-1 hover:bg-secondary disabled:opacity-50"
            >
              {rodandoSdr ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </button>
            <button onClick={carregarConversas} title="Atualizar">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversas.map((c) => (
            <button
              key={c.numero}
              onClick={() => abrir(c.numero)}
              className={cn(
                "flex w-full items-center gap-2 border-b px-3 py-2.5 text-left hover:bg-accent/40",
                ativo === c.numero && "bg-accent/60",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {c.nome_contato || fmtNumero(c.numero)}
                </div>
                <div className="truncate text-xs text-muted-foreground">{c.ultima || "—"}</div>
              </div>
              {c.nao_lidas > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-medium text-white">
                  {c.nao_lidas}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      {ativo ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="text-sm font-medium">
              {conversas.find((c) => c.numero === ativo)?.nome_contato || fmtNumero(ativo)}
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.direcao === "out" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    m.direcao === "out"
                      ? "rounded-br-sm bg-emerald-500 text-white"
                      : "rounded-bl-sm bg-card",
                  )}
                >
                  {m.media_url && (
                    <a
                      href={m.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block underline"
                    >
                      [mídia]
                    </a>
                  )}
                  {m.texto && <div className="whitespace-pre-wrap">{m.texto}</div>}
                  <div
                    className={cn(
                      "mt-0.5 text-right text-[10px]",
                      m.direcao === "out" ? "text-white/70" : "text-muted-foreground",
                    )}
                  >
                    {horaCurta(m.criado_em)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={fimRef} />
          </div>
          {/* RASCUNHO DO AGENTE — ele sugere, você decide. Nada sai daqui sem clique seu. */}
          {sugestaoAtiva && (
            <div className="border-t border-primary/30 bg-primary/5 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Rascunho do agente</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  não enviado
                </span>
              </div>
              <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-2.5 text-sm">
                {texto.trim() || sugestaoAtiva.texto}
              </p>
              {sugestaoAtiva.alertas?.length > 0 && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Revise antes de aprovar — o texto fala de{" "}
                  <b>{sugestaoAtiva.alertas.map((a) => a.rotulo).join(", ")}</b>, e isso vira
                  compromisso na sua boca.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={aprovarRascunho} disabled={enviando}>
                  {enviando ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Aprovar e enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTexto(sugestaoAtiva.texto)}
                  disabled={enviando}
                  title="Copia o rascunho para o campo abaixo para você ajustar"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={descartarRascunho} disabled={enviando}>
                  <X className="h-3.5 w-3.5" /> Descartar
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 border-t p-3">
            <Input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && (e.preventDefault(), responder())
              }
              placeholder="Digite uma resposta…"
              disabled={enviando}
            />
            <Button onClick={responder} disabled={enviando || !texto.trim()}>
              {enviando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          Escolha uma conversa para ver as mensagens.
        </div>
      )}
    </div>
  );
}
