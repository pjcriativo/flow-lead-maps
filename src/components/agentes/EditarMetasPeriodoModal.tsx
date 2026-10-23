import React, { useState } from "react";
import { X, Target, Save, CheckCircle2, DollarSign, Users, Video, Award } from "lucide-react";
import type { MetaPeriodo } from "./relatorios-data";

interface EditarMetasPeriodoModalProps {
  aberto: boolean;
  onFechar: () => void;
  metas: MetaPeriodo[];
  onSalvar: (novasMetas: MetaPeriodo[]) => void;
}

export function EditarMetasPeriodoModal({
  aberto,
  onFechar,
  metas,
  onSalvar,
}: EditarMetasPeriodoModalProps) {
  const [valoresMetas, setValoresMetas] = useState<Record<string, number>>(() => {
    const inicial: Record<string, number> = {};
    metas.forEach((m) => {
      inicial[m.id] = m.meta;
    });
    return inicial;
  });

  if (!aberto) return null;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const atualizadas: MetaPeriodo[] = metas.map((m) => {
      const novaMeta = valoresMetas[m.id] || m.meta;
      const novoPct = Math.min(100, Math.round((m.realizado / novaMeta) * 100));
      return {
        ...m,
        meta: novaMeta,
        metaTexto:
          m.id === "meta_receita"
            ? `R$ ${novaMeta.toLocaleString("pt-BR")}`
            : novaMeta.toLocaleString("pt-BR"),
        percentual: novoPct,
      };
    });
    onSalvar(atualizadas);
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f97316] border border-orange-500/30">
              <Target className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar Metas do Período</h2>
              <p className="text-xs text-neutral-400">
                Ajuste os objetivos comerciais para recalcular percentuais em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="mt-5 space-y-4">
          {metas.map((meta) => {
            return (
              <div
                key={meta.id}
                className="p-3.5 rounded-xl bg-[#121620] border border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                    {meta.titulo}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Realizado atual: <strong className="text-white">{meta.realizadoTexto}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400">Meta:</span>
                  <input
                    type="number"
                    value={valoresMetas[meta.id] ?? meta.meta}
                    onChange={(e) =>
                      setValoresMetas((prev) => ({
                        ...prev,
                        [meta.id]: Number(e.target.value) || 0,
                      }))
                    }
                    className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="text-xs font-mono text-neutral-400">
                    Novo progresso:{" "}
                    <strong className="text-orange-400">
                      {Math.min(
                        100,
                        Math.round((meta.realizado / (valoresMetas[meta.id] || 1)) * 100)
                      )}
                      %
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Rodapé */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Save className="size-4" />
              <span>Salvar Metas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
