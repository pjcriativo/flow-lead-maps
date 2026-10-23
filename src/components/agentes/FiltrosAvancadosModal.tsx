// Modal de Filtros Avançados para a Fila de Aprovações
// Permite segmentar por agentes, limites orçamentários, canais e níveis de criticidade.
import React, { useState } from "react";
import { Filter, Sliders, X } from "lucide-react";

interface FiltrosAvancadosModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAplicar: (filtros: {
    tipo: string;
    agente: string;
    status: string;
    impactoMinimo: string;
  }) => void;
}

export function FiltrosAvancadosModal({
  aberto,
  onFechar,
  onAplicar,
}: FiltrosAvancadosModalProps) {
  const [tipo, setTipo] = useState("todos");
  const [agente, setAgente] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [impactoMinimo, setImpactoMinimo] = useState("todos");

  if (!aberto) return null;

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

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Filtros Avançados</h3>
            <p className="text-xs text-neutral-400">
              Refine a lista de solicitações por governança e criticidade.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Tipo de Ação
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="campanha">Campanhas</option>
              <option value="prospeccao">Prospecção</option>
              <option value="reunioes">Reuniões</option>
              <option value="propostas">Propostas</option>
              <option value="integracao">Integrações</option>
              <option value="treinamento">Treinamentos</option>
              <option value="meta">Metas</option>
              <option value="equipe">Equipe</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Agente Solicitante
            </label>
            <select
              value={agente}
              onChange={(e) => setAgente(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            >
              <option value="todos">Todos os agentes</option>
              <option value="Estrategista">Estrategista</option>
              <option value="SDR">SDR</option>
              <option value="Prospecção">Prospecção</option>
              <option value="Vendedor">Vendedor</option>
              <option value="SEO Geral">SEO Geral</option>
              <option value="CEO de IA">CEO de IA</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Status da Aprovação
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            >
              <option value="todos">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovado">Aprovadas</option>
              <option value="rejeitado">Rejeitadas</option>
              <option value="em_execucao">Em execução</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onAplicar({ tipo, agente, status, impactoMinimo });
                onFechar();
              }}
              className="px-5 py-2 rounded-xl bg-[#f95d14] hover:bg-orange-600 text-xs font-bold text-white transition-all shadow-md shadow-orange-500/20"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
