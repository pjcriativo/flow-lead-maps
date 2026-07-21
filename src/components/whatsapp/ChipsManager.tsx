// Gestão de N CHIPS (instâncias WhatsApp) da org — dentro da aba "Conexão".
// Conecta vários números, mostra status/função de cada um, deixa marcar QUEIMADO na mão,
// trocar função (disparo/conversa) e reordenar o rodízio. Reusa o pareamento por código/QR.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  RefreshCw,
  Flame,
  MessageCircle,
  Send,
  ArrowUp,
  ArrowDown,
  KeyRound,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  listarChips,
  criarChip,
  parearChip,
  qrChip,
  statusChip,
  marcarChip,
  excluirChip,
  checarChip,
  listarAlertas,
  marcarAlertaLido,
  ativarRecebimentoChip,
  type WaChip,
  type WaAlerta,
} from "@/services/whatsapp";
import { AlertTriangle, X, Activity, Inbox, Trash2 } from "lucide-react";
import { ComoFunciona } from "./ComoFunciona";

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  conectado: { label: "Conectado", cls: "bg-green-100 text-green-800 border-green-500/40" },
  aguardando: { label: "Aguardando", cls: "bg-amber-100 text-amber-800 border-amber-500/40" },
  desconectado: { label: "Desconectado", cls: "bg-secondary text-muted-foreground border-border" },
  queimada: { label: "Queimado", cls: "bg-rose-100 text-rose-800 border-rose-500/40" },
  erro: { label: "Erro", cls: "bg-rose-100 text-rose-800 border-rose-500/40" },
};

export function ChipsManager({ onMudou }: { onMudou?: () => void } = {}) {
  const [chips, setChips] = useState<WaChip[]>([]);
  const [alertas, setAlertas] = useState<WaAlerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [verificando, setVerificando] = useState<string | null>(null);
  const [ativando, setAtivando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [dialog, setDialog] = useState(false);
  // fluxo de conexão de um chip
  const [novoFuncao, setNovoFuncao] = useState<"disparo" | "conversa">("disparo");
  const [metodo, setMetodo] = useState<"code" | "qr">("code");
  const [phone, setPhone] = useState("");
  const [chipId, setChipId] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [cs, al] = await Promise.all([listarChips(), listarAlertas().catch(() => [])]);
      setChips(cs);
      setAlertas(al);
      onMudou?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar os chips");
    } finally {
      setCarregando(false);
    }
  }, [onMudou]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Enquanto aguarda o pareamento do chip que está conectando, faz polling do status dele.
  useEffect(() => {
    if (!chipId || (!code && !qr)) return;
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await statusChip(chipId);
        if (s.status === "conectado") {
          toast.success("Chip conectado!");
          setDialog(false);
          resetConexao();
          carregar();
        }
      } catch {
        /* segue tentando */
      }
    }, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipId, code, qr]);

  const resetConexao = () => {
    setChipId(null);
    setCode(null);
    setQr(null);
    setPhone("");
  };

  const abrirDialog = () => {
    resetConexao();
    setNovoFuncao("disparo");
    setMetodo("code");
    setDialog(true);
  };

  // Cria o chip e já gera o código/QR.
  const conectarNovo = async () => {
    setConectando(true);
    try {
      const c = chipId ?? (await criarChip(novoFuncao)).id;
      setChipId(c);
      if (metodo === "code") {
        if (phone.replace(/\D/g, "").length < 12) {
          toast.error("Informe o número do chip (DDI+DDD).");
          return;
        }
        const r = await parearChip(c, phone.replace(/\D/g, ""));
        if (r.status === "code" && "code" in r) setCode(r.code);
        else toast.error("status" in r && r.status === "erro" ? r.error : "Falha ao gerar código");
      } else {
        const r = await qrChip(c);
        if (r.status === "qr" && "qr" in r) setQr(r.qr);
        else toast.error("QR ainda não disponível — tente de novo.");
      }
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao conectar o chip");
    } finally {
      setConectando(false);
    }
  };

  const acao = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na ação");
    }
  };

  // EXCLUIR o chip de vez. O servidor recusa se houver histórico de envios (a prova do que foi
  // enviado sumiria junto) e pede confirmação extra se o chip tem número pareado (mata a sessão).
  const excluir = async (chip: WaChip) => {
    const nome = chip.numero ? `+${chip.numero}` : chip.nome;
    if (!confirm(`Excluir o chip ${nome}? Esta ação não pode ser desfeita.`)) return;
    setExcluindo(chip.id);
    try {
      let r = await excluirChip(chip.id, false);
      if (!r.ok && r.motivo === "tem_historico") {
        toast.error(
          `Este chip já enviou ${r.envios} mensagem(ns). Excluir apagaria esse histórico — marque como "Queimado" para tirá-lo do rodízio sem perder a prova dos envios.`,
        );
        return;
      }
      if (!r.ok && r.motivo === "pareado_precisa_confirmar") {
        if (
          !confirm(
            `ATENÇÃO: ${nome} está pareado. Excluir DESCONECTA o WhatsApp deste número e você terá que parear de novo (ler o QR/código). Confirma?`,
          )
        )
          return;
        r = await excluirChip(chip.id, true);
      }
      if (!r.ok) {
        toast.error(r.motivo === "nao_encontrado" ? "Chip não encontrado." : `Falha: ${r.motivo}`);
        return;
      }
      toast.success(`Chip ${nome} excluído.`);
      carregar();
      onMudou?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    } finally {
      setExcluindo(null);
    }
  };

  // Verifica a saúde do chip ao vivo (ETAPA 3): se queimou, o servidor já rotaciona + avisa.
  const verificar = async (chip: WaChip) => {
    setVerificando(chip.id);
    try {
      const r = await checarChip(chip.id);
      if (r.resultado === "queimou")
        toast.error(r.rotacao?.alerta ?? "Chip queimado — disparo rotacionado.");
      else if (r.resultado === "suspeito")
        toast.warning(`Chip sem sessão (${r.falhas}/3). Se persistir, será queimado.`);
      else if (r.resultado === "sadio") toast.success("Chip saudável (conectado).");
      else toast.info("Checagem recente — aguarde ~1 min entre verificações.");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao verificar");
    } finally {
      setVerificando(null);
    }
  };

  // Ativa o recebimento (webhook) no chip de conversa — as respostas dos leads caem em Conversas.
  const ativarRecebimento = async (chip: WaChip) => {
    setAtivando(chip.id);
    try {
      const r = await ativarRecebimentoChip(chip.id);
      if (r.ok) toast.success("Recebimento ativado — as respostas caem na aba Conversas.");
      else toast.error(r.error ?? `Falha ao ativar (${r.status ?? ""}).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ativar recebimento");
    } finally {
      setAtivando(null);
    }
  };

  const dispensarAlerta = async (id: string) => {
    setAlertas((a) => a.filter((x) => x.id !== id));
    marcarAlertaLido(id).catch(() => carregar());
  };

  const trocarOrdem = async (chip: WaChip, delta: number) => {
    const disparo = chips.filter((c) => c.funcao === "disparo");
    const i = disparo.findIndex((c) => c.id === chip.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= disparo.length) return;
    const outro = disparo[j];
    await marcarChip(chip.id, { ordem: outro.ordem });
    await marcarChip(outro.id, { ordem: chip.ordem });
    carregar();
  };

  if (carregando) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando chips...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas visíveis (chip queimado, rotação, sem chip, graduação) */}
      {alertas.map((a) => (
        <div
          key={a.id}
          className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{a.mensagem}</span>
          <button
            onClick={() => dispensarAlerta(a.id)}
            className="shrink-0 text-amber-700 hover:text-amber-900"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Chips (números)</div>
          <p className="text-xs text-muted-foreground">
            Chips de <b>disparo</b> rodam a frio, em rodízio. Chips de <b>conversa</b> (com
            histórico) nunca disparam frio — recebem os leads que responderem.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button size="sm" onClick={abrirDialog}>
            <Plus className="h-4 w-4" /> Conectar chip
          </Button>
        </div>
      </div>

      <ComoFunciona
        id="wa-chips"
        titulo="O que cada botão faz aqui"
        itens={[
          {
            termo: "Conectar chip",
            texto:
              "adiciona um número novo. Você escolhe se ele nasce de disparo ou de conversa e pareia por código ou QR.",
          },
          {
            termo: "Disparo × Conversa",
            texto:
              "disparo manda mensagem fria pros leads (em rodízio, um por vez). Conversa só recebe e responde — nunca dispara frio, é o que protege o seu número principal.",
          },
          {
            termo: "Virar disparo / Virar conversa",
            texto: "troca a função do chip. Um chip que já falou com o lead vira conversa sozinho.",
          },
          {
            termo: "Setas ↑ ↓",
            texto:
              "ordem do rodízio: o disparo #1 é usado primeiro; se ele bate o teto do dia, entra o #2.",
          },
          {
            termo: "Verificar saúde",
            texto:
              "pergunta à Evolution se o chip ainda está logado. Se caiu de vez, ele é marcado queimado e o próximo assume automaticamente.",
          },
          {
            termo: "Ativar recebimento",
            texto:
              "faz as respostas dos leads caírem na aba Conversas. Só aparece em chip de conversa conectado.",
          },
          {
            termo: "Queimado",
            texto:
              "tira o chip do rodízio SEM apagar nada — o histórico de envios continua ali. Use quando o número foi bloqueado.",
          },
          {
            termo: "Excluir (🗑)",
            texto:
              "apaga o chip de vez. Recusa se ele já enviou (o histórico sumiria junto — nesse caso use Queimado) e pede confirmação extra se o número estiver pareado.",
          },
        ]}
      />

      {chips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Nenhum chip ainda. Conecte o primeiro número.
        </div>
      ) : (
        <div className="space-y-2">
          {chips.map((c) => {
            const st = STATUS_UI[c.status] ?? STATUS_UI.desconectado;
            const disparoList = chips.filter((x) => x.funcao === "disparo");
            const idx = disparoList.findIndex((x) => x.id === c.id);
            return (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {c.numero ? `+${c.numero}` : c.nome}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        c.funcao === "conversa"
                          ? "border-blue-500/40 bg-blue-100 text-blue-800"
                          : "border-primary/40 bg-primary/10 text-primary",
                      )}
                    >
                      {c.funcao === "conversa" ? "Conversa" : `Disparo #${idx + 1}`}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {c.nome === "flowleads" ? "número principal · " : ""}
                    {c.numero ? "" : "sem número pareado"}
                  </div>
                </div>

                <span
                  className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", st.cls)}
                >
                  {st.label}
                </span>

                {/* reordenar rodízio (só chips de disparo) */}
                {c.funcao === "disparo" && (
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx <= 0}
                      onClick={() => trocarOrdem(c, -1)}
                      title="Subir no rodízio"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={idx >= disparoList.length - 1}
                      onClick={() => trocarOrdem(c, 1)}
                      title="Descer no rodízio"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {/* trocar função */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    acao(
                      () =>
                        marcarChip(c.id, {
                          funcao: c.funcao === "disparo" ? "conversa" : "disparo",
                        }),
                      `Chip agora é de ${c.funcao === "disparo" ? "conversa" : "disparo"}.`,
                    )
                  }
                >
                  {c.funcao === "disparo" ? (
                    <>
                      <MessageCircle className="h-3.5 w-3.5" /> Virar conversa
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Virar disparo
                    </>
                  )}
                </Button>

                {/* verificar saúde ao vivo (ETAPA 3) — só faz sentido em chip de disparo ativo */}
                {c.funcao === "disparo" && c.status !== "queimada" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={verificando === c.id}
                    onClick={() => verificar(c)}
                  >
                    <Activity className="h-3.5 w-3.5" />{" "}
                    {verificando === c.id ? "Verificando…" : "Verificar saúde"}
                  </Button>
                )}

                {/* ativar recebimento (Conversas) — só em chip de conversa conectado */}
                {c.funcao === "conversa" && c.status === "conectado" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ativando === c.id}
                    title="Configura o webhook para as respostas dos leads caírem na aba Conversas"
                    onClick={() => ativarRecebimento(c)}
                  >
                    <Inbox className="h-3.5 w-3.5" />{" "}
                    {ativando === c.id ? "Ativando…" : "Ativar recebimento"}
                  </Button>
                )}

                {/* marcar/desmarcar queimado */}
                {c.status === "queimada" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      acao(
                        () => marcarChip(c.id, { status: "desconectado" }),
                        "Chip reativado (desconectado).",
                      )
                    }
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Reativar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-700 hover:text-rose-800"
                    onClick={() =>
                      acao(
                        () => marcarChip(c.id, { status: "queimada" }),
                        "Chip marcado como queimado — sai do disparo.",
                      )
                    }
                  >
                    <Flame className="h-3.5 w-3.5" /> Queimado
                  </Button>
                )}

                {/* excluir de vez (o servidor recusa se houver histórico de envios) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  disabled={excluindo === c.id}
                  title="Excluir este chip (não dá para desfazer)"
                  onClick={() => excluir(c)}
                >
                  {excluindo === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de conexão de um chip */}
      <Dialog
        open={dialog}
        onOpenChange={(o) => (o ? setDialog(true) : (setDialog(false), resetConexao()))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar chip</DialogTitle>
          </DialogHeader>
          {!code && !qr ? (
            <div className="flex flex-col gap-4 py-1">
              <div className="flex flex-col gap-1.5">
                <Label>Função</Label>
                <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
                  <button
                    onClick={() => setNovoFuncao("disparo")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5",
                      novoFuncao === "disparo"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Disparo (rodízio a frio)
                  </button>
                  <button
                    onClick={() => setNovoFuncao("conversa")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5",
                      novoFuncao === "conversa"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    Conversa
                  </button>
                </div>
              </div>
              <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
                <button
                  onClick={() => setMetodo("code")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5",
                    metodo === "code"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <KeyRound className="h-3.5 w-3.5" /> Código
                </button>
                <button
                  onClick={() => setMetodo("qr")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5",
                    metodo === "qr"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <QrCode className="h-3.5 w-3.5" /> QR
                </button>
              </div>
              {metodo === "code" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="chip-phone">Número do chip (DDI+DDD)</Label>
                  <Input
                    id="chip-phone"
                    placeholder="5511987654321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                  />
                </div>
              )}
            </div>
          ) : code ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Digite este código no WhatsApp do chip
              </div>
              <div className="my-2 font-mono text-2xl font-bold tracking-[0.2em]">{code}</div>
              <p className="text-sm text-muted-foreground">
                Aparelhos conectados → Conectar um aparelho → Conectar com número. A tela atualiza
                ao parear.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={qr!} alt="QR" className="h-56 w-56 rounded-lg border border-border" />
              <p className="text-sm text-muted-foreground">
                Escaneie rápido (o QR expira em ~1 min).
              </p>
            </div>
          )}
          <DialogFooter>
            {!code && !qr && (
              <Button onClick={conectarNovo} disabled={conectando}>
                {conectando && <Loader2 className="h-4 w-4 animate-spin" />} Gerar{" "}
                {metodo === "code" ? "código" : "QR"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
