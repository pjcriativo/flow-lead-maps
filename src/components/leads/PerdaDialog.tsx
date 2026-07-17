// Motivo ESTRUTURADO de perda/nutrição. Aparece quando o lead vai para "Perdido"/"Nutrição"
// (arrastar no Pipeline ou botão no modal). Guarda o motivo (lista fixa, contável) + anotação
// livre + quando, em leads. Alimenta o painel de aprendizado (ETAPA 3).
import { useEffect, useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
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
  registrarPerda,
  MOTIVOS_PERDA,
  STATUS_LABELS,
  type MotivoPerda,
  type Lead,
} from "@/lib/leads-api";

type StatusPerda = "lost" | "nurture";

export function PerdaDialog({
  lead,
  alvoStatus,
  open,
  onOpenChange,
  onConfirmado,
  onCancelar,
}: {
  lead: Lead;
  alvoStatus?: StatusPerda; // fixo quando veio do drop de uma coluna; senão o usuário escolhe
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirmado: (patch: Partial<Lead>) => void;
  onCancelar?: () => void;
}) {
  const [status, setStatus] = useState<StatusPerda>(alvoStatus ?? "lost");
  const [motivo, setMotivo] = useState<MotivoPerda>(MOTIVOS_PERDA[0]);
  const [anotacao, setAnotacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(alvoStatus ?? "lost");
      setMotivo(MOTIVOS_PERDA[0]);
      setAnotacao("");
    }
  }, [open, alvoStatus]);

  const fechar = (o: boolean) => {
    if (!o && !salvando) onCancelar?.();
    onOpenChange(o);
  };

  const confirmar = async () => {
    setSalvando(true);
    try {
      await registrarPerda(lead.id, { status, motivo, anotacao });
      const patch: Partial<Lead> = {
        status,
        motivo_perda: motivo,
        motivo_perda_nota: anotacao.trim() || null,
        perda_em: new Date().toISOString(),
      };
      onOpenChange(false);
      toast.success(`Lead marcado como ${STATUS_LABELS[status]} — motivo registrado.`);
      onConfirmado(patch);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar o motivo");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-500" /> Por que este lead saiu?
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          {!alvoStatus && (
            <div className="flex flex-col gap-1.5">
              <Label>Situação</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusPerda)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">{STATUS_LABELS.lost}</SelectItem>
                  <SelectItem value="nurture">{STATUS_LABELS.nurture}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoPerda)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_PERDA.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="perda-anotacao">Anotação</Label>
            <Textarea
              id="perda-anotacao"
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              placeholder="Detalhe (opcional)"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => fechar(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Botão do modal que abre o PerdaDialog (com seletor de situação). */
export function MarcarPerdaBotao({
  lead,
  onConfirmado,
}: {
  lead: Lead;
  onConfirmado: (patch: Partial<Lead>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <XCircle className="h-4 w-4" /> Marcar perdido/nutrição
      </Button>
      <PerdaDialog lead={lead} open={open} onOpenChange={setOpen} onConfirmado={onConfirmado} />
    </>
  );
}
