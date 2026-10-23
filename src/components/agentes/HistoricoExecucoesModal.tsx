// Modal de Histórico de Execuções dos Fluxos
// Exibe linha do tempo e status das execuções demonstrativas.
import React, { useState } from "react";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  History,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoricoExecucoesModalProps {
  aberto: boolean;
  onFechar: () => void;
}

interface ItemHistorico {
  id: string;
  fluxo: string;
  lead: string;
  empresa: string;
  status: "sucesso" | "em_andamento" | "falha";
  dataHora: string;
  duracao: string;
  etapasConcluidas: number;
  totalEtapas: number;
  agenteLider: string;
}

const HISTORICO_DEMONSTRATIVO: ItemHistorico[] = [
  {
    id: "hist-1",
    fluxo: "Qualificação de Leads",
    lead: "Dr. Carlos Eduardo",
    empresa: "Clínica Sorriso Prime",
    status: "sucesso",
    dataHora: "20/10/2026 14:32",
    duracao: "1m 45s",
    etapasConcluidas: 6,
    totalEtapas: 6,
    agenteLider: "CEO de IA",
  },
  {
    id: "hist-2",
    fluxo: "Agendamento de Reuniões",
    lead: "Dra. Renata Vasconcelos",
    empresa: "Hospital dos Olhos",
    status: "sucesso",
    dataHora: "20/10/2026 14:15",
    duracao: "2m 10s",
    etapasConcluidas: 5,
    totalEtapas: 5,
    agenteLider: "SDR",
  },
  {
    id: "hist-3",
    fluxo: "Qualificação de Leads",
    lead: "Marcos Paulo",
    empresa: "Auto Peças Progresso",
    status: "em_andamento",
    dataHora: "20/10/2026 13:58",
    duracao: "42s",
    etapasConcluidas: 3,
    totalEtapas: 6,
    agenteLider: "CEO de IA",
  },
  {
    id: "hist-4",
    fluxo: "Follow-up Automático",
    lead: "Juliana Mendes",
    empresa: "Tech Cloud Soluções",
    status: "sucesso",
    dataHora: "20/10/2026 13:40",
    duracao: "3m 05s",
    etapasConcluidas: 4,
    totalEtapas: 4,
    agenteLider: "SDR",
  },
  {
    id: "hist-5",
    fluxo: "Proposta Comercial",
    lead: "Fernando Albuquerque",
    empresa: "Construtora Horizonte",
    status: "sucesso",
    dataHora: "20/10/2026 12:20",
    duracao: "2m 50s",
    etapasConcluidas: 5,
    totalEtapas: 5,
    agenteLider: "Vendedor",
  },
  {
    id: "hist-6",
    fluxo: "Qualificação de Leads",
    lead: "Beatriz Lemos",
    empresa: "Restaurante Villa Gourmet",
    status: "falha",
    dataHora: "20/10/2026 11:45",
    duracao: "15s",
    etapasConcluidas: 1,
    totalEtapas: 6,
    agenteLider: "CEO de IA",
  },
];

export function HistoricoExecucoesModal({
  aberto,
  onFechar,
}: HistoricoExecucoesModalProps) {
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "sucesso" | "em_andamento" | "falha">("todos");

  if (!aberto) return null;

  const itensFiltrados = HISTORICO_DEMONSTRATIVO.filter(
    (i) => filtroStatus === "todos" || i.status === filtroStatus
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <History className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Histórico de Execuções dos Fluxos</h3>
            <p className="text-xs text-neutral-400">
              Registro das últimas automações processadas pela equipe de agentes de IA.
            </p>
          </div>
        </div>

        {/* Filtros de Status */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#141824] p-1">
            {[
              { id: "todos", rotulo: "Todas (6)" },
              { id: "sucesso", rotulo: "Sucesso (4)" },
              { id: "em_andamento", rotulo: "Em andamento (1)" },
              { id: "falha", rotulo: "Falha (1)" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFiltroStatus(st.id as any)}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
                  filtroStatus === st.id
                    ? "bg-[#FF5500] text-white"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {st.rotulo}
              </button>
            ))}
          </div>

          <span className="text-xs text-neutral-400">
            Últimas 24 horas • Modo Demonstração
          </span>
        </div>

        {/* Tabela / Lista de Execuções */}
        <div className="mt-4 space-y-2.5">
          {itensFiltrados.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#121620] p-3.5 transition-colors hover:border-white/10"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    item.status === "sucesso"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : item.status === "em_andamento"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  )}
                >
                  {item.status === "sucesso" ? (
                    <CheckCircle2 className="size-4" />
                  ) : item.status === "em_andamento" ? (
                    <Activity className="size-4" />
                  ) : (
                    <AlertCircle className="size-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.fluxo}</span>
                    <span className="text-[10px] text-neutral-400">({item.etapasConcluidas}/{item.totalEtapas} etapas)</span>
                  </div>
                  <p className="text-[11px] text-neutral-300">
                    Lead: <strong className="text-white">{item.lead}</strong> • {item.empresa}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-neutral-400 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                <div className="text-right">
                  <div className="text-[10px] text-neutral-400">{item.dataHora}</div>
                  <div className="text-[11px] font-medium text-neutral-300">Duração: {item.duracao}</div>
                </div>

                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize",
                    item.status === "sucesso"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : item.status === "em_andamento"
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  )}
                >
                  {item.status === "em_andamento" ? "Em andamento" : item.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
