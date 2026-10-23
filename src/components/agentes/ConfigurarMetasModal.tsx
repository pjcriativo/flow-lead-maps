// Modal de Configuração de Metas Comerciais da Semana
// Permite ajustar valores planejados e metas por indicador no ambiente local.
import React, { useState } from "react";
import {
  CalendarCheck,
  Check,
  DollarSign,
  Filter,
  FileText,
  Sliders,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import type { MetaSemanaItem } from "./planejamento-data";

interface ConfigurarMetasModalProps {
  aberto: boolean;
  onFechar: () => void;
  metas: MetaSemanaItem[];
  onSalvarMetas: (novasMetas: MetaSemanaItem[]) => void;
}

export function ConfigurarMetasModal({
  aberto,
  onFechar,
  metas,
  onSalvarMetas,
}: ConfigurarMetasModalProps) {
  const [metasLocais, setMetasLocais] = useState<MetaSemanaItem[]>(metas);

  if (!aberto) return null;

  const handleAtualizarMeta = (id: string, novoValorPlanejado: string | number) => {
    setMetasLocais((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const valAtual = typeof m.atual === "number" ? m.atual : parseFloat(String(m.atual).replace(/[^\d.-]/g, "")) || 0;
        const valMeta = typeof novoValorPlanejado === "number" ? novoValorPlanejado : parseFloat(String(novoValorPlanejado).replace(/[^\d.-]/g, "")) || 1;
        const perc = Math.min(100, Math.round((valAtual / (valMeta || 1)) * 100));
        return {
          ...m,
          meta: novoValorPlanejado,
          porcentagem: perc,
        };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarMetas(metasLocais);
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Configurar Metas da Semana</h3>
            <p className="text-xs text-neutral-400">
              Defina os alvos de desempenho a serem perseguidos pelos agentes de IA.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          {metasLocais.map((meta) => {
            const Icon = meta.icon;
            return (
              <div
                key={meta.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#141824] p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-300">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-white block truncate">{meta.nome}</span>
                    <span className="text-[10px] text-neutral-400">
                      Atual: <strong className="text-neutral-200">{meta.atual}</strong> ({meta.porcentagem}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">Meta:</span>
                  <input
                    type="text"
                    value={meta.meta}
                    onChange={(e) => handleAtualizarMeta(meta.id, e.target.value)}
                    className="w-24 rounded-lg border border-white/10 bg-[#0c1017] px-2.5 py-1.5 text-xs font-bold text-white text-right focus:border-orange-500/60 focus:outline-none"
                  />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors"
            >
              <Check className="size-4" />
              <span>Salvar Metas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
