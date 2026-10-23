// Modal para Exibição dos Detalhes dos Arquivos e Entregáveis Ilustrativos
// Informa que se trata de um exemplo e que a geração de arquivos estará disponível futuramente.
import React from "react";
import { Download, FileCode, FileSpreadsheet, FileText, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArquivoExemploModalProps {
  arquivo: {
    nome: string;
    subtitulo: string;
    tipo: "pdf" | "xlsx" | "json";
  } | null;
  onFechar: () => void;
}

export function ArquivoExemploModal({
  arquivo,
  onFechar,
}: ArquivoExemploModalProps) {
  if (!arquivo) return null;

  const renderIcon = () => {
    if (arquivo.tipo === "pdf") {
      return (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <FileText className="size-6" />
        </div>
      );
    }
    if (arquivo.tipo === "xlsx") {
      return (
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <FileSpreadsheet className="size-6" />
        </div>
      );
    }
    return (
      <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
        <FileCode className="size-6" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          {renderIcon()}
          <div>
            <h3 className="text-sm font-bold text-white">{arquivo.nome}</h3>
            <p className="text-xs text-neutral-400">{arquivo.subtitulo}</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-200/90 space-y-2 mb-4">
          <div className="flex items-center gap-1.5 font-bold text-blue-300">
            <Info className="size-4" />
            <span>Arquivo Demonstrativo</span>
          </div>
          <p className="leading-relaxed">
            Este é um arquivo de exemplo visual gerado pela proposta estruturada do CEO de IA. A geração e download automático de PDFs executivos, planilhas orçamentárias e arquivos JSON de automações serão ativados na etapa de conexão com o motor de IA.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
