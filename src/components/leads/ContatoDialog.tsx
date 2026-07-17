// "Registrar contato" MANUAL — botão + diálogo reutilizável (modal do lead e card do Pipeline).
// Grava no histórico (lead_contatos → linha do tempo) e move o lead para "Contatado" sem
// regredir quem já está mais adiantado. NÃO cria proposta → não dispara follow-up.
import { useState } from "react";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  registrarContato,
  CANAIS_CONTATO,
  STATUS_LABELS,
  type CanalContato,
  type Lead,
  type LeadStatus,
} from "@/lib/leads-api";

/** Date -> valor de <input type="datetime-local"> (respeita o fuso local). */
function paraInputLocal(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function RegistrarContatoBotao({
  lead,
  onRegistrado,
  variant = "outline",
  size = "sm",
  full = false,
  label = "Registrar contato",
}: {
  lead: Lead;
  onRegistrado?: (novoStatus: LeadStatus, quando: string) => void;
  variant?: "outline" | "secondary" | "ghost" | "default";
  size?: "sm" | "default";
  full?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [canal, setCanal] = useState<CanalContato>("whatsapp");
  const [quando, setQuando] = useState(() => paraInputLocal(new Date()));
  const [anotacao, setAnotacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const abrir = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCanal("whatsapp");
    setQuando(paraInputLocal(new Date()));
    setAnotacao("");
    setOpen(true);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const { novoStatus, quando: q } = await registrarContato(lead.id, {
        canal,
        anotacao,
        contatado_em: new Date(quando).toISOString(),
        statusAtual: lead.status,
      });
      setOpen(false);
      toast.success(
        novoStatus === "contacted"
          ? "Contato registrado — lead movido para Contatado."
          : `Contato registrado — status mantido em ${STATUS_LABELS[novoStatus] ?? novoStatus}.`,
      );
      onRegistrado?.(novoStatus, q);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar o contato");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={abrir} className={full ? "w-full" : ""}>
        <MessageSquarePlus className="h-4 w-4" /> {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Registrar contato</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <Label>Canal</Label>
              <Select value={canal} onValueChange={(v) => setCanal(v as CanalContato)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CANAIS_CONTATO.map((c) => (
                    <SelectItem key={c.valor} value={c.valor}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-quando">Data e hora</Label>
              <input
                id="contato-quando"
                type="datetime-local"
                value={quando}
                onChange={(e) => setQuando(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contato-anotacao">Anotação</Label>
              <Textarea
                id="contato-anotacao"
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
                placeholder="O que foi conversado? (opcional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
