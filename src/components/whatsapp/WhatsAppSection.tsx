// Fase 2 — WhatsApp (peça 1: PROVA DE CONEXÃO). Conecta o número dedicado por
// CÓDIGO DE PAREAMENTO (recomendado — o QR da Evolution GO é estático e expira em
// ~60s) ou por QR, mostra o status (atualiza ao parear) e envia 1 mensagem de teste
// real pro dono. NÃO faz disparo pra leads/campanha/proposta — isso é peça 2.
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  Send,
  Smartphone,
  KeyRound,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  conectarWhatsapp,
  pairWhatsapp,
  enviarTesteWhatsapp,
  type WaConnect,
} from "@/services/whatsapp";

export function WhatsAppSection() {
  const [estado, setEstado] = useState<WaConnect | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [metodo, setMetodo] = useState<"code" | "qr">("code");
  const [numDedicado, setNumDedicado] = useState("");
  const [numero, setNumero] = useState("");
  const [enviando, setEnviando] = useState(false);
  const pollRef = useRef<number | null>(null);

  const conectado = estado?.status === "conectado";
  const aguardandoPareamento = estado?.status === "qr" || estado?.status === "code";

  // Gera o código de pareamento do número dedicado (recria a sessão no servidor).
  const gerarCodigo = async () => {
    setCarregando(true);
    try {
      const r = await pairWhatsapp(numDedicado);
      setEstado(r);
      if (r.status === "erro") toast.error(r.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o código");
    } finally {
      setCarregando(false);
    }
  };

  // QR: fresh=true (clique) recria a sessão; o polling (silent) só relê status.
  const conectarQr = async (silent = false) => {
    if (!silent) setCarregando(true);
    try {
      const r = await conectarWhatsapp(!silent);
      // No polling, não sobrescreve um código já exibido — só reage a conectado.
      if (silent && estado?.status === "code" && r.status !== "conectado") return;
      setEstado(r);
      if (r.status === "erro") toast.error(r.error);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Falha ao conectar");
    } finally {
      if (!silent) setCarregando(false);
    }
  };

  // Enquanto aguarda pareamento (QR ou código), faz polling do status.
  useEffect(() => {
    if (!aguardandoPareamento) return;
    pollRef.current = window.setInterval(() => conectarQr(true), 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aguardandoPareamento]);

  const enviarTeste = async () => {
    setEnviando(true);
    try {
      const r = await enviarTesteWhatsapp(numero);
      if (r.ok) toast.success(`Mensagem enviada para ${r.para}. Confira o WhatsApp!`);
      else toast.error(r.error ?? "Falha no envio");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte o número dedicado do Flow Leads e envie uma mensagem de teste. (Peça 1 — só prova
          de conexão; disparo pra leads vem depois, com aquecimento de chip.)
        </p>
      </div>

      {/* Conexão */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone className="h-4 w-4 text-primary" /> Conexão
        </div>

        {conectado ? (
          <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Conectado
            {estado.status === "conectado" && estado.numero ? ` · ${estado.numero}` : ""}
          </div>
        ) : (
          <>
            {/* Seletor de método */}
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
                <KeyRound className="h-3.5 w-3.5" /> Código (recomendado)
              </button>
              <button
                onClick={() => setMetodo("qr")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5",
                  metodo === "qr" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <QrCode className="h-3.5 w-3.5" /> QR code
              </button>
            </div>

            {metodo === "code" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wa-dedicado">Número dedicado (com DDI+DDD)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wa-dedicado"
                      placeholder="5511987654321"
                      value={numDedicado}
                      onChange={(e) => setNumDedicado(e.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                    />
                    <Button onClick={gerarCodigo} disabled={carregando || numDedicado.length < 12}>
                      {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar código"}
                    </Button>
                  </div>
                </div>
                {estado?.status === "code" && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Digite este código no WhatsApp
                    </div>
                    <div className="my-2 font-mono text-2xl font-bold tracking-[0.2em] text-foreground">
                      {estado.code}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No número dedicado: <b>Aparelhos conectados → Conectar um aparelho →</b>{" "}
                      <b>Conectar com número de telefone</b> e digite o código. A tela atualiza ao
                      parear.
                    </p>
                  </div>
                )}
              </div>
            )}

            {metodo === "qr" && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => conectarQr()}
                  disabled={carregando}
                >
                  {carregando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {estado?.status === "qr" ? "Gerar novo QR" : "Mostrar QR"}
                </Button>
                {estado?.status === "qr" && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <img
                      src={estado.qr}
                      alt="QR code do WhatsApp"
                      className="h-60 w-60 rounded-lg border border-border"
                    />
                    <p className="text-sm text-muted-foreground">
                      Escaneie <b>rápido</b> (o QR expira em ~1 min). Se falhar, clique em{" "}
                      <b>Gerar novo QR</b> ou use o <b>Código</b>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Teste de envio */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 font-medium">
          <Send className="h-4 w-4 text-primary" /> Enviar teste
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wa-num">Número de teste (o seu, com DDI+DDD)</Label>
          <Input
            id="wa-num"
            placeholder="5511987654321"
            value={numero}
            onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
          />
        </div>
        <Button
          onClick={enviarTeste}
          disabled={enviando || numero.length < 12}
          className="bg-primary font-semibold hover:bg-primary/90"
        >
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" /> Enviar teste
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Só envia se o WhatsApp estiver conectado. Mostra o erro real da Evolution se falhar.
        </p>
      </div>
    </div>
  );
}
