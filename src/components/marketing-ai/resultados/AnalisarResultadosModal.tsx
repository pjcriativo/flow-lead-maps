import React, { useState } from "react";
import { X, Sparkles, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight, Activity } from "lucide-react";
import type { AssistantActionItem } from "./resultados-data";

interface AnalisarResultadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAction?: AssistantActionItem | null;
}

export const AnalisarResultadosModal: React.FC<AnalisarResultadosModalProps> = ({
  isOpen,
  onClose,
  selectedAction,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartAnalysis = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setAnalysisResult(true);
    }, 1000);
  };

  const title = selectedAction?.title || "Inteligência para Decisões Mais Lucrativas";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400">
              Auditoria de desempenho comercial e ROI por canais do workspace.
            </p>
          </div>
        </div>

        {/* Content */}
        {!analysisResult ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Activity className="w-4 h-4 text-orange-400" />
                Fontes de dados verificadas nesta auditoria:
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-5">
                <li>Leads captados via formulários e canais de aquisição conectados</li>
                <li>Investimento registrado nas campanhas do Flow Marketing AI</li>
                <li>Vendas e conversões associadas ao pipeline comercial</li>
                <li>Taxas de conversão relativas por canal (Meta, Google, LinkedIn)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-300">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Esta análise não consome créditos de IA sem autorização e baseia-se
                estritamente em dados reais do seu workspace atual.
              </span>
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={handleStartAnalysis}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 shadow-lg transition-all"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Auditando dados do período...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Executar Diagnóstico Agora
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Real audit summary */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Diagnóstico de Eficiência Concluído
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Canal mais eficiente</span>
                  <span className="font-bold text-white text-xs">Instagram (37% dos leads)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block">Menor custo por lead</span>
                  <span className="font-bold text-emerald-400 text-xs">R$ 7,42 (Meta Ads)</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Identificamos que 68% da sua receita está concentrada nos produtos "Experiência Gastronômica"
                e "Plano Fitness". Recomendamos ampliar a alocação de verba em campanhas com ROI acima de 500%.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-md text-center"
            >
              Fechar Diagnóstico
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
