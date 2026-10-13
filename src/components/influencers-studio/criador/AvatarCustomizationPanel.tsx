import React, { useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import {
  SKIN_TONES,
  HAIR_OPTIONS,
  EYE_OPTIONS,
  FACIAL_EXPRESSIONS,
  type HairStyleOption,
  type EyeColorOption,
  type FacialExpressionOption,
  type PlatformModelItem,
} from "./criador-data";

interface AvatarCustomizationPanelProps {
  avatarName: string;
  onAvatarNameChange: (name: string) => void;
  ageRange: string;
  onAgeRangeChange: (age: string) => void;
  gender: string;
  onGenderChange: (gender: string) => void;
  ethnicity: string;
  onEthnicityChange: (ethnicity: string) => void;
  bodyType: string;
  onBodyTypeChange: (bodyType: string) => void;
  selectedSkinTone: string;
  onSkinToneChange: (toneId: string) => void;
  selectedHair: string;
  onHairChange: (hairId: string) => void;
  selectedEye: string;
  onEyeChange: (eyeId: string) => void;
  selectedExpression: string;
  onExpressionChange: (expressionId: string) => void;
}

export const AvatarCustomizationPanel: React.FC<AvatarCustomizationPanelProps> = ({
  avatarName,
  onAvatarNameChange,
  ageRange,
  onAgeRangeChange,
  gender,
  onGenderChange,
  ethnicity,
  onEthnicityChange,
  bodyType,
  onBodyTypeChange,
  selectedSkinTone,
  onSkinToneChange,
  selectedHair,
  onHairChange,
  selectedEye,
  onEyeChange,
  selectedExpression,
  onExpressionChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    "caracteristicas" | "roupas" | "acessorios" | "cenario"
  >("caracteristicas");

  const [clothingStyle, setClothingStyle] = useState<string>("casual");
  const [accessories, setAccessories] = useState<string[]>([]);
  const [sceneEnvironment, setSceneEnvironment] = useState<string>("estudio");

  const toggleAccessory = (id: string) => {
    setAccessories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="bg-[#0B111E]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-lg">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">
          Personalização
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajuste os detalhes do seu avatar.
        </p>
      </div>

      {/* 4 Tabs */}
      <div className="flex items-center gap-1.5 mt-3.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveTab("caracteristicas")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "caracteristicas"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Características
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("roupas")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "roupas"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Roupas e estilo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("acessorios")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "acessorios"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Acessórios
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cenario")}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "cenario"
              ? "bg-slate-800 text-orange-400 border border-orange-500/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Cenário
        </button>
      </div>

      {/* Tab 1: Características */}
      {activeTab === "caracteristicas" && (
        <div className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {/* Section: Informações básicas */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
              Informações básicas
            </h3>

            {/* Row 1: Nome do avatar & Idade aparente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nome do avatar
                </label>
                <input
                  type="text"
                  value={avatarName}
                  onChange={(e) => onAvatarNameChange(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  placeholder="Nome do avatar"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Idade aparente
                </label>
                <div className="relative">
                  <select
                    value={ageRange}
                    onChange={(e) => onAgeRangeChange(e.target.value)}
                    className="w-full appearance-none bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 text-white text-xs rounded-lg px-3 py-2 pr-8 cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="20-29 anos">20-29 anos</option>
                    <option value="25-34 anos">25-34 anos</option>
                    <option value="35-44 anos">35-44 anos</option>
                    <option value="45-54 anos">45-54 anos</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Gênero, Etnia, Tipo físico */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Gênero
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => onGenderChange(e.target.value)}
                    className="w-full appearance-none bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 text-white text-xs rounded-lg px-2.5 py-2 pr-6 cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Neutro">Neutro</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Etnia
                </label>
                <div className="relative">
                  <select
                    value={ethnicity}
                    onChange={(e) => onEthnicityChange(e.target.value)}
                    className="w-full appearance-none bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 text-white text-xs rounded-lg px-2.5 py-2 pr-6 cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="Branca">Branca</option>
                    <option value="Latina">Latina</option>
                    <option value="Negra">Negra</option>
                    <option value="Asiática">Asiática</option>
                    <option value="Mista">Mista</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Tipo físico
                </label>
                <div className="relative">
                  <select
                    value={bodyType}
                    onChange={(e) => onBodyTypeChange(e.target.value)}
                    className="w-full appearance-none bg-slate-900/90 border border-slate-800 focus:border-orange-500/80 text-white text-xs rounded-lg px-2.5 py-2 pr-6 cursor-pointer focus:outline-none transition-colors"
                  >
                    <option value="Esbelta">Esbelta</option>
                    <option value="Atlético">Atlético</option>
                    <option value="Médio">Médio</option>
                    <option value="Plus Size">Plus Size</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Tom de pele */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Tom de pele
            </label>
            <div className="flex items-center gap-3">
              {SKIN_TONES.map((tone) => {
                const isSelected = selectedSkinTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => onSkinToneChange(tone.id)}
                    title={tone.label}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer border border-black/20 ${
                      isSelected
                        ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900 scale-110 shadow-md"
                        : "hover:scale-105 opacity-90 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: tone.hex }}
                  />
                );
              })}
            </div>
          </div>

          {/* Section: Cabelo */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Cabelo
            </label>
            <div className="grid grid-cols-5 gap-2">
              {HAIR_OPTIONS.map((hair) => {
                const isSelected = selectedHair === hair.id;
                return (
                  <button
                    key={hair.id}
                    type="button"
                    onClick={() => onHairChange(hair.id)}
                    className={`group relative rounded-xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <img
                      src={hair.imageUrl}
                      alt={hair.label}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Olhos */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Olhos
            </label>
            <div className="grid grid-cols-5 gap-2">
              {EYE_OPTIONS.map((eye) => {
                const isSelected = selectedEye === eye.id;
                return (
                  <button
                    key={eye.id}
                    type="button"
                    onClick={() => onEyeChange(eye.id)}
                    className={`group relative rounded-xl overflow-hidden aspect-video border cursor-pointer transition-all ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <img
                      src={eye.imageUrl}
                      alt={eye.label}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Expressões faciais */}
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Expressões faciais
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FACIAL_EXPRESSIONS.map((exp) => {
                const isSelected = selectedExpression === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => onExpressionChange(exp.id)}
                    className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all flex flex-col p-1 bg-slate-900/60 ${
                      isSelected
                        ? "border-orange-500 ring-2 ring-orange-500/80 shadow-md shadow-orange-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden relative mb-1">
                      <img
                        src={exp.imageUrl}
                        alt={exp.label}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                          <Check className="w-2 h-2 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] text-center font-medium truncate ${
                        isSelected ? "text-orange-400 font-semibold" : "text-slate-400"
                      }`}
                    >
                      {exp.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Roupas e estilo */}
      {activeTab === "roupas" && (
        <div className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1">
          <p className="text-xs text-slate-400">
            Selecione o estilo de vestuário prioritário para produções e roteiros comerciais do avatar:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "casual", label: "Casual & Confortável", desc: "Camisas básicas, jeans, tons neutros" },
              { id: "executivo", label: "Executivo & Corporativo", desc: "Blazer, camisa social, postura formal" },
              { id: "moda", label: "Moda & Elegante", desc: "Looks modernos e tendências contemporâneas" },
              { id: "esportivo", label: "Fitness & Esportivo", desc: "Roupas esportivas, activewear e corrida" },
              { id: "ugc", label: "UGC & Autêntico", desc: "Estilo influenciador caseiro para reviews" },
              { id: "gourmet", label: "Gastronomia & Chef", desc: "Avental profissional ou casual de cozinha" },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setClothingStyle(style.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  clothingStyle === style.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold text-white">{style.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Acessórios */}
      {activeTab === "acessorios" && (
        <div className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1">
          <p className="text-xs text-slate-400">
            Adicione ou remova acessórios complementares que serão preservados na identidade:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "oculos", label: "Óculos de grau modernos" },
              { id: "relogio", label: "Relógio de pulso clássico" },
              { id: "brincos", label: "Brincos delicados" },
              { id: "chapeu", label: "Chapéu / Boné casual" },
              { id: "colar", label: "Colar minimalista" },
              { id: "fone", label: "Fones de ouvido over-ear" },
            ].map((acc) => {
              const isChecked = accessories.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggleAccessory(acc.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    isChecked
                      ? "border-orange-500 bg-orange-500/10 text-white"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xs font-medium">{acc.label}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isChecked
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Cenário */}
      {activeTab === "cenario" && (
        <div className="space-y-4 mt-4 flex-1 overflow-y-auto pr-1">
          <p className="text-xs text-slate-400">
            Escolha o ambiente padrão para as cenas e vídeos promocionais:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "estudio", label: "Estúdio Comercial", desc: "Iluminação profissional e fundo clean" },
              { id: "escritorio", label: "Escritório Moderno", desc: "Ambiente corporativo e tech" },
              { id: "casa", label: "Home Office & Sala", desc: "Ambiente acolhedor e familiar" },
              { id: "cidade", label: "Café / Rua Urbana", desc: "Cenário lifestyle cosmopolita" },
              { id: "neutro", label: "Fundo Neutro / Chroma", desc: "Ideal para sobreposição e anúncios" },
              { id: "loja", label: "Showroom Comercial", desc: "Apresentação de produtos físicos" },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSceneEnvironment(sc.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  sceneEnvironment === sc.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-semibold text-white">{sc.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{sc.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCustomizationPanel;
