// Modal de Elaboração de Novo Plano de Vendas com o CEO de IA
// Permite ao cliente fornecer dados do negócio para estruturação da estratégia comercial.
import React, { useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  DollarSign,
  Globe,
  Layers,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NovoPlanoVendasModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (plano: {
    empresa: string;
    segmento: string;
    ticketMedio: string;
    metaFaturamento: string;
    orcamentoMensal: string;
    nichos: string;
    prazo: string;
  }) => void;
}

export function NovoPlanoVendasModal({
  aberto,
  onFechar,
  onSalvar,
}: NovoPlanoVendasModalProps) {
  const [empresa, setEmpresa] = useState("Flow Business Demo");
  const [segmento, setSegmento] = useState("SaaS / Serviços B2B");
  const [produtos, setProdutos] = useState("Plataforma de Prospecção e CRM Inteligente");
  const [publicoAlvo, setPublicoAlvo] = useState("PMEs, Clínicas, Imobiliárias e Escritórios");
  const [nichos, setNichos] = useState("Clínicas Odontológicas, Imobiliárias, Academias");
  const [regiao, setRegiao] = useState("Brasil (Nacional)");
  const [ticketMedio, setTicketMedio] = useState("R$ 2.500 / mês");
  const [metaFaturamento, setMetaFaturamento] = useState("R$ 750.000");
  const [metaClientes, setMetaClientes] = useState("35 novos clientes");
  const [orcamentoMensal, setOrcamentoMensal] = useState("R$ 20.000");
  const [canais, setCanais] = useState("Google Maps, Instagram, LinkedIn, WhatsApp");
  const [prazo, setPrazo] = useState("Q4 2026 (3 meses)");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar({
      empresa,
      segmento,
      ticketMedio,
      metaFaturamento,
      orcamentoMensal,
      nichos,
      prazo,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Novo Plano de Vendas com CEO de IA
            </h3>
            <p className="text-xs text-neutral-400">
              Apresente o seu negócio e o CEO organizará a estrutura de agentes e metas.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Nome da Empresa
              </label>
              <input
                type="text"
                required
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Segmento / Mercado
              </label>
              <input
                type="text"
                required
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300">
              Produtos ou Serviços Ofertados
            </label>
            <input
              type="text"
              required
              value={produtos}
              onChange={(e) => setProdutos(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Nichos Desejados
              </label>
              <input
                type="text"
                required
                value={nichos}
                onChange={(e) => setNichos(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Região de Atuação
              </label>
              <input
                type="text"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Ticket Médio
              </label>
              <input
                type="text"
                value={ticketMedio}
                onChange={(e) => setTicketMedio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Meta de Receita
              </label>
              <input
                type="text"
                value={metaFaturamento}
                onChange={(e) => setMetaFaturamento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Orçamento Mensal
              </label>
              <input
                type="text"
                value={orcamentoMensal}
                onChange={(e) => setOrcamentoMensal(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Canais Disponíveis
              </label>
              <input
                type="text"
                value={canais}
                onChange={(e) => setCanais(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-300">
                Prazo do Planejamento
              </label>
              <input
                type="text"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#141a27] px-3 py-2 text-white placeholder-neutral-500 focus:border-[#f95d14] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300/90 leading-relaxed">
            ℹ️ <strong>Demonstração Frontend</strong>: O CEO de IA utilizará estas diretrizes para formular o diagnóstico comercial e sugerir a equipe na futura integração com o motor de inteligência artificial.
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
              Estruturar Plano com CEO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
