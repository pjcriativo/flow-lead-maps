// Modal de Apresentação: Criar Proposta Assistida por IA
import React, { useState } from "react";
import {
  X,
  Sparkles,
  Building2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CriarComIaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAvancarParaGeracao?: () => void;
}

export function CriarComIaModal({
  aberto,
  onFechar,
  onAvancarParaGeracao,
}: CriarComIaModalProps) {
  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [leadSelecionado, setLeadSelecionado] = useState("Escritório Parelheiros");
  const [tomSelecionado, setTomSelecionado] = useState("Consultivo & Executivo");

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-purple-500/30 bg-[#0c1017] p-6 shadow-2xl space-y-5">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-[#c084fc] border border-purple-500/30 shadow-md">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Criar Proposta Assistida por IA</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-[#c084fc] border border-purple-500/30">
                  RECOMENDADO
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                A IA analisa os dados do lead, perfil de consumo e monta a estrutura ideal de vendas
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Etapas Visuais */}
        <div className="grid grid-cols-3 gap-2 text-xs border-b border-white/5 pb-3">
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
              passo === 1
                ? "border-purple-500/40 bg-purple-500/10 text-white"
                : "border-white/5 text-neutral-400"
            )}
          >
            <span className="size-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span className="font-semibold truncate">Lead &amp; Diagnóstico</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
              passo === 2
                ? "border-purple-500/40 bg-purple-500/10 text-white"
                : "border-white/5 text-neutral-400"
            )}
          >
            <span className="size-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span className="font-semibold truncate">Serviços &amp; Valor</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
              passo === 3
                ? "border-purple-500/40 bg-purple-500/10 text-white"
                : "border-white/5 text-neutral-400"
            )}
          >
            <span className="size-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span className="font-semibold truncate">Revisão &amp; Envio</span>
          </div>
        </div>

        {/* Conteúdo Dinâmico */}
        {passo === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Selecione o Lead / Oportunidade
              </label>
              <select
                value={leadSelecionado}
                onChange={(e) => setLeadSelecionado(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="Escritório Parelheiros">Escritório Parelheiros · Jurídico</option>
                <option value="Barbearia Studio Calebe">Barbearia Studio Calebe · Beleza</option>
                <option value="Pileggi Costa Advocacia">Pileggi Costa Advocacia · Jurídico</option>
                <option value="Dra. Julia Lins | Odontologia">Dra. Julia Lins · Saúde</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2 text-xs">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="size-4" /> Diagnóstico prévio identificado pela IA
              </span>
              <p className="text-neutral-300 leading-relaxed text-[11px]">
                O lead possui forte autoridade offline, mas ausência de posicionamento digital e formulários
                de captação com SEO. A IA recomenda focar a proposta em <strong>Identidade Visual + Site Institucional</strong> com foco em geração de clientes.
              </p>
            </div>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-3">
            <span className="text-xs font-semibold text-neutral-300 block">
              Serviços Recomendados pelo Modelo
            </span>
            <div className="space-y-2">
              {[
                { nome: "Identidade Visual Completa", desc: "Manual, paleta e logo", valor: "R$ 2.200,00" },
                { nome: "Site Institucional Multipage", desc: "5 páginas com SEO", valor: "R$ 2.600,00" },
                { nome: "Integração WhatsApp & LGPD", desc: "Captação direta de leads", valor: "Incluso" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{s.nome}</span>
                    <span className="text-[11px] text-neutral-400 block">{s.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-purple-400">{s.valor}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-neutral-400">Total Sugerido:</span>
              <span className="text-base font-bold font-mono text-white">R$ 4.800,00</span>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> Estrutura da Proposta Pronta
              </span>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                A proposta foi estruturada com introdução personalizada, escopo técnico, entregáveis,
                cronograma de 20 dias úteis e condições comerciais.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#121620] border border-white/5 text-[11px] text-neutral-400">
              * Nesta etapa de apresentação visual, a geração completa de IA está pronta para conectar ao catálogo no próximo release do Criador Profissional.
            </div>
          </div>
        )}

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:bg-white/5"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {passo > 1 && (
              <button
                type="button"
                onClick={() => setPasso((p) => (p - 1) as 1 | 2 | 3)}
                className="px-3.5 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200"
              >
                Voltar
              </button>
            )}
            {passo < 3 ? (
              <button
                type="button"
                onClick={() => setPasso((p) => (p + 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-colors"
              >
                <span>Avançar</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onFechar();
                  if (onAvancarParaGeracao) onAvancarParaGeracao();
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-[#a855f7] text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 transition-all"
              >
                <Sparkles className="size-3.5" />
                <span>Salvar &amp; Revisar Proposta</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
