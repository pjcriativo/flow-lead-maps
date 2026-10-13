import React from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { PROJETOS_CATEGORY_TABS } from "./projetos-data";

interface ProjetosFilterBarProps {
  selectedTab: string;
  onSelectTab: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedAvatar: string;
  onAvatarChange: (avatar: string) => void;
  selectedProduct: string;
  onProductChange: (product: string) => void;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  onOpenAdvancedFilters?: () => void;
}

export const ProjetosFilterBar: React.FC<ProjetosFilterBarProps> = ({
  selectedTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedStatus,
  onStatusChange,
  selectedAvatar,
  onAvatarChange,
  selectedProduct,
  onProductChange,
  selectedFormat,
  onFormatChange,
  selectedChannel,
  onChannelChange,
  onOpenAdvancedFilters,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Category Pills & Search/Sort/Layout */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {PROJETOS_CATEGORY_TABS.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-orange-600 to-amber-700 text-white shadow-md shadow-orange-950/40 border border-orange-500/50"
                    : "bg-[#101726]/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] ${
                    isActive ? "text-orange-200" : "text-slate-500"
                  }`}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right tools: Search, Sort by & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar projetos ou vídeos..."
              className="w-full bg-[#101726]/90 border border-slate-800/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none bg-[#101726]/90 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden focus:border-orange-500/60"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="nome_asc">Nome (A-Z)</option>
              <option value="duracao">Maior duração</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Grid / List view toggle */}
          <div className="flex items-center bg-[#101726]/90 border border-slate-800/80 rounded-lg p-0.5">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-800 text-orange-400 border border-orange-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Visualização em Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-800 text-orange-400 border border-orange-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Visualização em Lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Dropdown Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Status */}
        <div className="relative shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os status</option>
            <option value="concluido">Concluídos</option>
            <option value="em_processamento">Em processamento</option>
            <option value="falha">Falhas</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Avatares */}
        <div className="relative shrink-0">
          <select
            value={selectedAvatar}
            onChange={(e) => onAvatarChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os avatares</option>
            <option value="Isabella">Isabella</option>
            <option value="Lucas">Lucas</option>
            <option value="Mariana">Mariana</option>
            <option value="Rafael">Rafael</option>
            <option value="Camila">Camila</option>
            <option value="Bruno">Bruno</option>
            <option value="Juliana">Juliana</option>
            <option value="Mateus">Mateus</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Produtos */}
        <div className="relative shrink-0">
          <select
            value={selectedProduct}
            onChange={(e) => onProductChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os produtos</option>
            <option value="Shampoo Natural">Shampoo Natural</option>
            <option value="Curso Online">Curso Online</option>
            <option value="Smartwatch">Smartwatch</option>
            <option value="Suplemento">Suplemento</option>
            <option value="Skincare">Skincare</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Formatos */}
        <div className="relative shrink-0">
          <select
            value={selectedFormat}
            onChange={(e) => onFormatChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os formatos</option>
            <option value="vertical">Vertical (9:16)</option>
            <option value="horizontal">Horizontal (16:9)</option>
            <option value="quadrado">Quadrado (1:1)</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Canais */}
        <div className="relative shrink-0">
          <select
            value={selectedChannel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os canais</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Reels">Reels</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Mais filtros */}
        <button
          onClick={onOpenAdvancedFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101726]/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3 text-orange-400" />
          <span>Mais filtros</span>
        </button>
      </div>
    </div>
  );
};
