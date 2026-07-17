// Tela WhatsApp — TUDO de zap num lugar só, com ABAS INTERNAS (modelo S-zap/Kaptar):
//   [ Conexão ] [ Campanhas ]            ← esta rodada
//   [ Conversas ] [ Scripts ] [ Painel ] ← rodadas seguintes (lugar previsto, não construído)
// Conexão: gestão de N chips (conectar vários, função/status/ordem, marcar queimado) + teste
// de envio. O MOTOR de campanha é COMPARTILHADO (canal='whatsapp') — a UI é que fica aqui.
import { useState } from "react";
import { Loader2, MessageCircle, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enviarTesteWhatsapp } from "@/services/whatsapp";
import { ChipsManager } from "./ChipsManager";
import { WaCampanhas } from "./WaCampanhas";

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
    <div className="space-y-3 rounded-xl border border-border bg-card p-6">
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
        onClick={enviar}
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
        Usa o chip principal (primário) da org. Mostra o erro real da Evolution se falhar.
      </p>
    </div>
  );
}

function EmBreve({ titulo }: { titulo: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {titulo} — em breve.
    </div>
  );
}

export function WhatsAppSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Chips descartáveis com rodízio, disparo com link e conversas — tudo num lugar só.
        </p>
      </div>

      <Tabs defaultValue="conexao">
        <TabsList>
          <TabsTrigger value="conexao">Conexão</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
          <TabsTrigger value="conversas" disabled>
            Conversas
          </TabsTrigger>
          <TabsTrigger value="scripts" disabled>
            Scripts
          </TabsTrigger>
          <TabsTrigger value="painel" disabled>
            Painel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conexao" className="space-y-6 pt-4">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-medium">
              <Smartphone className="h-4 w-4 text-primary" /> Conexão dos chips
            </div>
            <ChipsManager />
          </div>
          <EnviarTeste />
        </TabsContent>

        <TabsContent value="campanhas" className="pt-4">
          <WaCampanhas />
        </TabsContent>

        <TabsContent value="conversas" className="pt-4">
          <EmBreve titulo="Conversas" />
        </TabsContent>
        <TabsContent value="scripts" className="pt-4">
          <EmBreve titulo="Scripts" />
        </TabsContent>
        <TabsContent value="painel" className="pt-4">
          <EmBreve titulo="Painel" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
