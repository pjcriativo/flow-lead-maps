import React, { useState } from "react";
import { X, Sparkles, Video, Languages, Mic, Clapperboard, Check } from "lucide-react";
import { FEATURED_AVATARS, type FeaturedAvatarItem } from "./influencers-data";

interface CriarVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar?: FeaturedAvatarItem | null;
}

export const CriarVideoModal: React.FC<CriarVideoModalProps> = ({
  isOpen,
  onClose,
  selectedAvatar,
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string>(
    selectedAvatar?.id || "avatar-isabella"
  );
  const [videoTitle, setVideoTitle] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleGenerateScript = () => {
    setScript(
      "Você já imaginou ter um time comercial que nunca descansa? Com os influencers de IA do Flow Business, seus vídeos são produzidos em minutos e vendem todos os dias no automático. Conheça agora e transforme seus resultados!"
    );
  };

  const handleRender = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsDone(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              AI UGC Video Studio • Novo Vídeo
            </h3>
            <p className="text-xs text-slate-400">
              Produza vídeos de alta conversão com seu avatar de IA selecionado.
            </p>
          </div>
        </div>

        {isDone ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Vídeo enviado para renderização!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Seu vídeo está sendo processado na nuvem de IA e estará pronto em instantes na sua biblioteca.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg transition-all"
            >
              Concluir e Voltar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Avatar Escolhido
              </label>
              <div className="grid grid-cols-6 gap-2">
                {FEATURED_AVATARS.map((av) => (
                  <div
                    key={av.id}
                    onClick={() => setCurrentAvatar(av.id)}
                    className={`cursor-pointer rounded-lg overflow-hidden border p-1 transition-all ${
                      currentAvatar === av.id
                        ? "border-orange-500 bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    }`}
                  >
                    <img
                      src={av.imageUrl}
                      alt={av.name}
                      className="w-full aspect-square object-cover rounded"
                    />
                    <p className="text-[10px] font-semibold text-center text-white truncate mt-1">
                      {av.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Video Title & Aspect Ratio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Título do Vídeo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Anúncio de Lançamento no Instagram"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Formato
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-2 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      aspectRatio === "9:16"
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    9:16 (Reels)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-2 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      aspectRatio === "16:9"
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    16:9 (Vídeo)
                  </button>
                </div>
              </div>
            </div>

            {/* Script Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Roteiro do Avatar
                </label>
                <button
                  type="button"
                  onClick={handleGenerateScript}
                  className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Sugerir com IA
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Digite o texto que o avatar irá falar com sincronia labial perfeita..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleRender}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 shadow-lg transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Renderizando vídeo com IA...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  Renderizar Vídeo Agora
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
