// Tela WhatsApp — TUDO de zap num lugar só, no layout do S-zap/Kaptar (SÓ referência visual; a
// marca e os recursos são do Flow Leads). Abas internas: [Painel][WhatsApp][Campanhas][Conversas]
// [Scripts]. O MOTOR de campanha é COMPARTILHADO (canal='whatsapp'); a gestão de N chips + rodízio
// (ETAPAS 1-3) fica na aba WhatsApp. Nenhum item novo na sidebar — tudo aqui dentro.
import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  MessageCircle,
  Send,
  Trash2,
  Smartphone,
  BarChart3,
  Megaphone,
  MessagesSquare,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  enviarTesteWhatsapp,
  estatisticasWa,
  limparConversas,
  type WaEstatisticas,
} from "@/services/whatsapp";
import { ChipsManager } from "./ChipsManager";
import { WaCampanhas } from "./WaCampanhas";
import { WaPainel } from "./WaPainel";
import { WaConversas } from "./WaConversas";
import { WaScripts } from "./WaScripts";

type Aba = "painel" | "whatsapp" | "campanhas" | "conversas" | "scripts";
const ABAS: { key: Aba; label: string; icon: React.ReactNode }[] = [
  { key: "painel", label: "Painel", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> },
  { key: "campanhas", label: "Campanhas", icon: <Megaphone className="h-4 w-4" /> },
  { key: "conversas", label: "Conversas", icon: <MessagesSquare className="h-4 w-4" /> },
  { key: "scripts", label: "Scripts", icon: <Zap className="h-4 w-4" /> },
];

export function WhatsAppSection() {
  const [aba, setAba] = useState<Aba>("painel");
  const [conectado, setConectado] = useState<boolean | null>(null);

  const checarConexao = useCallback(async () => {
    try {
      const s = await estatisticasWa();
      setConectado(s.conectado);
    } catch {
      setConectado(false);
    }
  }, []);
  useEffect(() => {
    checarConexao();
  }, [checarConexao]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header estilo S-zap */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <MessageCircle className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              Disparador e conversas — tudo num lugar só
            </p>
          </div>
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
            conectado ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              conectado ? "bg-emerald-500" : "bg-muted-foreground/50",
            )}
          />
          {conectado === null ? "…" : conectado ? "Conectado" : "Desconectado"}
        </span>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        {ABAS.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition",
              aba === a.key
                ? "border-emerald-500 font-medium text-emerald-600"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "painel" && (
        <WaPainel
          onIrParaWhatsApp={() => setAba("whatsapp")}
          onIrParaCampanhas={() => setAba("campanhas")}
        />
      )}
      {aba === "whatsapp" && <AbaWhatsApp onMudou={checarConexao} />}
      {aba === "campanhas" && <WaCampanhas />}
      {aba === "conversas" && <WaConversas />}
      {aba === "scripts" && <WaScripts />}
    </div>
  );
}

// Aba WhatsApp: conexão (gestão de N chips + rodízio) + teste + limpar histórico.
function AbaWhatsApp({ onMudou }: { onMudou: () => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone className="h-4 w-4 text-emerald-600" /> Conexão dos chips
        </div>
        <ChipsManager onMudou={onMudou} />
      </div>
      <EnviarTeste />
      <LimparHistorico />
    </div>
  );
}

function EnviarTeste() {
  const [numero, setNumero] = useState("");
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
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
    <div className="space-y-3 rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2 font-medium">
        <Send className="h-4 w-4 text-emerald-600" /> Enviar teste
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
      <Button onClick={enviar} disabled={enviando || numero.length < 12}>
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
        Usa o chip principal (primário) da org. Mostra o erro real da Evolution se falhar.
      </p>
    </div>
  );
}

function LimparHistorico() {
  const [limpando, setLimpando] = useState(false);
  const limpar = async () => {
    setLimpando(true);
    try {
      const n = await limparConversas();
      toast.success(`Histórico limpo (${n} mensagens removidas).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao limpar");
    } finally {
      setLimpando(false);
    }
  };
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-5">
      <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
      <div className="flex-1">
        <div className="font-medium">Limpar histórico de conversas</div>
        <p className="text-sm text-muted-foreground">
          Remove as conversas guardadas nesta org. Novas mensagens recebidas voltam a aparecer.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={limpar} disabled={limpando}>
        {limpando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Limpar
      </Button>
    </div>
  );
}
