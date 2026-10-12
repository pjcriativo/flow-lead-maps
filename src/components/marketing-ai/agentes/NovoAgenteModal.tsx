import { useState } from "react";
import { Bot, Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AgentItem } from "./agentes-data";

interface NovoAgenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (agent: AgentItem) => void;
}

export function NovoAgenteModal({ isOpen, onClose, onSave }: NovoAgenteModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentType, setAgentType] = useState<AgentItem["iconName"]>("Megaphone");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do agente.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newAgent: AgentItem = {
        id: `agent-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || "Agente especializado configurado.",
        iconName: agentType,
        colorTheme: "orange",
        status: "ativo",
        checklist: [
          "Automação de processos",
          "Análise contínua",
          "Geração de relatórios",
          "Execução comercial",
        ],
        actionLabel: "Configurar",
      };

      onSave?.(newAgent);
      setIsSubmitting(false);
      setName("");
      setDescription("");
      onClose();
      toast.success("Novo agente adicionado com sucesso!");
    }, 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border-home-border/80 bg-[#121620] p-6 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Bot className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Adicionar Agente de IA
              </DialogTitle>
              <DialogDescription className="text-xs text-home-muted mt-0.5">
                Crie um novo agente autônomo com diretivas personalizadas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              Nome do Agente *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Agente de Tráfego Pago"
              className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              Tipo de Especialidade
            </label>
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value as AgentItem["iconName"])}
              className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white outline-none focus:border-home-orange cursor-pointer"
            >
              <option value="Megaphone">Marketing e Campanhas</option>
              <option value="PenSquare">Conteúdo e Copywriting</option>
              <option value="Users">Público e Persona</option>
              <option value="ScanSearch">Concorrência e Mercado</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              Missão e Objetivo do Agente
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a finalidade principal deste agente de IA..."
              className="w-full rounded-xl border border-home-border/80 bg-[#161b26] p-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange resize-none"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-home-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 rounded-xl border border-home-border/80 bg-home-surface px-4 text-xs font-semibold text-white/90 hover:bg-home-surface-strong transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] px-5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Adicionar Agente
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
