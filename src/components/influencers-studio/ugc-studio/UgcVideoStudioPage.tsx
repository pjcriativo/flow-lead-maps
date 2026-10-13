import React, { useState } from "react";
import { UgcStudioHeader } from "./UgcStudioHeader";
import { UgcProductionStepper } from "./UgcProductionStepper";
import { UgcProductObjectivePanel } from "./UgcProductObjectivePanel";
import { UgcScriptTextPanel } from "./UgcScriptTextPanel";
import { UgcAvatarVoicePanel } from "./UgcAvatarVoicePanel";
import { UgcStyleFormatPanel } from "./UgcStyleFormatPanel";
import { UgcPreviewStoryboardPanel } from "./UgcPreviewStoryboardPanel";
import { UgcProjectSummaryCard } from "./UgcProjectSummaryCard";
import { VideoPlayerModal } from "../VideoPlayerModal";
import {
  UGC_PRODUCTS,
  UGC_AVATARS,
  type UgcProductItem,
  type UgcAvatarItem,
} from "./ugc-data";
import { Check, Sparkles, X, ShieldCheck, PlayCircle } from "lucide-react";

interface UgcVideoStudioPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToBiblioteca?: () => void;
  onNavigateToCriador?: () => void;
  onNavigateToMarketing?: () => void;
}

export const UgcVideoStudioPage: React.FC<UgcVideoStudioPageProps> = ({
  user,
  unreadNotifications,
  onNavigateToBiblioteca,
  onNavigateToCriador,
  onNavigateToMarketing,
}) => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Column 1: Produto
  const [selectedProduct, setSelectedProduct] = useState<UgcProductItem>(UGC_PRODUCTS[0]);

  // Column 2: Roteiro e Texto
  const [selectedObjective, setSelectedObjective] = useState<string>("anuncio");
  const [scriptPoints, setScriptPoints] = useState<string>(
    "Destaque os benefícios do curso, fale sobre o mercado de marketing digital, mostre resultados e inclua uma chamada para ação.",
  );
  const [selectedDuration, setSelectedDuration] = useState<string>("30s");

  // Column 3: Avatar e Voz
  const [selectedAvatar, setSelectedAvatar] = useState<UgcAvatarItem>(UGC_AVATARS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("pt-BR");
  const [selectedVoice, setSelectedVoice] = useState<string>("Adriana (Natural)");

  // Column 4: Estilo e Formato
  const [selectedFormat, setSelectedFormat] = useState<string>("vertical");
  const [selectedStyle, setSelectedStyle] = useState<string>("natural");
  const [selectedScenario, setSelectedScenario] = useState<string>("interno");

  // Modals & notifications
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTutorialsModalOpen, setIsTutorialsModalOpen] = useState(false);
  const [isScriptPreviewModalOpen, setIsScriptPreviewModalOpen] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleGenerateScriptWithAi = () => {
    showToast("✨ Roteiro atualizado com base nos benefícios do " + selectedProduct.name);
  };

  const handleConfirmGeneration = () => {
    setIsGenerating(true);
    setIsGenerateConfirmOpen(false);
    setTimeout(() => {
      setIsGenerating(false);
      showToast(`🎬 Job de vídeo de 30s iniciado com sucesso! Saldo debitado: 10 créditos.`);
      setIsVideoModalOpen(true);
    }, 1200);
  };

  const getFormatLabel = () => {
    switch (selectedFormat) {
      case "vertical":
        return "Vertical (9:16)";
      case "quadrado":
        return "Quadrado (1:1)";
      default:
        return "Horizontal (16:9)";
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-7 space-y-4 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumbs, Title & Top-Right Banner */}
      <UgcStudioHeader
        onVerTutoriais={() => setIsTutorialsModalOpen(true)}
        onNavigateToBiblioteca={onNavigateToBiblioteca}
      />

      {/* 2. 5-Step Horizontal Stepper Ribbon */}
      <UgcProductionStepper
        currentStep={currentStep}
        onSelectStep={(s) => setCurrentStep(s)}
        completedSteps={completedSteps}
      />

      {/* 3. Top Row: 4 Panels Grid (Columns 1, 2, 3, 4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
        {/* Column 1: Produto e Objetivo */}
        <UgcProductObjectivePanel
          selectedProduct={selectedProduct}
          onSelectProduct={(p) => {
            setSelectedProduct(p);
            showToast(`Produto "${p.name}" selecionado.`);
          }}
          onAddProduct={() => {
            if (onNavigateToMarketing) {
              onNavigateToMarketing();
            } else {
              showToast("Direcionando para o cadastro de produtos...");
            }
          }}
        />

        {/* Column 2: Roteiro e Texto */}
        <UgcScriptTextPanel
          selectedObjective={selectedObjective}
          onSelectObjective={setSelectedObjective}
          scriptPoints={scriptPoints}
          onScriptPointsChange={setScriptPoints}
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          onGenerateScript={handleGenerateScriptWithAi}
          onPreviewScript={() => setIsScriptPreviewModalOpen(true)}
        />

        {/* Column 3: Avatar e Voz */}
        <UgcAvatarVoicePanel
          selectedAvatar={selectedAvatar}
          onSelectAvatar={(a) => {
            setSelectedAvatar(a);
            showToast(`Avatar ${a.name} selecionada.`);
          }}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          selectedVoice={selectedVoice}
          onSelectVoice={setSelectedVoice}
        />

        {/* Column 4: Estilo e Formato */}
        <UgcStyleFormatPanel
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          selectedStyle={selectedStyle}
          onSelectStyle={setSelectedStyle}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
        />
      </div>

      {/* 4. Bottom Row: 5. Prévia e Geração (approx 75%) + Resumo (approx 25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Video Player & Storyboard Scenes */}
        <div className="lg:col-span-9 flex flex-col">
          <UgcPreviewStoryboardPanel
            avatarImageUrl={selectedAvatar.imageUrl}
            avatarName={selectedAvatar.name}
            onPlayFullDemo={() => setIsVideoModalOpen(true)}
          />
        </div>

        {/* Right: Resumo & Botão Gerar agora */}
        <div className="lg:col-span-3 flex flex-col">
          <UgcProjectSummaryCard
            productName={selectedProduct.name}
            videoType={selectedObjective === "anuncio" ? "Anúncio" : "Review Comercial"}
            duration={selectedDuration === "30s" ? "30 segundos" : "15 segundos"}
            avatarName={selectedAvatar.name}
            voiceName={selectedVoice}
            format={getFormatLabel()}
            onEdit={() => {
              const el = document.getElementById("ugc-top-panels");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            onGerarVideo={() => setIsGenerateConfirmOpen(true)}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-orange-500/60 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        video={{
          id: "video-ugc-demo",
          title: `Vídeo UGC de Anúncio • ${selectedProduct.name}`,
          date: "Hoje",
          duration: "00:30",
          status: "concluido",
          thumbnailUrl: selectedAvatar.imageUrl,
          avatarName: selectedAvatar.name,
          views: "38.2K",
        }}
      />

      {/* Tutorials Modal */}
      {isTutorialsModalOpen && (
        <div
          onClick={() => setIsTutorialsModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-orange-400" />
                <span>Tutoriais do AI UGC Video Studio</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsTutorialsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Aprenda como estruturar roteiros de alta conversão para seus produtos e obter os melhores resultados com os avatares virtuais:
            </p>
            <div className="space-y-2">
              {[
                { title: "Como criar ganchos magnéticos nos primeiros 3 segundos", dur: "04:12" },
                { title: "Adaptando roteiros de infoprodutos para formato TikTok/Reels", dur: "06:30" },
                { title: "Boas práticas de tom de voz e sincronia labial", dur: "05:15" },
              ].map((tut, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <span className="text-xs font-semibold text-white">{tut.title}</span>
                  <span className="text-[10px] text-orange-400 font-mono">{tut.dur}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Script Preview Modal */}
      {isScriptPreviewModalOpen && (
        <div
          onClick={() => setIsScriptPreviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span>Pré-visualização do Roteiro</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScriptPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-orange-400">[0:00 - 0:05] Gancho de Abertura:</p>
              <p>Olá! Eu sou a {selectedAvatar.name} e hoje vim revelar por que o {selectedProduct.name} está mudando o mercado.</p>

              <p className="font-semibold text-orange-400">[0:05 - 0:15] Dor e Oportunidade:</p>
              <p>{scriptPoints}</p>

              <p className="font-semibold text-orange-400">[0:15 - 0:25] Demonstração e Solução:</p>
              <p>Com metodologia prática e direto ao ponto, você economiza tempo e acelera seus resultados comerciais.</p>

              <p className="font-semibold text-orange-400">[0:25 - 0:30] Chamada para Ação:</p>
              <p>Clique agora no link e garanta sua vaga com condições exclusivas!</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsScriptPreviewModalOpen(false)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold"
              >
                Fechar e aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Confirmation Dialog */}
      {isGenerateConfirmOpen && (
        <div
          onClick={() => setIsGenerateConfirmOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Confirmar Produção de Vídeo</h3>
              <button
                type="button"
                onClick={() => setIsGenerateConfirmOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                Esta ação gerará o vídeo comercial sintético de 30 segundos utilizando o modelo neural autorizado do seu workspace.
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Produto:</span>
                <span className="font-medium text-white">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Avatar:</span>
                <span className="font-medium text-white">{selectedAvatar.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Formato:</span>
                <span className="font-medium text-white">{getFormatLabel()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Duração estimada:</span>
                <span className="font-medium text-white">30 segundos</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>Custo da operação:</span>
                <span className="text-orange-400">10 créditos</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGenerateConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmGeneration}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
              >
                Confirmar e Gerar (10 créditos)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UgcVideoStudioPage;
