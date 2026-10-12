import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Loader2, Megaphone, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarCampanhaDaLista } from "@/services/campanhas";
import { listarListas, type LeadListComStats } from "@/lib/lists-api";

interface CriarCampanhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (campanhaId: string) => void;
}

export function CriarCampanhaModal({
  isOpen,
  onClose,
  onCreated,
}: CriarCampanhaModalProps) {
  const [listas, setListas] = useState<LeadListComStats[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [nomeCampanha, setNomeCampanha] = useState("");
  const [criandoId, setCriandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setErro(null);
    listarListas()
      .then((data) => setListas(data))
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar listas"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return (listas ?? []).filter((l) =>
      l.name.toLowerCase().includes(termo) ||
      (l.niche && l.niche.toLowerCase().includes(termo)) ||
      (l.city && l.city.toLowerCase().includes(termo)),
    );
  }, [listas, search]);

  const handleCriar = async (l: LeadListComStats) => {
    setCriandoId(l.id);
    try {
      const nomeFinal = nomeCampanha.trim() || l.name;
      const r = await criarCampanhaDaLista(l.id, nomeFinal);
      toast.success(
        `Campanha "${nomeFinal}" criada com ${r.total} leads. Custo zero de IA na criação.`,
      );
      onCreated(r.campanha_id);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar a campanha");
    } finally {
      setCriandoId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-home-border bg-home-surface text-home-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Megaphone className="size-5 text-home-orange" />
            Criar Nova Campanha Comercial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-home-muted leading-relaxed">
            Selecione uma lista de leads qualificados. Todos os leads entram com status{" "}
            <b className="text-white">Pendente (Custo Zero)</b>. Você escolhe na próxima tela quem preparar com IA.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="nome-campanha" className="text-xs font-semibold text-white">
              Nome da Campanha (opcional)
            </Label>
            <Input
              id="nome-campanha"
              placeholder="ex.: Odonto Prime Reativação Outubro"
              value={nomeCampanha}
              onChange={(e) => setNomeCampanha(e.target.value)}
              className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white">
              Escolha a lista de leads
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
              <Input
                placeholder="Filtrar listas por nome, nicho ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-home-border bg-home-background pl-9 text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-home-muted">
              <Loader2 className="size-4 animate-spin text-home-orange" />
              Carregando listas disponíveis...
            </div>
          ) : erro ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {erro}
            </div>
          ) : filtradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-home-border p-6 text-center text-xs text-home-muted">
              <FolderOpen className="mx-auto size-7 text-home-muted/60" />
              <p className="mt-2 font-medium text-white">Nenhuma lista encontrada</p>
              <p className="mt-0.5 text-[11px]">
                Crie ou exporte uma lista na Central de Leads antes de abrir uma campanha.
              </p>
            </div>
          ) : (
            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {filtradas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-home-border/60 bg-home-background/60 p-3 transition-colors hover:border-home-orange/40 hover:bg-home-surface-strong/60"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-xs truncate">
                      {l.name}
                    </div>
                    <div className="text-[11px] text-home-muted">
                      {l.leads_atuais} leads · {l.niche}
                      {l.city ? ` · ${l.city}` : ""}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCriar(l)}
                    disabled={criandoId !== null}
                    className="h-8 bg-home-orange text-xs font-semibold text-white hover:bg-home-orange/90"
                  >
                    {criandoId === l.id ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1 size-3.5" />
                        Selecionar
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
