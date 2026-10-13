import React from "react";
import {
  Search,
  ChevronDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { LICENCAS_TABS } from "./licencas-data";

interface LicencasFilterBarProps {
  selectedTab: string;
  onSelectTab: (tabId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedNiche: string;
  onNicheChange: (niche: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  selectedChannel: string;
  onChannelChange: (channel: string) => void;
  onOpenAdvancedFilters?: () => void;
  onClearFilters?: () => void;
}

export const LicencasFilterBar: React.FC<LicencasFilterBarProps> = ({
  selectedTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedType,
  onTypeChange,
  selectedNiche,
  onNicheChange,
  selectedStatus,
  onStatusChange,
  selectedLanguage,
  onLanguageChange,
  selectedChannel,
  onChannelChange,
  onOpenAdvancedFilters,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Category Pills & Search/Sort/Layout */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {LICENCAS_TABS.map((tab) => {
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
                {tab.count !== undefined && (
                  <span
                    className={`text-[11px] ${
                      isActive ? "text-orange-200" : "text-slate-500"
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
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
              placeholder="Buscar avatares ou influenciadores..."
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
              <option value="nome_asc">Nome (A-Z)</option>
              <option value="renovacao">Próximas renovações</option>
              <option value="mais_usados">Mais utilizados</option>
              <option value="status">Status da licença</option>
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
        {/* Tipo */}
        <div className="relative shrink-0">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os tipos</option>
            <option value="meu_avatar">Meu avatar</option>
            <option value="licenciado">Licenciado</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Nicho */}
        <div className="relative shrink-0">
          <select
            value={selectedNiche}
            onChange={(e) => onNicheChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os nichos</option>
            <option value="Beleza">Beleza</option>
            <option value="Tecnologia">Tecnologia</option>
            <option value="Saúde">Saúde e Bem-estar</option>
            <option value="Finanças">Finanças</option>
            <option value="Educação">Educação</option>
            <option value="Moda">Moda Masculina</option>
            <option value="Viagens">Viagens</option>
            <option value="Gastronomia">Gastronomia</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Status da licença */}
        <div className="relative shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Status da licença</option>
            <option value="ativa">Licença ativa</option>
            <option value="renovacao_breve">Renovação em breve</option>
            <option value="expirada">Expirada</option>
            <option value="suspensa">Suspensa</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Idioma */}
        <div className="relative shrink-0">
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none bg-[#101726]/70 border border-slate-800/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 font-medium cursor-pointer focus:outline-hidden hover:border-slate-700"
          >
            <option value="todos">Todos os idiomas</option>
            <option value="Português">Português</option>
            <option value="Inglês">Inglês</option>
            <option value="Espanhol">Espanhol</option>
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
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
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

        {/* Clear filters button */}
        <button
          onClick={onClearFilters}
          className="p-1.5 bg-[#101726]/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          title="Limpar filtros"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
