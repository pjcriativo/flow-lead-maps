// Modal para Editar Localmente o Contexto Atual do Copiloto
// Permite atualizar metas, orçamento e nichos ativos demonstrativamente.
import React, { useState } from "react";
import { Check, Edit2, Layers, Sliders, Target, X } from "lucide-react";
import type { ContextoComercial } from "./copiloto-data";

interface EditarContextoModalProps {
  aberto: boolean;
  contexto: ContextoComercial;
  onFechar: () => void;
  onSalvar: (contextoAtualizado: ContextoComercial) => void;
}

export function EditarContextoModal({
  aberto,
  contexto,
  onFechar,
  onSalvar,
}: EditarContextoModalProps) {
  const [plano, setPlano] = useState(contexto.planoDeVendas);
  const [meta, setMeta] = useState(contexto.metaPrincipal);
  const [orcamento, setOrcamento] = useState(contexto.orcamentoMensal);
  const [nichos, setNichos] = useState(contexto.nichosAtivos);
  const [campanhas, setCampanhas] = useState(contexto.campanhasEmAndamento);
  const [agentes, setAgentes] = useState(contexto.agentesOperacionais);

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({
      planoDeVendas: plano,
      metaPrincipal: meta,
      orcamentoMensal: orcamento,
      nichosAtivos: nichos,
      campanhasEmAndamento: campanhas,
      agentesOperacionais: agentes,
      ultimaAtualizacao: "Agora",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
            <Edit2 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Editar Contexto Atual</h3>
            <p className="text-xs text-neutral-400">
              Ajuste as informações operacionais ativas da operação.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Plano de Vendas Ativo
            </label>
            <input
              type="text"
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Meta Principal
            </label>
            <input
              type="text"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Orçamento Mensal
            </label>
            <input
              type="text"
              value={orcamento}
              onChange={(e) => setOrcamento(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Nichos Ativos
              </label>
              <input
                type="text"
                value={nichos}
                onChange={(e) => setNichos(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Campanhas Ativas
              </label>
              <input
                type="text"
                value={campanhas}
                onChange={(e) => setCampanhas(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 transition-all active:scale-[0.98]"
            >
              Salvar Contexto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
