// Modal Elegante de Renomeação de Lista (Substitui window.prompt com visual dark premium)
import { useEffect, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LeadListWithFullStats } from "./listas-premium-data";

interface RenomearListaModalProps {
  isOpen: boolean;
  lista: LeadListWithFullStats | null;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export function RenomearListaModal({
  isOpen,
  lista,
  onClose,
  onConfirm,
}: RenomearListaModalProps) {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (lista) {
      setNome(lista.name);
    }
  }, [lista]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.trim() === lista?.name) {
      onClose();
      return;
    }
    setSalvando(true);
    try {
      await onConfirm(nome.trim());
      onClose();
    } catch {
      // Erro já notificado pelo toast
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !salvando && !open && onClose()}>
      <DialogContent className="border-home-border bg-home-surface text-white sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Pencil className="size-4 text-amber-500" />
              Renomear Lista de Leads
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <label className="block text-xs font-medium text-home-muted">
              Novo nome da lista
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Clínicas Odontológicas — São Paulo"
              autoFocus
              disabled={salvando}
              className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white placeholder:text-home-muted outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={salvando}
              onClick={onClose}
              className="border-home-border bg-home-surface-strong text-xs font-semibold text-white hover:bg-home-surface"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={salvando || !nome.trim()}
              className="bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
            >
              {salvando ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
