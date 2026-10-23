// Modal de Criação de Nova Solicitação de Aprovação
// Permite cadastrar uma ação de teste para validação de governança local.
import React, { useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import type { SolicitacaoAprovacaoItem } from "./aprovacoes-data";

interface NovaAprovacaoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriar: (solicitacao: Omit<SolicitacaoAprovacaoItem, "id" | "numero" | "solicitadoEm">) => void;
}

export function NovaAprovacaoModal({
  aberto,
  onFechar,
  onCriar,
}: NovaAprovacaoModalProps) {
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [agenteNome, setAgenteNome] = useState("Estrategista");
  const [tipo, setTipo] = useState<SolicitacaoAprovacaoItem["tipo"]>("campanha");
  const [valorOuImpacto, setValorOuImpacto] = useState("R$ 1.500");
  const [valorSub, setValorSub] = useState("Orçamento adicional");
  const [descricaoCompleta, setDescricaoCompleta] = useState("");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    let corTipo: SolicitacaoAprovacaoItem["corTipo"] = "roxo";
    let tipoRotulo = "Campanha";
    if (tipo === "campanha") { corTipo = "roxo"; tipoRotulo = "Campanha"; }
    else if (tipo === "prospeccao") { corTipo = "azul"; tipoRotulo = "Prospecção"; }
    else if (tipo === "reunioes") { corTipo = "verde"; tipoRotulo = "Reuniões"; }
    else if (tipo === "propostas") { corTipo = "indigo"; tipoRotulo = "Propostas"; }
    else if (tipo === "integracao") { corTipo = "azul"; tipoRotulo = "Integração"; }
    else if (tipo === "treinamento") { corTipo = "laranja"; tipoRotulo = "Treinamento"; }
    else if (tipo === "meta") { corTipo = "rosa"; tipoRotulo = "Meta"; }
    else if (tipo === "equipe") { corTipo = "azul"; tipoRotulo = "Equipe"; }

    onCriar({
      titulo: titulo.trim(),
      subtitulo: subtitulo.trim() || "Ação cadastrada manualmente",
      agenteNome,
      agenteCargo: "Especialista comercial",
      agenteAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      tipo,
      tipoRotulo,
      corTipo,
      valorOuImpacto,
      valorSub,
      status: "pendente",
      descricaoCompleta: descricaoCompleta.trim() || titulo.trim(),
      orcamento: valorOuImpacto,
      periodo: "Sob demanda",
      objetivo: "Otimização da operação comercial",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Nova Solicitação de Aprovação
            </h3>
            <p className="text-xs text-neutral-400">
              Cadastre uma solicitação local para simular a fila de aprovações.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Título da Ação
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Liberar orçamento para anúncios"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Subtítulo / Contexto
            </label>
            <input
              type="text"
              placeholder="Ex: Campanha regional no Meta Ads"
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Agente Solicitante
              </label>
              <select
                value={agenteNome}
                onChange={(e) => setAgenteNome(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              >
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
                Tipo de Ação
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              >
                <option value="campanha">Campanha</option>
                <option value="prospeccao">Prospecção</option>
                <option value="reunioes">Reuniões</option>
                <option value="propostas">Propostas</option>
                <option value="integracao">Integração</option>
                <option value="treinamento">Treinamento</option>
                <option value="meta">Meta</option>
                <option value="equipe">Equipe</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Valor ou Quantidade
              </label>
              <input
                type="text"
                value={valorOuImpacto}
                onChange={(e) => setValorOuImpacto(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Impacto Operacional
              </label>
              <input
                type="text"
                value={valorSub}
                onChange={(e) => setValorSub(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Descrição Detalhada
            </label>
            <textarea
              rows={3}
              placeholder="Explique o objetivo e justificativa da ação..."
              value={descricaoCompleta}
              onChange={(e) => setDescricaoCompleta(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] p-3 text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#f95d14] to-orange-600 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:from-orange-500 hover:to-orange-600 transition-all active:scale-[0.98]"
            >
              <Plus className="size-4" />
              <span>Cadastrar Solicitação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
