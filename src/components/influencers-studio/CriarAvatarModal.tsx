import React, { useState } from "react";
import { X, UserPlus, Upload, Sparkles, Check, Mic } from "lucide-react";

interface CriarAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CriarAvatarModal: React.FC<CriarAvatarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Apresentador Comercial");
  const [voiceGender, setVoiceGender] = useState<"feminina" | "masculina">("feminina");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0F1626] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-left">
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
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Criador de Avatares Próprios
            </h3>
            <p className="text-xs text-slate-400">
              Desenvolva um influencer de IA exclusivo para sua marca.
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Avatar criado com sucesso!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Seu novo avatar já está disponível na sua biblioteca para geração de vídeos.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg transition-all"
            >
              Ver na Biblioteca
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nome do Avatar
              </label>
              <input
                type="text"
                placeholder="Ex: Sophia, Leonardo, Clara..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nicho / Função
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Apresentador Comercial">Apresentador Comercial</option>
                <option value="Especialista em Tecnologia">Especialista em Tecnologia</option>
                <option value="Criador de Conteúdo UGC">Criador de Conteúdo UGC</option>
                <option value="Consultor Corporativo">Consultor Corporativo</option>
                <option value="Influencer de Lifestyle">Influencer de Lifestyle</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Fotos de Referência ou Prompt de IA
              </label>
              <div className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-xl p-4 text-center cursor-pointer bg-slate-900/30 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-300">
                  Arraste fotos ou clique para enviar
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Recomendado: 3 a 5 fotos em alta resolução
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Tom de Voz
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceGender("feminina")}
                  className={`py-2 px-3 text-xs rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                    voiceGender === "feminina"
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Voz Feminina
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGender("masculina")}
                  className={`py-2 px-3 text-xs rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                    voiceGender === "masculina"
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  Voz Masculina
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 shadow-lg transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Treinando modelo de avatar...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Avatar com IA
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
