// Modal de Visualização Completa do Plano de Vendas do CEO de IA
// Exibe o diagnóstico comercial, equipe comercial recomendada, funis e metas semanais.
import React from "react";
import {
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  DollarSign,
  FileText,
  Flame,
  Globe,
  Layers,
  Megaphone,
  Percent,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualizarPlanoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onNavegarEquipe?: () => void;
}

export function VisualizarPlanoModal({
  aberto,
  onFechar,
  onNavegarEquipe,
}: VisualizarPlanoModalProps) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Topo do Plano */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#f95d14]">
            <Target className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                Plano de Vendas Estratégico — Q4 2026
              </h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Aprovado
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Orquestrado pelo CEO de IA para acelerar aquisição, conversão e previsibilidade de receita.
            </p>
          </div>
        </div>

        {/* 3 Blocos Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
            <span className="text-[11px] font-semibold text-purple-300">
              Meta de Crescimento
            </span>
            <div className="text-xl font-bold text-white mt-1">+30%</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Acima do trimestre anterior
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <span className="text-[11px] font-semibold text-amber-300">
              Receita Projetada
            </span>
            <div className="text-xl font-bold text-white mt-1">R$ 750.000</div>
            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">
              + R$ 175.000 incremental
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <span className="text-[11px] font-semibold text-blue-300">
              Orçamento Operacional
            </span>
            <div className="text-xl font-bold text-white mt-1">R$ 20.000 / mês</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Canais pagos + ferramentas
            </p>
          </div>
        </div>

        {/* Seção 1: Nichos Prioritários */}
        <div className="space-y-2 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            1. Nichos Prioritários Selecionados
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { nome: "Clínicas Odontológicas", destaque: true },
              { nome: "Imobiliárias", destaque: false },
              { nome: "Academias & Fitness", destaque: false },
              { nome: "Restaurantes & Gastronomia", destaque: false },
              { nome: "E-commerces B2B", destaque: false },
            ].map((nicho) => (
              <span
                key={nicho.nome}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                  nicho.destaque
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-sm"
                    : "bg-[#141a27] border-white/5 text-neutral-300",
                )}
              >
                {nicho.nome}
              </span>
            ))}
          </div>
        </div>

        {/* Seção 2: Equipe Comercial Recomendada */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              2. Equipe Comercial Recomendada pelo CEO
            </h4>
            {onNavegarEquipe && (
              <button
                type="button"
                onClick={onNavegarEquipe}
                className="text-xs font-semibold text-[#f95d14] hover:underline"
              >
                Ver em Equipe & Enxames →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                nome: "CEO de IA",
                cargo: "Orquestrador Geral",
                funcao: "Coordenação estratégica, planejamento e supervisão",
                meta: "Atingimento global de R$ 750k",
              },
              {
                nome: "Estrategista",
                cargo: "Planejamento e Marketing",
                funcao: "Gestão de tráfego pago, copy e testes A/B",
                meta: "Gerar 450 MQLs qualificados",
              },
              {
                nome: "SDR Comercial",
                cargo: "Qualificação & Prospecção",
                funcao: "Abordagem no WhatsApp e agendamento de reuniões",
                meta: "60 Reuniões agendadas/mês",
              },
              {
                nome: "Vendedor Closer",
                cargo: "Fechamento Comercial",
                funcao: "Apresentação comercial e fechamento de propostas",
                meta: "35 Contratos fechados",
              },
              {
                nome: "Analista de Dados",
                cargo: "Relatórios & Performance",
                funcao: "Acompanhamento diário de CAC, LTV e conversão",
                meta: "Relatórios semanais automatizados",
              },
              {
                nome: "Gerente Comercial",
                cargo: "Supervisão da Operação",
                funcao: "Validação de permissões e resolução de conflitos",
                meta: "Taxa de comparecimento > 90%",
              },
            ].map((ag) => (
              <div
                key={ag.nome}
                className="rounded-xl border border-white/5 bg-[#121724] p-3 space-y-1 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ag.nome}</span>
                  <span className="text-[10px] text-neutral-400">{ag.cargo}</span>
                </div>
                <p className="text-[11px] text-neutral-300">{ag.funcao}</p>
                <div className="text-[10px] text-[#f95d14] font-semibold pt-1">
                  🎯 Meta: {ag.meta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção 3: Estratégias Principais */}
        <div className="space-y-2 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            3. Estratégias e Canais de Captação
          </h4>
          <ul className="space-y-2 text-xs text-neutral-300">
            <li className="flex items-start gap-2.5 rounded-xl bg-[#121724] border border-white/5 p-2.5">
              <div className="size-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </div>
              <div>
                <strong className="text-white">Prospecção Ativa Multicanal:</strong> Extração segmentada no Google Maps, enriquecimento e abordagem direta no WhatsApp.
              </div>
            </li>
            <li className="flex items-start gap-2.5 rounded-xl bg-[#121724] border border-white/5 p-2.5">
              <div className="size-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </div>
              <div>
                <strong className="text-white">Campanhas Pagas Segmentadas:</strong> Anúncios no Meta Ads e Google Ads direcionando leads para qualificação automática com SDR.
              </div>
            </li>
            <li className="flex items-start gap-2.5 rounded-xl bg-[#121724] border border-white/5 p-2.5">
              <div className="size-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </div>
              <div>
                <strong className="text-white">Agendamento & Closer:</strong> Disponibilidade de agenda sincronizada e handover com resumo de qualificação para o Closer.
              </div>
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
}
