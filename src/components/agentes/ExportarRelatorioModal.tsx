import React, { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileCode,
  Check,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CAMPANHAS_RESULTADOS_PADRAO, INDICADORES_EXECUTIVOS_PADRAO } from "./relatorios-data";

interface ExportarRelatorioModalProps {
  aberto: boolean;
  onFechar: () => void;
  periodoAtual: string;
}

export function ExportarRelatorioModal({
  aberto,
  onFechar,
  periodoAtual,
}: ExportarRelatorioModalProps) {
  const [formato, setFormato] = useState<"csv" | "excel" | "pdf">("csv");
  const [secoes, setSecoes] = useState({
    indicadores: true,
    leadsVendas: true,
    agentes: true,
    origens: true,
    receitaInvestimento: true,
    funil: true,
    nichos: true,
    regioes: true,
    campanhas: true,
    metas: true,
  });
  const [exportando, setExportando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  if (!aberto) return null;

  const toggleSecao = (key: keyof typeof secoes) => {
    setSecoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportar = () => {
    if (formato === "csv") {
      setExportando(true);
      setTimeout(() => {
        // Gerar CSV demonstrativo com cabeçalhos e dados
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "=== RELATÓRIO EXECUTIVO FLOW BUSINESS (DEMO) ===\n";
        csvContent += `Período: ${periodoAtual}\n`;
        csvContent += `Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n`;

        if (secoes.indicadores) {
          csvContent += "--- INDICADORES EXECUTIVOS ---\n";
          csvContent += "Indicador;Valor;Variação;Comparação\n";
          INDICADORES_EXECUTIVOS_PADRAO.forEach((ind) => {
            csvContent += `${ind.nome};${ind.valor};${ind.variacao};${ind.comparacao}\n`;
          });
          csvContent += "\n";
        }

        if (secoes.campanhas) {
          csvContent += "--- CAMPANHAS E RESULTADOS ---\n";
          csvContent += "Campanha;Canal;Nicho;Status;Leads;Reuniões;Propostas;Vendas;Receita;ROI\n";
          CAMPANHAS_RESULTADOS_PADRAO.forEach((c) => {
            csvContent += `${c.nome};${c.canal};${c.nicho};${c.status};${c.leads};${c.reunioes};${c.propostas};${c.vendas};${c.receita};${c.roi}\n`;
          });
          csvContent += "\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `relatorio-flow-business-${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportando(false);
        setSucesso(true);
        setTimeout(() => {
          setSucesso(false);
          onFechar();
        }, 1200);
      }, 600);
    } else {
      // PDF e Excel em integração futura
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c1017] p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f97316] border border-orange-500/30">
              <Download className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exportar Relatório</h2>
              <p className="text-xs text-neutral-400">
                Selecione o formato e as seções desejadas para exportação
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

        {/* Conteúdo */}
        <div className="mt-5 space-y-5">
          {/* Formato */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
              Formato do Arquivo
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormato("csv")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-center",
                  formato === "csv"
                    ? "border-orange-500/60 bg-orange-500/10 text-white shadow-lg shadow-orange-500/10"
                    : "border-white/10 bg-[#121620] text-neutral-400 hover:border-white/20 hover:text-white"
                )}
              >
                <FileCode className="size-6 text-[#f97316]" />
                <span className="text-xs font-bold">CSV (Dados)</span>
                <span className="text-[10px] text-emerald-400 font-medium">Disponível</span>
              </button>

              <button
                type="button"
                onClick={() => setFormato("excel")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-center relative",
                  formato === "excel"
                    ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                    : "border-white/10 bg-[#121620] text-neutral-400 hover:border-white/20 hover:text-white"
                )}
              >
                <FileSpreadsheet className="size-6 text-emerald-400" />
                <span className="text-xs font-bold">Excel (.xlsx)</span>
                <span className="text-[10px] text-amber-400 font-medium">Em breve</span>
              </button>

              <button
                type="button"
                onClick={() => setFormato("pdf")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-center relative",
                  formato === "pdf"
                    ? "border-red-500/60 bg-red-500/10 text-white"
                    : "border-white/10 bg-[#121620] text-neutral-400 hover:border-white/20 hover:text-white"
                )}
              >
                <FileText className="size-6 text-red-400" />
                <span className="text-xs font-bold">PDF Executivo</span>
                <span className="text-[10px] text-amber-400 font-medium">Em breve</span>
              </button>
            </div>
          </div>

          {/* Período */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121620] border border-white/5">
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 text-[#f97316]" />
              <span className="text-xs text-neutral-300">Período Selecionado:</span>
            </div>
            <span className="text-xs font-semibold text-white">{periodoAtual}</span>
          </div>

          {/* Seções a incluir */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
              Seções do Relatório
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: "indicadores", label: "Indicadores Executivos (KPIs)" },
                { id: "leadsVendas", label: "Histórico Leads e Vendas" },
                { id: "agentes", label: "Desempenho por Agente" },
                { id: "origens", label: "Origem dos Leads" },
                { id: "receitaInvestimento", label: "Receita vs Investimento" },
                { id: "funil", label: "Funil Comercial" },
                { id: "nichos", label: "Distribuição por Nicho" },
                { id: "regioes", label: "Regiões com mais Leads" },
                { id: "campanhas", label: "Tabela de Campanhas" },
                { id: "metas", label: "Metas do Período" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleSecao(item.id as keyof typeof secoes)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors",
                    secoes[item.id as keyof typeof secoes]
                      ? "border-orange-500/30 bg-orange-500/10 text-white"
                      : "border-white/5 bg-[#121620]/60 text-neutral-400 hover:text-neutral-200"
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  <div
                    className={cn(
                      "size-4 rounded flex items-center justify-center border",
                      secoes[item.id as keyof typeof secoes]
                        ? "bg-[#f97316] border-[#f97316] text-white"
                        : "border-neutral-600 bg-transparent"
                    )}
                  >
                    {secoes[item.id as keyof typeof secoes] && <Check className="size-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aviso sobre dados demonstrativos */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            <AlertCircle className="size-4 shrink-0 text-blue-400 mt-0.5" />
            <span>
              Este relatório utiliza dados demonstrativos locais preparados para visualização executiva.
              Nenhum dado confidencial ou de produção é exportado.
            </span>
          </div>

          {sucesso && formato !== "csv" && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              O gerador de {formato.toUpperCase()} será conectado à suíte de BI na fase de integração.
              Utilize o formato <strong>CSV</strong> para download imediato dos dados de amostra.
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Download className="size-4" />
            <span>{exportando ? "Gerando arquivo..." : "Baixar Relatório"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
