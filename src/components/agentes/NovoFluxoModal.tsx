// Modal para Criação de Novo Fluxo de Automação Comercial
// Permite criar fluxos locais demonstrativos mantendo fidelidade à identidade visual.
import React, { useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  GitBranch,
  Layers,
  Sparkles,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NovoFluxoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriarFluxo: (dados: {
    nome: string;
    categoria: "prospeccao" | "vendas" | "pos_venda";
    agente: string;
    descricao: string;
    modeloBase: string;
  }) => void;
}

export function NovoFluxoModal({
  aberto,
  onFechar,
  onCriarFluxo,
}: NovoFluxoModalProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<"prospeccao" | "vendas" | "pos_venda">("prospeccao");
  const [agente, setAgente] = useState("CEO de IA");
  const [descricao, setDescricao] = useState("");
  const [modeloBase, setModeloBase] = useState("em_branco");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onCriarFluxo({
      nome: nome.trim(),
      categoria,
      agente,
      descricao: descricao.trim() || "Fluxo comercial orquestrado por agentes de IA.",
      modeloBase,
    });
    setNome("");
    setDescricao("");
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <GitBranch className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Criar Novo Fluxo Comercial</h3>
            <p className="text-xs text-neutral-400">
              Desenhe um processo com seus agentes de IA no canvas interativo.
            </p>
          </div>
        </div>

        {/* Alerta de demonstração */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-neutral-300">
          <AlertCircle className="size-4 text-orange-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-orange-400 font-medium">Modo Construtor Visual:</strong> O novo fluxo será criado no ambiente de demonstração local e poderá ser conectado ao motor de execuções nas próximas etapas.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome do Fluxo */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Nome do Fluxo *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Prospecção de Clínicas Odontológicas"
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>

          {/* Categoria & Agente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              >
                <option value="prospeccao">Prospecção</option>
                <option value="vendas">Vendas</option>
                <option value="pos_venda">Pós-venda</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Agente Líder / Orquestrador
              </label>
              <select
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              >
                <option value="CEO de IA">CEO de IA (Orquestrador)</option>
                <option value="SDR Prospecção">SDR Prospecção</option>
                <option value="Vendedor Consultivo">Vendedor Consultivo</option>
                <option value="CS Onboarding">CS Onboarding</option>
              </select>
            </div>
          </div>

          {/* Modelo Base */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Estrutura Inicial
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "em_branco", label: "Em branco (do zero)", sub: "Apenas nó de início" },
                { id: "qualificacao", label: "Qualificação & SDR", sub: "Estrutura com 6 etapas" },
                { id: "agendamento", label: "Agendamento Direto", sub: "Disponibilidade e agenda" },
                { id: "followup", label: "Cadência Follow-up", sub: "Tentativas e espera" },
              ].map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setModeloBase(mod.id)}
                  className={cn(
                    "flex flex-col text-left p-2.5 rounded-xl border transition-all",
                    modeloBase === mod.id
                      ? "border-orange-500/70 bg-orange-500/10 text-white"
                      : "border-white/5 bg-[#141824] text-neutral-400 hover:border-white/15 hover:text-neutral-200"
                  )}
                >
                  <span className="font-semibold text-neutral-200">{mod.label}</span>
                  <span className="text-[10px] text-neutral-500">{mod.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Descrição do Objetivo
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo das etapas e critérios de sucesso..."
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            />
          </div>

          {/* Rodapé / Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition-colors disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>Criar Fluxo no Canvas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
