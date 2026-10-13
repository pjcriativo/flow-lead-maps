import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { UGC_PRODUCTS, type UgcProductItem } from "./ugc-data";

interface UgcProductObjectivePanelProps {
  selectedProduct: UgcProductItem;
  onSelectProduct: (product: UgcProductItem) => void;
  onAddProduct?: () => void;
}

export const UgcProductObjectivePanel: React.FC<UgcProductObjectivePanelProps> = ({
  selectedProduct,
  onSelectProduct,
  onAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<"meus" | "biblioteca">("meus");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return UGC_PRODUCTS;
    const q = searchQuery.toLowerCase();
    return UGC_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-orange-400">1 .</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            Produto e Objetivo
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
          Selecione o produto ou serviço que será apresentado e escolha o tipo de vídeo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 mt-3.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab("meus")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "meus"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Meus Produtos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("biblioteca")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "biblioteca"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Produtos da Biblioteca
        </button>
      </div>

      {/* Search & Add Row */}
      <div className="flex items-center gap-2 mt-3.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-orange-500/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={onAddProduct}
          title="Cadastrar novo produto"
          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-orange-400" />
        </button>
      </div>

      {/* Products List */}
      <div className="space-y-2 mt-3.5 flex-1 overflow-y-auto pr-1 scrollbar-thin">
        {filteredProducts.map((product) => {
          const isSelected = selectedProduct.id === product.id;

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/70 shadow-sm shadow-orange-500/10"
                  : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-700"
              }`}
            >
              {/* Product Thumbnail & Details */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/60 shrink-0">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {product.name}
                  </h4>
                  <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/40">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  isSelected
                    ? "border-orange-500 bg-orange-500"
                    : "border-slate-700 bg-slate-850"
                }`}
              >
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UgcProductObjectivePanel;
