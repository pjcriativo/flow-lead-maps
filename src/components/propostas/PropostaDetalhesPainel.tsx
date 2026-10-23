// Painel Lateral da Proposta Selecionada
import React, { useState } from "react";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileText,
  History,
  Lock,
  MoreVertical,
  Pencil,
  Send,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropostaComercialItem } from "./propostas-data";
import { SUGESTOES_IA_PADRAO } from "./propostas-data";

interface PropostaDetalhesPainelProps {
  proposta: PropostaComercialItem | null;
  onVerProposta: (p: PropostaComercialItem) => void;
  onEditar: (p: PropostaComercialItem) => void;
  onAprovar: (p: PropostaComercialItem) => void;
  onEnviar: (p: PropostaComercialItem) => void;
  onAplicarSugestaoIa?: (sugestaoId: string) => void;
}

type AbaPainel = "visao_geral" | "servicos" | "historico" | "arquivos";

export function PropostaDetalhesPainel({
  proposta,
  onVerProposta,
  onEditar,
  onAprovar,
  onEnviar,
  onAplicarSugestaoIa,
}: PropostaDetalhesPainelProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>("visao_geral");
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);

  if (!proposta) {
    return (
      <aside className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-6 flex flex-col items-center justify-center text-center h-full min-h-[500px]">
        <Building2 className="size-10 text-neutral-600 mb-3" />
        <h3 className="text-sm font-semibold text-neutral-300">Nenhuma proposta selecionada</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-[240px]">
          Clique em uma linha da tabela para visualizar o resumo, serviços e histórico.
        </p>
      </aside>
    );
  }

  // Estilo do badge de status
  const getBadgeStatus = (status: PropostaComercialItem["status"]) => {
    switch (status) {
      case "aprovada":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
      case "em_revisao":
        return "bg-purple-500/15 text-purple-400 border-purple-500/25";
      case "enviada":
        return "bg-blue-500/15 text-blue-400 border-blue-500/25";
      case "aceita":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/25";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/25";
    }
  };

  return (
    <aside className="rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
      <div className="space-y-4">
        {/* Topo: Label e Ações */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            PROPOSTA SELECIONADA
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAcoesAberto(!menuAcoesAberto)}
              className="rounded-lg p-1 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <MoreVertical className="size-4" />
            </button>
            {menuAcoesAberto && (
              <div className="absolute right-0 top-6 z-30 w-36 rounded-xl border border-white/10 bg-[#0c1017] p-1 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    onEditar(proposta);
                    setMenuAcoesAberto(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/5 rounded-lg"
                >
                  Editar Proposta
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onVerProposta(proposta);
                    setMenuAcoesAberto(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/5 rounded-lg"
                >
                  Visualizar PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cabeçalho da Empresa & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white shadow-md">
              <Building2 className="size-5.5 text-neutral-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">{proposta.lead_nome}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-400">
                <span>🎵 {proposta.segmento}</span>
              </div>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shrink-0",
              getBadgeStatus(proposta.status)
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {proposta.statusRotulo}
          </span>
        </div>

        {/* Assunto e Identificador */}
        <div className="mt-1">
          <h4 className="text-sm font-semibold text-white tracking-tight">{proposta.assunto}</h4>
          <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
            Proposta {proposta.identificador}
          </span>
        </div>

        {/* 4 Abas Internas */}
        <div className="flex items-center gap-1 border-b border-white/10 pb-1 text-xs">
          <button
            type="button"
            onClick={() => setAbaAtiva("visao_geral")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold transition-all",
              abaAtiva === "visao_geral"
                ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            Visão geral
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("servicos")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold transition-all",
              abaAtiva === "servicos"
                ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            Serviços ({proposta.servicos.length})
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("historico")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold transition-all",
              abaAtiva === "historico"
                ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            Histórico
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("arquivos")}
            className={cn(
              "px-3 py-1.5 rounded-lg font-semibold transition-all",
              abaAtiva === "arquivos"
                ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            )}
          >
            Arquivos ({proposta.arquivos.length})
          </button>
        </div>

        {/* Conteúdo da Aba */}
        {abaAtiva === "visao_geral" && (
          <div className="space-y-3.5">
            {/* Resumo Comercial */}
            <div>
              <span className="text-xs font-semibold text-neutral-300 block mb-1">
                Resumo comercial
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed bg-[#121620] p-3 rounded-xl border border-white/5">
                {proposta.resumoComercial}
              </p>
            </div>

            {/* Boxes de Valor e Validade */}
            <div className="grid grid-cols-2 gap-3">
              {/* Valor */}
              <div className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/25">
                  <Zap className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Valor da proposta</span>
                  <span className="text-sm font-bold font-mono text-white block mt-0.5">
                    {proposta.valorFormatado}
                  </span>
                </div>
              </div>

              {/* Validade */}
              <div className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-300 border border-white/10">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block">Validade</span>
                  <span className="text-xs font-bold font-mono text-white block mt-0.5">
                    {proposta.validade}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ({proposta.diasRestantes} dias restantes)
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Botões de Ações */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onVerProposta(proposta)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f97316] text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <Eye className="size-3.5" />
                  <span>Ver proposta</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditar(proposta)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:bg-[#181e2b] transition-all"
                >
                  <Pencil className="size-3.5" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onAprovar(proposta)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:bg-[#181e2b] transition-all"
                >
                  <Check className="size-3.5 text-emerald-400" />
                  <span>Aprovar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEnviar(proposta)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:bg-[#181e2b] transition-all"
                >
                  <Send className="size-3.5 text-blue-400" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === "servicos" && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {proposta.servicos.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{s.nome}</span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">{s.descricao}</span>
                </div>
                <span className="font-mono font-bold text-orange-400 text-right">{s.valor}</span>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === "historico" && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {proposta.historico.map((h, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-2.5 text-xs"
              >
                <History className="size-4 text-neutral-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-neutral-200 font-medium block">{h.evento}</span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500 font-mono">
                    <span>{h.data} às {h.hora}</span>
                    <span>•</span>
                    <span>Por {h.usuario}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === "arquivos" && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {proposta.arquivos.length === 0 ? (
              <p className="text-xs text-neutral-500 text-center py-4">Nenhum arquivo anexado.</p>
            ) : (
              proposta.arquivos.map((a, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 text-red-400" />
                    <div>
                      <span className="font-medium text-white block truncate max-w-[170px]">{a.nome}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{a.tamanho} • {a.tipo}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onVerProposta(proposta)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                    title="Baixar arquivo"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Card: Sugestões da IA (Container Roxo) */}
      <div className="mt-5 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#181028]/90 to-[#0c0a17]/90 p-3.5 shadow-lg space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Sparkles className="size-4 text-[#c084fc]" />
          <span>Sugestões da IA</span>
        </div>

        <div className="space-y-2">
          {SUGESTOES_IA_PADRAO.map((sug) => (
            <button
              key={sug.id}
              type="button"
              onClick={() => onAplicarSugestaoIa && onAplicarSugestaoIa(sug.id)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-purple-500/15 bg-purple-950/20 hover:border-purple-500/35 hover:bg-purple-950/40 transition-all text-left group"
            >
              <div className="min-w-0 pr-2">
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-purple-300 block truncate transition-colors">
                  {sug.titulo}
                </span>
                <span className="text-[10px] text-neutral-400 line-clamp-1 block mt-0.5">
                  {sug.descricao}
                </span>
              </div>
              <ChevronRight className="size-3.5 text-neutral-400 group-hover:text-purple-300 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
