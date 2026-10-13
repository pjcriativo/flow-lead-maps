import React, { useState } from "react";
import { AvatarCreatorHeader } from "./AvatarCreatorHeader";
import { AvatarCreationStepper } from "./AvatarCreationStepper";
import { AvatarAppearanceLibrary } from "./AvatarAppearanceLibrary";
import { AvatarCustomizationPanel } from "./AvatarCustomizationPanel";
import { AvatarPreviewPanel } from "./AvatarPreviewPanel";
import {
  AvatarVoiceStep,
  AvatarPersonalityStep,
  AvatarSceneStyleStep,
  AvatarReviewStep,
} from "./AvatarAdditionalSteps";
import { VideoPlayerModal } from "../VideoPlayerModal";
import {
  PLATFORM_MODELS,
  type PlatformModelItem,
} from "./criador-data";
import { Check, ShieldCheck, X } from "lucide-react";

interface AvatarCreatorPageProps {
  user?: {
    name?: string;
    avatarUrl?: string;
    initials?: string;
  };
  unreadNotifications?: number;
  onNavigateToBiblioteca?: () => void;
  onNavigateToUgcStudio?: () => void;
}

export const AvatarCreatorPage: React.FC<AvatarCreatorPageProps> = ({
  user,
  unreadNotifications,
  onNavigateToBiblioteca,
  onNavigateToUgcStudio,
}) => {
  // Stepper state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Avatar customization form states (default to Sofia)
  const [selectedModel, setSelectedModel] = useState<PlatformModelItem>(PLATFORM_MODELS[0]);
  const [avatarName, setAvatarName] = useState<string>("Sofia");
  const [ageRange, setAgeRange] = useState<string>("25-34 anos");
  const [gender, setGender] = useState<string>("Feminino");
  const [ethnicity, setEthnicity] = useState<string>("Branca");
  const [bodyType, setBodyType] = useState<string>("Esbelta");

  const [selectedSkinTone, setSelectedSkinTone] = useState<string>("skin-1");
  const [selectedHair, setSelectedHair] = useState<string>("hair-1");
  const [selectedEye, setSelectedEye] = useState<string>("eye-3");
  const [selectedExpression, setSelectedExpression] = useState<string>("normal");

  // Modals & Feedback
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // When a model is chosen in Library
  const handleSelectModel = (model: PlatformModelItem) => {
    setSelectedModel(model);
    setAvatarName(model.name);
    setAgeRange(model.ageRange);
    setGender(model.gender);
    setEthnicity(model.ethnicity);
    setBodyType(model.bodyType);
    showToast(`Modelo ${model.name} selecionado com sucesso!`);
  };

  // Nav actions
  const handleSalvarRascunho = () => {
    showToast(`Rascunho do avatar "${avatarName}" salvo no seu workspace!`);
  };

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    const next = Math.min(5, currentStep + 1);
    setCurrentStep(next);
  };

  const handlePrevStep = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
  };

  const handleConfirmCreation = () => {
    showToast(`🎉 Avatar exclusivo "${avatarName}" registrado com sucesso no seu workspace!`);
    setTimeout(() => {
      if (onNavigateToBiblioteca) {
        onNavigateToBiblioteca();
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 lg:p-7 space-y-4 animate-in fade-in duration-300">
      {/* 1. Header with Breadcrumbs, Title & Top-Right Banner */}
      <AvatarCreatorHeader
        onVerExemplos={() => setIsExamplesModalOpen(true)}
        onNavigateToBiblioteca={onNavigateToBiblioteca}
      />

      {/* 2. 5-Step Horizontal Stepper Ribbon */}
      <AvatarCreationStepper
        currentStep={currentStep}
        onSelectStep={(step) => setCurrentStep(step)}
        completedSteps={completedSteps}
      />

      {/* 3. Main View: Step 1 (3 Columns Desktop) or Steps 2-5 (Dedicated Studio Views) */}
      {currentStep === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Column 1 (Left): Aparência do Avatar (Library) */}
          <div className="lg:col-span-4 flex flex-col">
            <AvatarAppearanceLibrary
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              onUploadCustomImage={() => setIsUploadModalOpen(true)}
            />
          </div>

          {/* Column 2 (Center): Personalização (Characteristics Form) */}
          <div className="lg:col-span-4 flex flex-col">
            <AvatarCustomizationPanel
              avatarName={avatarName}
              onAvatarNameChange={setAvatarName}
              ageRange={ageRange}
              onAgeRangeChange={setAgeRange}
              gender={gender}
              onGenderChange={setGender}
              ethnicity={ethnicity}
              onEthnicityChange={setEthnicity}
              bodyType={bodyType}
              onBodyTypeChange={setBodyType}
              selectedSkinTone={selectedSkinTone}
              onSkinToneChange={setSelectedSkinTone}
              selectedHair={selectedHair}
              onHairChange={setSelectedHair}
              selectedEye={selectedEye}
              onEyeChange={setSelectedEye}
              selectedExpression={selectedExpression}
              onExpressionChange={setSelectedExpression}
            />
          </div>

          {/* Column 3 (Right): Prévia do Avatar */}
          <div className="lg:col-span-4 flex flex-col">
            <AvatarPreviewPanel
              currentImageUrl={selectedModel.imageUrl}
              avatarName={avatarName}
              onVerEmMovimento={() => setIsVideoModalOpen(true)}
              onSalvarRascunho={handleSalvarRascunho}
              onContinuar={handleNextStep}
            />
          </div>
        </div>
      ) : currentStep === 2 ? (
        <AvatarVoiceStep
          avatarName={avatarName}
          onBack={handlePrevStep}
          onNext={handleNextStep}
          nextLabel="Continuar para Personalidade"
        />
      ) : currentStep === 3 ? (
        <AvatarPersonalityStep
          avatarName={avatarName}
          onBack={handlePrevStep}
          onNext={handleNextStep}
          nextLabel="Continuar para Estilo e Cenários"
        />
      ) : currentStep === 4 ? (
        <AvatarSceneStyleStep
          avatarName={avatarName}
          onBack={handlePrevStep}
          onNext={handleNextStep}
          nextLabel="Continuar para Revisão e Criação"
        />
      ) : (
        <AvatarReviewStep
          avatarName={avatarName}
          imageUrl={selectedModel.imageUrl}
          ageRange={ageRange}
          gender={gender}
          ethnicity={ethnicity}
          onBack={handlePrevStep}
          onConfirmCreation={handleConfirmCreation}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-orange-500/60 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2">
          <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Video Player Modal for "Ver em movimento" */}
      {isVideoModalOpen && (
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          video={{
            id: "video-sofia-demo",
            title: `Apresentação em Movimento • ${avatarName}`,
            date: "Hoje",
            duration: "00:32",
            status: "concluido",
            thumbnailUrl: selectedModel.imageUrl,
            avatarName: avatarName,
            views: "24.5K",
          }}
        />
      )}

      {/* Examples Modal for "Ver exemplos" */}
      {isExamplesModalOpen && (
        <div
          onClick={() => setIsExamplesModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Exemplos de Avatares Criados</h3>
              <button
                type="button"
                onClick={() => setIsExamplesModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Estes são avatares exclusivos treinados para marcas parceiras. Cada um possui consistência de identidade, expressões e voz personalizada:
            </p>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORM_MODELS.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                  <div className="aspect-[3/4] relative">
                    <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover object-center" />
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-xs font-bold text-white">{m.name}</div>
                    <div className="text-[10px] text-orange-400">{m.category}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsExamplesModalOpen(false);
                  if (onNavigateToBiblioteca) onNavigateToBiblioteca();
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold"
              >
                Explorar catálogo completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Custom Image Modal */}
      {isUploadModalOpen && (
        <div
          onClick={() => setIsUploadModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B111E] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Carregar Imagem de Referência</h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-300 leading-relaxed">
                Você declara possuir os direitos legais e consentimento explícito da imagem enviada para criação de avatar comercial.
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-orange-500/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-900/40">
              <span className="text-xs font-semibold text-white block">Clique para selecionar fotos</span>
              <span className="text-[11px] text-slate-400 block mt-1">PNG, JPG ou WEBP (até 15MB)</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  showToast("Foto autorizada carregada com sucesso!");
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold"
              >
                Confirmar envio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCreatorPage;
