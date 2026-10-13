import React, { useState, useMemo, useRef } from "react";
import { Check, Upload, ChevronDown, Sparkles, User, ShieldAlert } from "lucide-react";
import { PLATFORM_MODELS, type PlatformModelItem } from "./criador-data";

interface AvatarAppearanceLibraryProps {
  selectedModel: PlatformModelItem;
  onSelectModel: (model: PlatformModelItem) => void;
  onUploadCustomImage?: (file: File) => void;
}

export const AvatarAppearanceLibrary: React.FC<AvatarAppearanceLibraryProps> = ({
  selectedModel,
  onSelectModel,
  onUploadCustomImage,
}) => {
  const [activeTab, setActiveTab] = useState<"modelos" | "zero" | "clonar">("modelos");
  const [selectedStyle, setSelectedStyle] = useState<string>("todos");
  const [selectedGender, setSelectedGender] = useState<string>("todos");
  const [selectedAge, setSelectedAge] = useState<string>("todas");
  const [selectedEthnicity, setSelectedEthnicity] = useState<string>("todas");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter models
  const filteredModels = useMemo(() => {
    return PLATFORM_MODELS.filter((model) => {
      if (selectedStyle !== "todos" && model.category.toLowerCase() !== selectedStyle.toLowerCase()) {
        return false;
      }
      if (selectedGender !== "todos" && model.gender !== selectedGender) {
        return false;
      }
      if (selectedAge !== "todas" && model.ageRange !== selectedAge) {
        return false;
      }
      if (selectedEthnicity !== "todas" && model.ethnicity !== selectedEthnicity) {
        return false;
      }
      return true;
    });
  }, [selectedStyle, selectedGender, selectedAge, selectedEthnicity]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadCustomImage) {
      onUploadCustomImage(file);
    }
  };

  const getCategoryBadgeClass = (color: PlatformModelItem["categoryColor"]) => {
    switch (color) {
      case "orange":
        return "bg-rose-500/80 text-rose-100";
      case "blue":
        return "bg-sky-500/80 text-sky-100";
      case "purple":
        return "bg-purple-500/80 text-purple-100";
      case "cyan":
        return "bg-cyan-500/80 text-cyan-100";
      case "pink":
        return "bg-pink-500/80 text-pink-100";
      case "emerald":
        return "bg-emerald-500/80 text-emerald-100";
      case "amber":
        return "bg-amber-500/80 text-amber-100";
      case "indigo":
        return "bg-indigo-500/80 text-indigo-100";
      default:
        return "bg-orange-500/80 text-orange-100";
    }
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">
          Aparência do Avatar
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Escolha um ponto de partida ou crie um avatar do zero.
        </p>
      </div>

      {/* 3 Tabs */}
      <div className="flex items-center gap-1.5 mt-3.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab("modelos")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "modelos"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Modelos da plataforma
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("zero")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "zero"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Criar do zero
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clonar")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "clonar"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Clonar aparência
        </button>
      </div>

      {activeTab === "modelos" && (
        <>
          {/* 4 Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
            {/* Filter 1: Estilo */}
            <div className="relative">
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium rounded-lg px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60"
              >
                <option value="todos">Todos os estilos</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Negócios">Negócios</option>
                <option value="Moda">Moda</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Beleza">Beleza</option>
                <option value="Saúde">Saúde</option>
                <option value="Viagens">Viagens</option>
                <option value="Corporativo">Corporativo</option>
                <option value="UGC">UGC</option>
                <option value="Esportes">Esportes</option>
                <option value="Educação">Educação</option>
                <option value="Gastronomia">Gastronomia</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Filter 2: Gênero */}
            <div className="relative">
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium rounded-lg px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60"
              >
                <option value="todos">Gênero</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Filter 3: Faixa Etária */}
            <div className="relative">
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value)}
                className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium rounded-lg px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60"
              >
                <option value="todas">Faixa etária</option>
                <option value="20-29 anos">20-29 anos</option>
                <option value="25-34 anos">25-34 anos</option>
                <option value="30-40 anos">30-40 anos</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Filter 4: Etnia */}
            <div className="relative">
              <select
                value={selectedEthnicity}
                onChange={(e) => setSelectedEthnicity(e.target.value)}
                className="w-full appearance-none bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-medium rounded-lg px-2.5 py-1.5 pr-6 cursor-pointer focus:outline-none focus:border-orange-500/60"
              >
                <option value="todas">Etnia</option>
                <option value="Branca">Branca</option>
                <option value="Latina">Latina</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3x4 Grid of 12 Platform Models */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-3.5 flex-1 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin">
            {filteredModels.map((model) => {
              const isSelected = selectedModel.id === model.id;

              return (
                <div
                  key={model.id}
                  onClick={() => onSelectModel(model)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all border aspect-[3/4] bg-slate-900 flex flex-col justify-end p-2 ${
                    isSelected
                      ? "border-orange-500 ring-2 ring-orange-500/80 shadow-lg shadow-orange-500/20"
                      : "border-slate-800 hover:border-slate-700 hover:scale-[1.02]"
                  }`}
                >
                  {/* Photo */}
                  <img
                    src={model.imageUrl}
                    alt={model.name}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Gradient shadow for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                  {/* Top-right selection badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}

                  {/* Bottom details: Name + category badge */}
                  <div className="relative z-10 space-y-1">
                    <span className="block text-xs font-bold text-white drop-shadow truncate">
                      {model.name}
                    </span>
                    <span
                      className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded ${getCategoryBadgeClass(
                        model.categoryColor,
                      )}`}
                    >
                      {model.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "zero" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl my-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Criar Avatar Exclusivo do Zero</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Configure as características detalhadas no painel central (idade, etnia, cabelo, olhos e expressão) para sintetizar uma identidade visual única.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectModel({
                id: "custom-zero",
                name: "Novo Avatar",
                category: "Personalizado",
                categoryColor: "orange",
                imageUrl: "/images/hero_influencer_banner.jpg",
                gender: "Feminino",
                ageRange: "25-34 anos",
                ethnicity: "Branca",
                bodyType: "Esbelta",
              });
            }}
            className="px-3.5 py-2 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/40 rounded-lg hover:bg-orange-500/20 transition-all cursor-pointer"
          >
            Configurar características no painel central
          </button>
        </div>
      )}

      {activeTab === "clonar" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl my-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Clonar Aparência Autorizada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Envie fotos de referência sob consentimento estrito. É proibida a clonagem ou uso indevido de imagem de terceiros sem autorização documentada.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-orange-400" />
            <span>Enviar fotos com consentimento</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload button at bottom */}
      <div className="mt-3.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-[0.99]"
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <span>Carregar minha própria imagem</span>
        </button>
      </div>
    </div>
  );
};

export default AvatarAppearanceLibrary;
