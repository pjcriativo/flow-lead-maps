// Modal de Visualização da Proposta Comercial Completa
import React from "react";
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropostaComercialItem } from "./propostas-data";

interface VerPropostaModalProps {
  proposta: PropostaComercialItem | null;
  aberto: boolean;
  onFechar: () => void;
}

export function VerPropostaModal({
  proposta,
  aberto,
  onFechar,
}: VerPropostaModalProps) {
  if (!aberto || !proposta) return null;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f97316] border border-orange-500/30">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{proposta.assunto}</h2>
                <span className="font-mono text-xs text-neutral-400">
                  {proposta.identificador}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Visualização do documento comercial formatado para o cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:text-white"
            >
              <Printer className="size-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onFechar}
              className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Documento (Estilo Carta Comercial) */}
        <div className="my-4 overflow-y-auto pr-1 space-y-6 text-neutral-200 text-xs">
          {/* Cabeçalho do Papel */}
          <div className="p-6 rounded-2xl bg-[#121620] border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-sm font-bold text-white tracking-wider uppercase block">
                  FLOW BUSINESS
                </span>
                <span className="text-[11px] text-neutral-400">
                  Soluções Comerciais &amp; Inteligência Digital
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-orange-400 block">
                  {proposta.identificador}
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Data: {proposta.data}
                </span>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  Proposta apresentada para
                </span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {proposta.lead_nome}
                </span>
                <span className="text-neutral-400 block">Segmento: {proposta.segmento}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  Validade da Proposta
                </span>
                <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">
                  {proposta.validade} ({proposta.diasRestantes} dias)
                </span>
                <span className="text-neutral-400 block">
                  Responsável: {proposta.responsavelNome}
                </span>
              </div>
            </div>

            {/* Resumo & Escopo */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-white block">
                1. Objetivo &amp; Escopo do Projeto
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                {proposta.resumoComercial}
              </p>
            </div>

            {/* Tabela de Serviços e Entregáveis */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-xs font-bold text-white block">
                2. Investimento &amp; Serviços Inclusos
              </span>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/40 text-neutral-400 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Serviço / Entregável</th>
                      <th className="p-2.5">Descrição</th>
                      <th className="p-2.5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {proposta.servicos.map((s, i) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 font-semibold text-white">{s.nome}</td>
                        <td className="p-2.5 text-neutral-400">{s.descricao}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-white">
                          {s.valor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total e Condições */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                  Condições de Pagamento
                </span>
                <span className="text-xs text-neutral-300">
                  50% de entrada + 50% na entrega ou em até 3x sem juros
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Investimento Total
                </span>
                <span className="text-xl font-bold font-mono text-orange-400 block">
                  {proposta.valorFormatado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="flex items-center justify-end pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition-colors"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
}
