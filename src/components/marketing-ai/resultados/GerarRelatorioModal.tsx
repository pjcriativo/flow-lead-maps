import React, { useState } from "react";
import { X, FileText, Download, Check, Sparkles, Calendar, Layers } from "lucide-react";

interface GerarRelatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GerarRelatorioModal: React.FC<GerarRelatorioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<"pdf" | "excel" | "executivo">("pdf");
  const [period, setPeriod] = useState("30d");
  const [includeAIInsights, setIncludeAIInsights] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setDownloadReady(true);
    }, 1200);
  };

  const handleDownload = () => {
    // Generate a downloadable text/json representation of the report
    const reportData = {
      title: "Relatório de Resultados e ROI - Flow Marketing AI",
      period: period === "30d" ? "Últimos 30 dias" : period,
      kpis: {
        investimento: "R$ 4.850",
        receita: "R$ 24.580",
        roi: "406%",
        leads: 486,
        cpl: "R$ 9,98",
        vendas: 18,
      },
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-roi-flow-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Relatório Inteligente de Resultados
            </h3>
            <p className="text-xs text-slate-400">
              Exporte indicadores e diagnósticos de ROI do Flow Marketing AI.
            </p>
          </div>
        </div>

        {downloadReady ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Relatório pronto!</h4>
              <p className="text-xs text-slate-400 mt-1">
                O arquivo foi compilado com métricas de investimento, canais e ROI.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Relatório Agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Format choice */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Formato do relatório
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "pdf", label: "PDF Executivo" },
                  { id: "excel", label: "Planilha XLS" },
                  { id: "executivo", label: "Apresentação" },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as any)}
                    className={`py-2 px-2 text-xs rounded-lg border font-medium text-center transition-all ${
                      format === fmt.id
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Period selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Período de análise
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "7d", label: "7 dias" },
                  { id: "30d", label: "30 dias" },
                  { id: "90d", label: "Trimestre" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`py-2 px-2 text-xs rounded-lg border font-medium text-center transition-all ${
                      period === p.id
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI checkbox */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <input
                type="checkbox"
                id="includeAi"
                checked={includeAIInsights}
                onChange={(e) => setIncludeAIInsights(e.target.checked)}
                className="rounded border-slate-700 text-orange-500 focus:ring-orange-500/30"
              />
              <label htmlFor="includeAi" className="text-xs text-slate-300 cursor-pointer">
                Incluir diagnósticos e recomendações da IA
              </label>
            </div>

            {/* Submit */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 shadow-lg transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando métricas...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Compilar Relatório
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
