import React from "react";
import {
  X,
  Target,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { CampanhaResultado } from "./relatorios-data";

interface DetalhesCampanhaModalProps {
  campanha: CampanhaResultado | null;
  aberto: boolean;
  onFechar: () => void;
}

export function DetalhesCampanhaModal({
  campanha,
  aberto,
  onFechar,
}: DetalhesCampanhaModalProps) {
  if (!aberto || !campanha) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${campanha.bgCanal} ${campanha.corCanal}`}>
              <Target className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{campanha.nome}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                <span>Canal: <strong className="text-neutral-200">{campanha.canal}</strong></span>
                <span>•</span>
                <span>Nicho: <strong className="text-neutral-200">{campanha.nicho}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Métricas da Campanha */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#121620] border border-white/5">
              <span className="text-[11px] text-neutral-400 block">Status</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-1">
                <span className={`size-2 rounded-full ${campanha.status === "Ativa" ? "bg-emerald-400" : "bg-rose-400"}`} />
                {campanha.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#121620] border border-white/5">
              <span className="text-[11px] text-neutral-400 block">Leads Captados</span>
              <span className="text-sm font-bold text-cyan-400 font-mono mt-1 block">
                {campanha.leads.toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#121620] border border-white/5">
              <span className="text-[11px] text-neutral-400 block">Vendas Concluídas</span>
              <span className="text-sm font-bold text-amber-400 font-mono mt-1 block">
                {campanha.vendas}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#121620] border border-white/5">
              <span className="text-[11px] text-neutral-400 block">ROI Registrado</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
                {campanha.roi}
              </span>
            </div>
          </div>

          {/* Conversões por Etapa */}
          <div className="p-4 rounded-xl bg-[#121620] border border-white/5 space-y-2.5">
            <span className="text-xs font-semibold text-neutral-300 block">
              Eficiência no Funil
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-neutral-400 block text-[10px]">Reuniões / Leads</span>
                <span className="text-white font-bold font-mono">
                  {((campanha.reunioes / campanha.leads) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-neutral-500 block">({campanha.reunioes} agend.)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-neutral-400 block text-[10px]">Propostas / Reuniões</span>
                <span className="text-white font-bold font-mono">
                  {((campanha.propostas / campanha.reunioes) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-neutral-500 block">({campanha.propostas} env.)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-neutral-400 block text-[10px]">Vendas / Propostas</span>
                <span className="text-white font-bold font-mono">
                  {((campanha.vendas / campanha.propostas) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-neutral-500 block">({campanha.vendas} fech.)</span>
              </div>
            </div>
          </div>

          {/* Receita Atribuída */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <span className="text-xs text-neutral-400 block">Receita Total Atribuída</span>
              <span className="text-lg font-bold text-white font-mono">{campanha.receita}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-neutral-400 block">Ticket Médio</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                R$ {(campanha.receitaNumerica / campanha.vendas).toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-6 flex items-center justify-end pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
