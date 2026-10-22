import React, { useState } from "react";
import { FolderPlus, Layers, X, Plus } from "lucide-react";
import type { CategoriaConhecimento } from "./treinamento-data";

interface NovaCategoriaModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriar: (novaCat: CategoriaConhecimento) => void;
}

export function NovaCategoriaModal({ aberto, onFechar, onCriar }: NovaCategoriaModalProps) {
  const [nome, setNome] = useState("");

  if (!aberto) return null;

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const nova: CategoriaConhecimento = {
      id: `cat-${Date.now()}`,
      nome: nome.trim(),
      count: 0,
      icon: Layers,
      cor: "text-orange-400",
    };

    onCriar(nova);
    onFechar();
    setNome("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onFechar} />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#1b2232] bg-[#0c1017] text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1b2232] bg-[#121620] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/20 text-[#f95d14]">
              <FolderPlus className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Nova Categoria de Conhecimento
            </h3>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={salvar} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Pitch de Vendas, Tabela de Preços, FAQ Jurídico..."
              className="mt-1.5 w-full rounded-xl border border-[#1b2232] bg-[#111723] p-2.5 text-xs text-white focus:border-[#f95d14] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1b2232]">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-4 py-2 font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-[#ff6c26]"
            >
              <Plus className="size-4" />
              <span>Criar Categoria</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
