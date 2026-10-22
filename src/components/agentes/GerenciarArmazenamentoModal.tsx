// Modal de Gerenciamento de Armazenamento e Limites
import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  HardDrive,
  Info,
  Layers,
  MessageSquare,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DETALHAMENTO_ARMAZENAMENTO } from "./memoria-data";

interface GerenciarArmazenamentoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export function GerenciarArmazenamentoModal({
  aberto,
  onFechar,
}: GerenciarArmazenamentoModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 shadow-2xl space-y-5">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-[#f95d14]">
              <HardDrive className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Armazenamento &amp; Limites</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Segundo Cérebro • Operação Comercial</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Consumo Geral */}
        <div className="rounded-xl border border-[#1e2638] bg-[#121620] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Uso Total da Organização</span>
            <span className="font-bold text-white">6.8 GB / 10 GB (68%)</span>
          </div>

          {/* Barra segmentada */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/5 flex">
            <div className="h-full bg-blue-500" style={{ width: "24%" }} title="Documentos: 2.4 GB" />
            <div className="h-full bg-emerald-500" style={{ width: "18%" }} title="Conversas: 1.8 GB" />
            <div className="h-full bg-cyan-500" style={{ width: "12%" }} title="Transcrições: 1.2 GB" />
            <div className="h-full bg-amber-500" style={{ width: "14%" }} title="Outros: 1.4 GB" />
          </div>

          {/* Legenda de categorias de armazenamento */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            {DETALHAMENTO_ARMAZENAMENTO.map((item) => (
              <div key={item.rotulo} className="flex items-center justify-between rounded-lg bg-black/30 px-2.5 py-1.5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", item.cor)} />
                  <span className="text-neutral-300">{item.rotulo}</span>
                </div>
                <span className="font-semibold text-white">{item.valor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Políticas de Retenção Demonstrativas */}
        <div className="space-y-2 text-xs">
          <p className="font-semibold uppercase tracking-wider text-neutral-400 text-[11px]">
            Políticas de Retenção e LGPD
          </p>
          <div className="space-y-1.5 rounded-xl border border-[#1e2638] bg-[#121620] p-3 text-neutral-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Memórias sensíveis são isoladas e protegidas por tenant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Transcrições de reuniões mantidas por 180 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Backups diários sincronizados com criptografia de ponta a ponta</span>
            </div>
          </div>
        </div>

        {/* Botão Fechar */}
        <div className="flex justify-end pt-2 border-t border-[#1b2232]">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl bg-[#f95d14] px-5 py-2 text-xs font-bold text-white hover:bg-[#ff6c26] transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
