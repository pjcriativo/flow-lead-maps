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
  type WaChip,
} from "@/services/whatsapp";

const STATUS_UI: Record<string, { label: string; cls: string }> = {
  conectado: { label: "Conectado", cls: "bg-green-100 text-green-800 border-green-500/40" },
  aguardando: { label: "Aguardando", cls: "bg-amber-100 text-amber-800 border-amber-500/40" },
  desconectado: { label: "Desconectado", cls: "bg-secondary text-muted-foreground border-border" },
  queimada: { label: "Queimado", cls: "bg-rose-100 text-rose-800 border-rose-500/40" },
  erro: { label: "Erro", cls: "bg-rose-100 text-rose-800 border-rose-500/40" },
};

export function ChipsManager() {
  const [chips, setChips] = useState<WaChip[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [conectando, setConectando] = useState(false);
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
      setChips(await listarChips());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar os chips");
    } finally {
      setCarregando(false);
    }
  }, []);

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
