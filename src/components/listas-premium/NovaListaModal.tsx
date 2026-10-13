// Modal Nova Lista — Orientação transparente e fluxos seguros de criação
import { Search, Users, ShieldAlert, Sparkles, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NovaListaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  onOpenLeadsCentral: () => void;
}

export function NovaListaModal({
  isOpen,
  onClose,
  onOpenSearch,
  onOpenLeadsCentral,
}: NovaListaModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-home-border bg-home-surface text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <Plus className="size-4 text-amber-500" />
            Criar Nova Lista Comercial
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-xs text-home-muted leading-relaxed">
            No Flow Business, as listas comerciais organizam grupos reais de empresas para campanhas e estratégias. Escolha o método de criação desejado:
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Opção 1: Nova Busca Automática */}
            <div
              onClick={() => {
                onClose();
                onOpenSearch();
              }}
              className="group flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface-strong/80 p-4 transition-all duration-200 hover:border-amber-500/80 hover:bg-home-surface-strong cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 mb-3">
                  <Search className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Nova Prospecção
                </h4>
                <p className="mt-1 text-xs text-home-muted leading-relaxed">
                  Buscar empresas no Google Maps por nicho e cidade. Uma lista qualificada é gerada automaticamente.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                Iniciar busca →
              </div>
            </div>

            {/* Opção 2: Agrupar da Central de Leads */}
            <div
              onClick={() => {
                onClose();
                onOpenLeadsCentral();
              }}
              className="group flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface-strong/80 p-4 transition-all duration-200 hover:border-blue-500/80 hover:bg-home-surface-strong cursor-pointer"
            >
              <div>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 mb-3">
                  <Users className="size-4.5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  A partir de Leads
                </h4>
                <p className="mt-1 text-xs text-home-muted leading-relaxed">
                  Selecione leads salvos na Central de Leads e crie uma nova lista segmentada em lote.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-400">
                Ver Central de Leads →
              </div>
            </div>
          </div>

          {/* Nota de Segurança e Contrato Real (Prompt 36) */}
          <div className="flex items-start gap-2.5 rounded-xl border border-home-border/80 bg-home-surface-strong/50 p-3 text-[11px] text-home-muted">
            <ShieldAlert className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Proteção Multi-Tenant:</strong> Para evitar listas órfãs ou sem dados comerciais válidos, toda lista é associada diretamente a leads verificados ou a buscas ativas.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
