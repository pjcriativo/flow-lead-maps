import React, { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface InfluencersFiltersBarProps {
  onNicheChange?: (niche: string) => void;
  onLanguageChange?: (lang: string) => void;
  onGenderChange?: (gender: string) => void;
  onSortChange?: (sort: string) => void;
}

export const InfluencersFiltersBar: React.FC<InfluencersFiltersBarProps> = ({
  onNicheChange,
  onLanguageChange,
  onGenderChange,
  onSortChange,
}) => {
  const [selectedNiche, setSelectedNiche] = useState("Todos os nichos");
  const [selectedLanguage, setSelectedLanguage] = useState("Todos os idiomas");
  const [selectedGender, setSelectedGender] = useState("Gênero");
  const [selectedAge, setSelectedAge] = useState("Faixa etária");
  const [selectedStyle, setSelectedStyle] = useState("Estilo de conteúdo");
  const [selectedUsage, setSelectedUsage] = useState("Tipo de uso");
  const [sortBy, setSortBy] = useState("Mais relevantes");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      {/* Filters Group */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Nicho */}
        <div className="relative">
          <select
            value={selectedNiche}
            onChange={(e) => {
              setSelectedNiche(e.target.value);
              onNicheChange?.(e.target.value);
            }}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Todos os nichos">Todos os nichos</option>
            <option value="Lifestyle e Beleza">Lifestyle e Beleza</option>
            <option value="Tecnologia e Negócios">Tecnologia e Negócios</option>
            <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
            <option value="Gastronomia">Gastronomia</option>
            <option value="Viagens">Viagens</option>
            <option value="Esportes">Esportes</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Idioma */}
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              onLanguageChange?.(e.target.value);
            }}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Todos os idiomas">Todos os idiomas</option>
            <option value="Português">Português (BR)</option>
            <option value="Inglês">Inglês</option>
            <option value="Espanhol">Espanhol</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Gênero */}
        <div className="relative">
          <select
            value={selectedGender}
            onChange={(e) => {
              setSelectedGender(e.target.value);
              onGenderChange?.(e.target.value);
            }}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Gênero">Gênero</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Faixa Etária */}
        <div className="relative">
          <select
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Faixa etária">Faixa etária</option>
            <option value="18-24">18-24 anos</option>
            <option value="25-34">25-34 anos</option>
            <option value="35-45">35-45 anos</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Estilo de Conteúdo */}
        <div className="relative">
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Estilo de conteúdo">Estilo de conteúdo</option>
            <option value="UGC">UGC Realista</option>
            <option value="Apresentador">Apresentador Formal</option>
            <option value="Storytelling">Storytelling</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Tipo de Uso */}
        <div className="relative">
          <select
            value={selectedUsage}
            onChange={(e) => setSelectedUsage(e.target.value)}
            className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
          >
            <option value="Tipo de uso">Tipo de uso</option>
            <option value="Redes Sociais">Redes Sociais</option>
            <option value="Anúncios Pagos">Anúncios Pagos</option>
            <option value="Vídeos Institucionais">Institucionais</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* + Mais filtros (2) */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-[#0E1524] hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors cursor-pointer shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Mais filtros</span>
          <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
            2
          </span>
        </button>
      </div>

      {/* Right: Sorting */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            onSortChange?.(e.target.value);
          }}
          className="appearance-none bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer shadow-sm"
        >
          <option value="Mais relevantes">Mais relevantes</option>
          <option value="Mais usados">Mais usados</option>
          <option value="Melhor conversão">Melhor conversão</option>
          <option value="Mais recentes">Mais recentes</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
};
