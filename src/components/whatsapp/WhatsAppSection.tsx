// Fase 2 — WhatsApp (peça 1: PROVA DE CONEXÃO). Botão "Conectar WhatsApp" mostra o
// QR + status (desconectado/QR/conectado, atualiza ao parear) e "Enviar teste" manda
// 1 mensagem real pro próprio dono. NÃO faz disparo pra leads/campanha/proposta —
// isso é peça 2 (depois do aquecimento de chip).
import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, RefreshCw, CheckCircle2, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { conectarWhatsapp, enviarTesteWhatsapp, type WaConnect } from "@/services/whatsapp";

export function WhatsAppSection() {
  const [estado, setEstado] = useState<WaConnect | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [numero, setNumero] = useState("");
  const [enviando, setEnviando] = useState(false);
  const pollRef = useRef<number | null>(null);

  const conectado = estado?.status === "conectado";

  const conectar = async (silent = false) => {
    if (!silent) setCarregando(true);
    try {
      const r = await conectarWhatsapp();
      setEstado(r);
      if (r.status === "erro") toast.error(r.error);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Falha ao conectar");
    } finally {
      if (!silent) setCarregando(false);
    }
  };

  // Enquanto mostra QR, faz polling pra detectar o pareamento automaticamente.
  useEffect(() => {
    if (estado?.status !== "qr") return;
    pollRef.current = window.setInterval(() => conectar(true), 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [estado?.status]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Smartphone className="h-4 w-4 text-primary" /> Conexão
          </div>
          <Button variant="outline" size="sm" onClick={() => conectar()} disabled={carregando}>
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {conectado ? "Atualizar" : "Conectar WhatsApp"}
          </Button>
        </div>

        {conectado && (
          <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" /> Conectado
            {estado.status === "conectado" && estado.numero ? ` · ${estado.numero}` : ""}
          </div>
        )}

        {estado?.status === "qr" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={estado.qr}
              alt="QR code do WhatsApp"
              className="h-64 w-64 rounded-lg border border-border"
            />
            <p className="text-sm text-muted-foreground">
              No WhatsApp do número dedicado: <b>Aparelhos conectados</b> →{" "}
              <b>Conectar um aparelho</b> e escaneie. A tela atualiza sozinha ao parear.
            </p>
          </div>
        )}

        {estado?.status === "aguardando" && (
          <p className="text-sm text-muted-foreground">{estado.aviso ?? "Gerando QR..."}</p>
        )}
        {!estado && !carregando && (
          <p className="text-sm text-muted-foreground">
            Clique em "Conectar WhatsApp" para gerar o QR de pareamento.
          </p>
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
