// Modal de Detalhes da Memória Selecionada
import React from "react";
import {
  Calendar,
  Check,
  Copy,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemoriaRecenteItem } from "./memoria-data";

interface DetalhesMemoriaModalProps {
  aberto: boolean;
  memoria: MemoriaRecenteItem | null;
  onFechar: () => void;
}

export function DetalhesMemoriaModal({
  aberto,
  memoria,
  onFechar,
}: DetalhesMemoriaModalProps) {
  if (!aberto || !memoria) return null;

  const [copiado, setCopiado] = React.useState(false);

  const handleCopiar = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${memoria.titulo}\n${memoria.resumo}\n${memoria.conteudoCompleto || ""}`,
      );
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#1e2638] bg-[#0c1017] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                  memoria.categoriaBadgeCor,
                )}
              >
                {memoria.categoria}
              </span>
              <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                <Calendar className="size-3" />
                <span>{memoria.data}</span>
              </span>
            </div>
            <h3 className="mt-1.5 text-base font-bold text-white leading-snug">
              {memoria.titulo}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Origem: <strong className="text-neutral-200 font-semibold">{memoria.fonte}</strong> • Agente: <strong className="text-orange-400 font-semibold">CEO de IA</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Resumo */}
        <div className="rounded-xl border border-white/5 bg-[#121620] p-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Resumo Sintético
          </p>
          <p className="text-xs leading-relaxed text-neutral-200">
            {memoria.resumo}
          </p>
        </div>

        {/* Conteúdo Contextual */}
        {memoria.conteudoCompleto && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Conteúdo Armazenado no Segundo Cérebro
            </p>
            <div className="rounded-xl border border-[#1e2638] bg-[#07090e] p-4 text-xs leading-relaxed text-neutral-300 whitespace-pre-line font-sans">
              {memoria.conteudoCompleto}
            </div>
          </div>
        )}

        {/* Relacionamentos & Links no Grafo */}
        {memoria.relacionamentos && memoria.relacionamentos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Conexões &amp; Relacionamentos Mapeados
            </p>
            <div className="flex flex-wrap gap-1.5">
              {memoria.relacionamentos.map((rel) => (
                <span
                  key={rel}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-neutral-300"
                >
                  <Tag className="size-3 text-[#f95d14]" />
                  <span>{rel}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1b2232]">
          <button
            type="button"
            onClick={handleCopiar}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            {copiado ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span>{copiado ? "Copiado!" : "Copiar texto"}</span>
          </button>

          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl bg-[#f95d14] px-4 py-2 text-xs font-bold text-white hover:bg-[#ff6c26] transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
