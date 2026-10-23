// Modal de Ajuste de Orçamento Semanal
// Permite balancear os limites de investimento por categoria e agentes.
import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  DollarSign,
  PieChart,
  Sliders,
  Wallet,
  X,
} from "lucide-react";
import {
  CATEGORIAS_ORCAMENTO,
  ORCAMENTO_TOTAL_SEMANAL,
  ORCAMENTO_CONSUMIDO_SEMANAL,
  type CategoriaOrcamento,
} from "./planejamento-data";

interface AjustarOrcamentoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (total: number, categorias: CategoriaOrcamento[]) => void;
}

export function AjustarOrcamentoModal({
  aberto,
  onFechar,
  onSalvar,
}: AjustarOrcamentoModalProps) {
  const [total, setTotal] = useState(ORCAMENTO_TOTAL_SEMANAL);
  const [categorias, setCategorias] = useState<CategoriaOrcamento[]>(CATEGORIAS_ORCAMENTO);

  if (!aberto) return null;

  const handleAtualizarCategoria = (id: string, novoValor: number) => {
    setCategorias((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const perc = Math.round((novoValor / (total || 1)) * 100);
        return { ...c, valor: novoValor, percentual: perc };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvar(total, categorias);
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Wallet className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ajustar Orçamento Semanal</h3>
            <p className="text-xs text-neutral-400">
              Distribua o teto de investimento entre campanhas, ferramentas e agentes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Teto Total */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Teto Total do Orçamento Semanal (R$)
            </label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2.5 text-sm font-bold text-white focus:border-orange-500/60 focus:outline-none"
            />
          </div>

          {/* Categorias */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <span className="block font-semibold text-neutral-300">
              Distribuição por Categoria
            </span>

            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#141824] p-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`size-2.5 rounded-full ${cat.corPonto}`} />
                  <span className="font-semibold text-white truncate">{cat.nome}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">R$</span>
                  <input
                    type="number"
                    value={cat.valor}
                    onChange={(e) => handleAtualizarCategoria(cat.id, Number(e.target.value))}
                    className="w-24 rounded-lg border border-white/10 bg-[#0c1017] px-2.5 py-1.5 text-xs font-bold text-white text-right focus:border-orange-500/60 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400 w-8 text-right font-medium">
                    {cat.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors"
            >
              <Check className="size-4" />
              <span>Salvar Orçamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
