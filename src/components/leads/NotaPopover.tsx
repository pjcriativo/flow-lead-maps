// Anotação (leads.notes) acessível SEM sair da tela — no card e no modal do Pipeline.
// O botão é o próprio INDICADOR: fica âmbar/destacado quando o lead TEM anotação (ver de
// relance), e neutro quando não tem. Abre um popover para ver/editar e salvar na hora.
import { useEffect, useState } from "react";
import { StickyNote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { updateLead, type Lead } from "@/lib/leads-api";

export function NotaBotao({
  lead,
  onSalvo,
}: {
  lead: Lead;
  onSalvo?: (notes: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(lead.notes ?? "");
  const [salvando, setSalvando] = useState(false);
  const tem = !!(lead.notes && lead.notes.trim());

  useEffect(() => {
    if (open) setTexto(lead.notes ?? "");
  }, [open, lead.notes]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const v = texto.trim() || null;
      await updateLead(lead.id, { notes: v });
      onSalvo?.(v);
      setOpen(false);
      toast.success(v ? "Anotação salva." : "Anotação removida.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar a anotação");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          title={tem ? "Tem anotação — clique para ver/editar" : "Adicionar anotação"}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            tem
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          <StickyNote className="h-3.5 w-3.5" />
          {tem ? "Anotação" : "Anotar"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 text-xs font-semibold text-muted-foreground">Anotação do lead</div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Observações sobre este lead (visível no pipeline)"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
